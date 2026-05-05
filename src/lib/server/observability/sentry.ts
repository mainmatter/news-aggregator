import {
	sanitize_sentry_breadcrumb,
	sanitize_sentry_event
} from '$lib/observability/sentry_sanitize';
import * as Sentry from '@sentry/sveltekit';

export { sanitize_sentry_breadcrumb, sanitize_sentry_event };

export type generation_failure_classification = {
	type: string;
	fingerprint: string[];
};

export type generation_exception_report = {
	error: unknown;
	tags?: Record<string, string>;
	contexts?: Record<string, Record<string, unknown>>;
	extra?: Record<string, unknown>;
};

export const generation_failure_codes = {
	edition_generation_start_failed: 'edition_generation_start_failed',
	workflow_generation_failed: 'workflow_generation_failed',
	source_generation_failed: 'source_generation_failed',
	source_webhook_timeout: 'source_webhook_timeout',
	sandbox_launch_failed: 'sandbox_launch_failed',
	sandbox_launch_cleanup_failed: 'sandbox_launch_cleanup_failed',
	sandbox_stop_wait_failed: 'sandbox_stop_wait_failed',
	sandbox_stop_get_failed: 'sandbox_stop_get_failed',
	sandbox_stop_failed: 'sandbox_stop_failed',
	consume_source_webhook_failed: 'consume_source_webhook_failed'
} as const;

export type generation_failure_code =
	(typeof generation_failure_codes)[keyof typeof generation_failure_codes];

function is_generation_failure_code(value: string): value is generation_failure_code {
	return Object.values(generation_failure_codes).includes(value as generation_failure_code);
}

export function classify_generation_failure(
	error_code?: generation_failure_code
): generation_failure_classification {
	if (!error_code) {
		return {
			type: 'unknown',
			fingerprint: ['{{ default }}', 'edition_generation', 'unknown']
		};
	}

	return {
		type: error_code,
		fingerprint: ['{{ default }}', 'edition_generation', error_code]
	};
}

export function build_generation_exception_metadata({
	tags,
	contexts,
	extra
}: {
	tags?: Record<string, string>;
	contexts?: Record<string, Record<string, unknown>>;
	extra?: Record<string, unknown>;
}) {
	const error_code = tags?.error_code;
	const classification = classify_generation_failure(
		error_code && is_generation_failure_code(error_code) ? error_code : undefined
	);

	return {
		classification,
		tags: {
			failure_type: classification.type,
			...(tags ?? {})
		},
		contexts: contexts ?? {},
		extra: extra ?? {}
	};
}

export function report_generation_exception(args: generation_exception_report) {
	const metadata = build_generation_exception_metadata(args);

	Sentry.withScope((scope) => {
		scope.setFingerprint(metadata.classification.fingerprint);

		for (const [key, value] of Object.entries(metadata.tags)) {
			scope.setTag(key, value);
		}

		for (const [key, value] of Object.entries(metadata.contexts)) {
			scope.setContext(key, value);
		}

		for (const [key, value] of Object.entries(metadata.extra)) {
			scope.setExtra(key, value);
		}

		Sentry.captureException(args.error);
	});
}


export function build_sandbox_observability_env({
	sentry_trace,
	baggage,
	correlation_id
}: {
	sentry_trace?: string;
	baggage?: string;
	correlation_id: string;
}) {
	const values: Record<string, string> = {
		GENERATION_CORRELATION_ID: correlation_id
	};

	if (sentry_trace) {
		values.SENTRY_TRACE = sentry_trace;
	}

	if (baggage) {
		values.SENTRY_BAGGAGE = baggage;
	}

	return values;
}
