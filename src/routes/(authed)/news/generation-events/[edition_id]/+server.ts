import { auth } from '$lib/server/auth';
import { get_owned_edition } from '$lib/server/editions';
import {
	add_generation_listener,
	type GenerationEvent,
	type GenerationFinishedEvent
} from '$lib/server/generation_events';
import { error, redirect } from '@sveltejs/kit';

const encoder = new TextEncoder();

function encode_sse_event(event: string, data: unknown) {
	return encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

function send_generation_finished(
	controller: ReadableStreamDefaultController,
	event: GenerationFinishedEvent
) {
	controller.enqueue(encode_sse_event('generation-finished', event));
}

function send_generation_progress(
	controller: ReadableStreamDefaultController,
	event: GenerationEvent
) {
	controller.enqueue(encode_sse_event('generation-progress', event));
}

export async function GET({ params, request }) {
	const session = await auth.api.getSession({ headers: request.headers });

	if (!session?.user) {
		redirect(302, '/');
	}

	const edition = await get_owned_edition(params.edition_id, session.user.id);

	if (!edition) {
		error(404, 'Edition not found');
	}

	let unsubscribe: (() => Promise<void> | void) | undefined;

	const stream = new ReadableStream({
		async start(controller) {
			let is_closed = false;

			const mark_closed = () => {
				if (is_closed) {
					return;
				}

				is_closed = true;
			};

			const close_stream = () => {
				if (is_closed) {
					return;
				}

				mark_closed();
				controller.close();
			};

			const abort_handler = () => {
				mark_closed();
				void unsubscribe?.();
			};

			request.signal.addEventListener('abort', abort_handler, { once: true });

			const subscription = await add_generation_listener(params.edition_id, (event) => {
				if (is_closed) {
					return;
				}

				if (event.type === 'progress') {
					send_generation_progress(controller, event);
					return;
				}

				send_generation_finished(controller, event);
				void subscription.unsubscribe();
				close_stream();
			});
			unsubscribe = subscription.unsubscribe;

			if (is_closed) {
				await subscription.unsubscribe();
				return;
			}

			controller.enqueue(encoder.encode(': connected\n\n'));
		},
		async cancel() {
			await unsubscribe?.();
		}
	});

	return new Response(stream, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache, no-transform',
			Connection: 'keep-alive',
			'X-Accel-Buffering': 'no'
		}
	});
}
