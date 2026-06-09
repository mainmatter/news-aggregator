import {
	notify_generation_finished,
	notify_generation_progress,
	type GenerationProgressEvent,
	type GenerationFinishedEvent
} from '$lib/server/generation_events';

export async function step_notify_generation_finished(event: GenerationFinishedEvent) {
	'use step';

	await notify_generation_finished(event);
}

export async function step_notify_generation_progress(
	event: Omit<GenerationProgressEvent, 'type'>
) {
	'use step';

	await notify_generation_progress(event);
}
