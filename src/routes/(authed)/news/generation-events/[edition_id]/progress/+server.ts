import { notify_generation_progress } from '$lib/server/generation_events';
import { derive_progress_secret, verify_progress_signature } from '$lib/server/generation_progress';
import { error, json } from '@sveltejs/kit';
import * as v from 'valibot';

const progress_payload_schema = v.object({
	source_id: v.pipe(v.string(), v.nonEmpty()),
	correlation_id: v.pipe(v.string(), v.nonEmpty()),
	message: v.pipe(v.string(), v.nonEmpty())
});

export async function POST({ params, request }) {
	const raw_body = await request.text();
	let payload: unknown;

	try {
		payload = JSON.parse(raw_body);
	} catch {
		error(400, 'Invalid progress payload');
	}

	const parsed_payload = v.safeParse(progress_payload_schema, payload);

	if (!parsed_payload.success) {
		error(400, 'Invalid progress payload');
	}

	const secret = derive_progress_secret({
		edition_id: params.edition_id,
		source_id: parsed_payload.output.source_id,
		correlation_id: parsed_payload.output.correlation_id
	});
	const is_valid_signature = verify_progress_signature({
		raw_body,
		secret,
		timestamp: request.headers.get('x-news-progress-timestamp'),
		signature: request.headers.get('x-news-progress-signature')
	});

	if (!is_valid_signature) {
		error(401, 'Invalid progress signature');
	}

	await notify_generation_progress({
		edition_id: params.edition_id,
		message: parsed_payload.output.message
	});

	return json({ ok: true });
}
