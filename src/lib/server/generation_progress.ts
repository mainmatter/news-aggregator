import { env } from '$env/dynamic/private';
import { createHmac, timingSafeEqual } from 'node:crypto';

const max_progress_callback_age_ms = 10 * 60 * 1000;

export function derive_progress_secret({
	edition_id,
	source_id,
	correlation_id
}: {
	edition_id: string;
	source_id: string;
	correlation_id: string;
}) {
	if (!env.WEBHOOK_SECRET) {
		throw new Error('WEBHOOK_SECRET is not configured');
	}

	return createHmac('sha256', env.WEBHOOK_SECRET)
		.update(`generation-progress:${edition_id}:${source_id}:${correlation_id}`)
		.digest('hex');
}

function safe_compare(left: string, right: string) {
	const left_buffer = Buffer.from(left);
	const right_buffer = Buffer.from(right);

	if (left_buffer.length !== right_buffer.length) {
		return false;
	}

	return timingSafeEqual(left_buffer, right_buffer);
}

export function verify_progress_signature({
	raw_body,
	signature,
	timestamp,
	secret
}: {
	raw_body: string;
	signature: string | null;
	timestamp: string | null;
	secret: string;
}) {
	if (!timestamp || !signature) {
		return false;
	}

	const timestamp_ms = Number(timestamp);
	if (!Number.isFinite(timestamp_ms)) {
		return false;
	}

	if (Math.abs(Date.now() - timestamp_ms) > max_progress_callback_age_ms) {
		return false;
	}

	const expected_signature = createHmac('sha256', secret)
		.update(`${timestamp}.${raw_body}`)
		.digest('hex');

	return safe_compare(signature, expected_signature);
}
