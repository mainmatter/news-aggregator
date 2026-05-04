import * as Sentry from '@sentry/sveltekit';
import { build_generation_exception_metadata } from './sentry';

export function capture_generation_exception({
	error,
	tags,
	contexts,
	extra
}: {
	error: unknown;
	tags?: Record<string, string>;
	contexts?: Record<string, Record<string, unknown>>;
	extra?: Record<string, unknown>;
}) {
	const metadata = build_generation_exception_metadata({ tags, contexts, extra });

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

		Sentry.captureException(error);
	});
}
