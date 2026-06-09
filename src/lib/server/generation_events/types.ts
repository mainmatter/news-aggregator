export type GenerationProgressEventInput = {
	edition_id: string;
	message: string;
};

export type GenerationProgressEvent = GenerationProgressEventInput & {
	type: 'progress';
};

export type GenerationFinishedEvent = {
	type?: 'finished';
	edition_id: string;
	status: 'published' | 'failed' | 'restored';
};

export type GenerationEvent = GenerationFinishedEvent | GenerationProgressEvent;

export type GenerationEventHandler = (event: GenerationEvent) => void;

export type GenerationEventSubscription = {
	unsubscribe: () => Promise<void> | void;
};

export abstract class GenerationEventBus {
	abstract publish(event: GenerationEvent): Promise<boolean>;
	abstract get_recent_progress(edition_id: string): Promise<GenerationProgressEvent[]>;
	abstract subscribe(
		edition_id: string,
		handler: GenerationEventHandler
	): Promise<GenerationEventSubscription>;
}
