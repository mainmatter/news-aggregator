import { PUBLIC_SENTRY_DSN } from '$env/static/public';
import {
	sanitize_sentry_breadcrumb,
	sanitize_sentry_event
} from '$lib/observability/sentry_sanitize';
import { handleErrorWithSentry, replayIntegration } from '@sentry/sveltekit';
import * as Sentry from '@sentry/sveltekit';

Sentry.init({
	dsn: PUBLIC_SENTRY_DSN || undefined,

	tracesSampleRate: 1.0,

	// Enable logs to be sent to Sentry
	enableLogs: true,

	// This sets the sample rate to be 10%. You may want this to be 100% while
	// in development and sample at a lower rate in production
	replaysSessionSampleRate: 0.1,

	// If the entire session is not sampled, use the below sample rate to sample
	// sessions when an error occurs.
	replaysOnErrorSampleRate: 1.0,

	integrations: [
		replayIntegration({
			maskAllText: true,
			blockAllMedia: true
		})
	],

	beforeSend(event) {
		return sanitize_sentry_event(event);
	},

	beforeBreadcrumb(breadcrumb) {
		return sanitize_sentry_breadcrumb(breadcrumb);
	},

	sendDefaultPii: false
});

// If you have a custom error handler, pass it to `handleErrorWithSentry`
export const handleError = handleErrorWithSentry();
