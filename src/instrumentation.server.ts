import { SENTRY_ENVIRONMENT, SENTRY_RELEASE } from '$env/static/private';
import { PUBLIC_SENTRY_DSN } from '$env/static/public';
import * as Sentry from '@sentry/sveltekit';
import {
	sanitize_sentry_breadcrumb,
	sanitize_sentry_event
} from '$lib/server/observability/sentry';

Sentry.init({
	dsn: PUBLIC_SENTRY_DSN || undefined,

	tracesSampleRate: 1.0,

	beforeSend(event) {
		return sanitize_sentry_event(event);
	},

	beforeBreadcrumb(breadcrumb) {
		return sanitize_sentry_breadcrumb(breadcrumb);
	},

	...(SENTRY_RELEASE ? { release: SENTRY_RELEASE } : {}),
	...(SENTRY_ENVIRONMENT ? { environment: SENTRY_ENVIRONMENT } : {}),
	sendDefaultPii: false

	// uncomment the line below to enable Spotlight (https://spotlightjs.com)
	// spotlight: import.meta.env.DEV,
});
