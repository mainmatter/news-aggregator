import { Redis } from '@upstash/redis';
import { randomUUID } from 'node:crypto';
import {
	GenerationEventBus,
	type GenerationEvent,
	type GenerationEventHandler,
	type GenerationFinishedEvent,
	type GenerationProgressEvent
} from './types';

const recent_progress_ttl_seconds = 60 * 60;

const valid_statuses = new Set<GenerationFinishedEvent['status']>([
	'published',
	'failed',
	'restored'
]);

function parse_generation_event(message: unknown): GenerationEvent | undefined {
	const parsed = typeof message === 'string' ? JSON.parse(message) : message;

	if (!parsed || typeof parsed !== 'object') {
		return undefined;
	}

	if (!('edition_id' in parsed) || typeof parsed.edition_id !== 'string') {
		return undefined;
	}

	if ('type' in parsed && parsed.type === 'progress') {
		if (!('message' in parsed) || typeof parsed.message !== 'string') {
			return undefined;
		}

		return {
			type: 'progress',
			edition_id: parsed.edition_id,
			message: parsed.message
		};
	}

	if (!('status' in parsed) || typeof parsed.status !== 'string') {
		return undefined;
	}

	if (!valid_statuses.has(parsed.status as GenerationFinishedEvent['status'])) {
		return undefined;
	}

	return {
		edition_id: parsed.edition_id,
		status: parsed.status as GenerationFinishedEvent['status']
	};
}

function parse_generation_progress_event(message: unknown): GenerationProgressEvent | undefined {
	const parsed_message = typeof message === 'string' ? JSON.parse(message) : message;
	const event =
		parsed_message &&
		typeof parsed_message === 'object' &&
		'event' in parsed_message
			? parse_generation_event(parsed_message.event)
			: parse_generation_event(parsed_message);

	return event?.type === 'progress' ? event : undefined;
}

export class RedisGenerationEventBus extends GenerationEventBus {
	#redis: Redis;

	constructor(config: { url: string; token: string }) {
		super();
		this.#redis = new Redis(config);
	}

	async publish(event: GenerationEvent) {
		if (event.type === 'progress') {
			await this.#store_progress(event);
		}

		const listeners_count = await this.#redis.publish(
			this.#get_channel(event.edition_id),
			JSON.stringify(event)
		);

		return listeners_count > 0;
	}

	async get_recent_progress(edition_id: string) {
		const messages = await this.#redis.smembers<string[]>(this.#get_recent_progress_set_key(edition_id));

		return messages.sort().flatMap((message) => {
			try {
				const event = parse_generation_progress_event(message);
				return event ? [event] : [];
			} catch {
				return [];
			}
		});
	}

	async subscribe(edition_id: string, handler: GenerationEventHandler) {
		const subscription = this.#redis.subscribe<unknown>(this.#get_channel(edition_id));
		subscription.on('message', ({ message }) => {
			try {
				const event = parse_generation_event(message);

				if (event) {
					handler(event);
				}
			} catch {
				// Ignore malformed pub/sub messages for this channel.
			}
		});

		return {
			async unsubscribe() {
				subscription.removeAllListeners();
				await subscription.unsubscribe();
			}
		};
	}

	#get_channel(edition_id: string) {
		return `news-aggregator:generation:${edition_id}`;
	}

	async #store_progress(event: GenerationProgressEvent) {
		const set_key = this.#get_recent_progress_set_key(event.edition_id);
		const member = JSON.stringify({ id: `${Date.now()}:${randomUUID()}`, event });
		await this.#redis.sadd(set_key, member);
		await this.#redis.expire(set_key, recent_progress_ttl_seconds);
	}

	#get_recent_progress_set_key(edition_id: string) {
		return `news-aggregator:generation:${edition_id}:progress`;
	}
}
