import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';
import type {
	GenerationEventBus,
	GenerationEventHandler,
	GenerationFinishedEvent,
	GenerationProgressEventInput
} from './types';

export type { GenerationEvent, GenerationFinishedEvent, GenerationProgressEvent } from './types';

let generation_event_bus: Promise<GenerationEventBus> | undefined;

function get_generation_event_bus() {
	generation_event_bus ??= dev
		? import('./in-memory').then(
				({ InMemoryGenerationEventBus }) => new InMemoryGenerationEventBus()
			)
		: import('./redis').then(({ RedisGenerationEventBus }) => {
				if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) {
					throw new Error('Upstash Redis REST credentials are required for generation events.');
				}

				return new RedisGenerationEventBus({
					url: env.UPSTASH_REDIS_REST_URL,
					token: env.UPSTASH_REDIS_REST_TOKEN
				});
			});

	return generation_event_bus;
}

export async function notify_generation_finished(event: GenerationFinishedEvent) {
	const bus = await get_generation_event_bus();
	return bus.publish(event);
}

export async function notify_generation_progress(event: GenerationProgressEventInput) {
	const bus = await get_generation_event_bus();
	return bus.publish({ type: 'progress', ...event });
}

export async function get_recent_generation_progress(edition_id: string) {
	const bus = await get_generation_event_bus();
	return bus.get_recent_progress(edition_id);
}

export async function add_generation_listener(edition_id: string, handler: GenerationEventHandler) {
	const bus = await get_generation_event_bus();
	return bus.subscribe(edition_id, handler);
}
