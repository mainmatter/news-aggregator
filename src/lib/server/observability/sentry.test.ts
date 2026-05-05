import * as Sentry from '@sentry/sveltekit';
import { describe, expect, it, vi } from 'vitest';
import {
	build_sandbox_observability_env,
	classify_generation_failure,
	report_generation_exception,
	sanitize_sentry_event
} from './sentry';

vi.mock('@sentry/sveltekit', () => ({
	withScope: vi.fn((callback) => {
		callback({
			setFingerprint: vi.fn(),
			setTag: vi.fn(),
			setContext: vi.fn(),
			setExtra: vi.fn()
		});
	}),
	captureException: vi.fn()
}));

describe('sanitize_sentry_event', () => {
	it('redacts secrets from request headers and breadcrumb data', () => {
		const event = {
			request: {
				headers: {
					authorization: 'Bearer super-secret-token',
					cookie: 'session=abc123',
					'x-api-key': 'provider-key'
				}
			},
			breadcrumbs: [
				{
					category: 'http',
					data: {
						headers: {
							authorization: 'Bearer another-secret',
							'x-webhook-secret': 'hook-secret'
						}
					}
				}
			]
		};

		const sanitized_event = sanitize_sentry_event(event);

		expect(sanitized_event.request.headers.authorization).toBe('[REDACTED]');
		expect(sanitized_event.request.headers.cookie).toBe('[REDACTED]');
		expect(sanitized_event.request.headers['x-api-key']).toBe('[REDACTED]');
		expect(sanitized_event.breadcrumbs[0].data.headers.authorization).toBe('[REDACTED]');
		expect(sanitized_event.breadcrumbs[0].data.headers['x-webhook-secret']).toBe('[REDACTED]');
	});
});

describe('classify_generation_failure', () => {
	it('classifies known error codes', () => {
		expect(classify_generation_failure('source_webhook_timeout')).toEqual({
			type: 'source_webhook_timeout',
			fingerprint: ['{{ default }}', 'edition_generation', 'source_webhook_timeout']
		});
	});

	it('falls back to unknown when error code is missing', () => {
		expect(classify_generation_failure(undefined)).toEqual({
			type: 'unknown',
			fingerprint: ['{{ default }}', 'edition_generation', 'unknown']
		});
	});
});

describe('report_generation_exception', () => {
	it('captures generation exceptions with Sentry', () => {
		const error = new Error('generation failed');

		report_generation_exception({
			error,
			tags: { error_code: 'source_generation_failed' }
		});

		expect(Sentry.withScope).toHaveBeenCalledOnce();
		expect(Sentry.captureException).toHaveBeenCalledWith(error);
	});
});

describe('build_sandbox_observability_env', () => {
	it('injects trace continuation fields and correlation id', () => {
		expect(
			build_sandbox_observability_env({
				sentry_trace: 'trace-value',
				baggage: 'baggage-value',
				correlation_id: 'corr-123'
			})
		).toEqual({
			SENTRY_TRACE: 'trace-value',
			SENTRY_BAGGAGE: 'baggage-value',
			GENERATION_CORRELATION_ID: 'corr-123'
		});
	});
});
