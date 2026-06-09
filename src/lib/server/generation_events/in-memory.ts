import {
	GenerationEventBus,
	type GenerationEvent,
	type GenerationEventHandler,
	type GenerationProgressEvent
} from './types';

export class InMemoryGenerationEventBus extends GenerationEventBus {
	#listeners = new Map<string, Set<GenerationEventHandler>>();
	#recent_progress = new Map<string, GenerationProgressEvent[]>();

	async publish(event: GenerationEvent) {
		if (event.type === 'progress') {
			this.#store_progress(event);
		}

		const listeners = this.#listeners.get(event.edition_id);

		if (!listeners || listeners.size === 0) {
			return false;
		}

		for (const listener of listeners) {
			listener(event);
		}

		return true;
	}

	async get_recent_progress(edition_id: string) {
		return this.#recent_progress.get(edition_id) ?? [];
	}

	async subscribe(edition_id: string, handler: GenerationEventHandler) {
		const listeners = this.#listeners.get(edition_id) ?? new Set<GenerationEventHandler>();
		listeners.add(handler);
		this.#listeners.set(edition_id, listeners);

		return {
			unsubscribe: () => {
				listeners.delete(handler);

				if (listeners.size === 0) {
					this.#listeners.delete(edition_id);
				}
			}
		};
	}

	#store_progress(event: GenerationProgressEvent) {
		const stored_events = this.#recent_progress.get(event.edition_id) ?? [];
		stored_events.push(event);
		this.#recent_progress.set(event.edition_id, stored_events);
	}
}
