import { env } from '$env/dynamic/private';
import { createHmac, timingSafeEqual } from 'node:crypto';
import * as v from 'valibot';
import {
	source_callback_payload_schema,
	type SourceGenerationResult,
	type WorkflowUserSource
} from '../types';

const max_callback_age_ms = 10 * 60 * 1000;

function derive_callback_secret(webhook_token: string) {
	return createHmac('sha256', env.WEBHOOK_SECRET).update(webhook_token).digest('hex');
}

function safe_compare(left: string, right: string) {
	const left_buffer = Buffer.from(left);
	const right_buffer = Buffer.from(right);

	if (left_buffer.length !== right_buffer.length) {
		return false;
	}

	return timingSafeEqual(left_buffer, right_buffer);
}

export async function consume_source_webhook({
	request,
	webhook_token,
	source
}: {
	request: Request;
	webhook_token: string;
	source: WorkflowUserSource;
}) {
	'use step';

	if (!env.WEBHOOK_SECRET) {
		throw new Error('WEBHOOK_SECRET is not configured');
	}

	const timestamp = request.headers.get('x-news-callback-timestamp');
	const signature = request.headers.get('x-news-callback-signature');

	if (!timestamp || !signature) {
		throw new Error(`Missing callback headers for ${source.display_name}`);
	}

	const timestamp_ms = Number(timestamp);
	if (!Number.isFinite(timestamp_ms)) {
		throw new Error(`Invalid callback timestamp for ${source.display_name}`);
	}

	if (Math.abs(Date.now() - timestamp_ms) > max_callback_age_ms) {
		throw new Error(`Expired callback timestamp for ${source.display_name}`);
	}

	const raw_body = await request.text();
	const derived_secret = derive_callback_secret(webhook_token);
	const expected_signature = createHmac('sha256', derived_secret)
		.update(`${timestamp}.${raw_body}`)
		.digest('hex');

	if (!safe_compare(signature, expected_signature)) {
		throw new Error(`Invalid callback signature for ${source.display_name}`);
	}

	const parsed_payload = v.parse(source_callback_payload_schema, JSON.parse(raw_body));

	if (parsed_payload.source_id !== source.source_id) {
		throw new Error(`Unexpected source callback payload for ${source.display_name}`);
	}

	if (parsed_payload.source_url !== source.canonical_url) {
		throw new Error(`Unexpected source URL in callback for ${source.display_name}`);
	}

	return parsed_payload satisfies SourceGenerationResult;
}
