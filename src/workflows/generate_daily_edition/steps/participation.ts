import {
	finalize_pending_participation_as_error,
	finalize_source_participation,
	mark_participation_running,
	SOURCE_SUCCESS_ZERO_LINKS_FALLBACK_REASON
} from '$lib/server/source_participation';
import type { SourceGenerationResult } from '../types';

export async function step_mark_participation_running(args: {
	daily_edition_id: string;
	user_source_id: string;
}) {
	'use step';

	await mark_participation_running(args);
}

export async function step_finalize_source_participation(args: {
	daily_edition_id: string;
	user_source_id: string;
	result: SourceGenerationResult;
}) {
	'use step';

	const { result } = args;
	const status: 'success' | 'error' = result.status;
	const selected_article_count = status === 'success' ? result.articles.length : 0;

	let reason: string | null = result.reason ?? null;

	if (status === 'success' && selected_article_count === 0 && !reason) {
		reason = SOURCE_SUCCESS_ZERO_LINKS_FALLBACK_REASON;
	}

	if (status === 'error' && !reason) {
		reason = result.error ?? null;
	}

	const error_message = status === 'error' ? (result.error ?? null) : null;

	await finalize_source_participation({
		daily_edition_id: args.daily_edition_id,
		user_source_id: args.user_source_id,
		status,
		selected_article_count,
		reason,
		error_message
	});
}

export async function step_finalize_edition_participation_failed(args: {
	daily_edition_id: string;
	error_message: string;
}) {
	'use step';

	await finalize_pending_participation_as_error({
		daily_edition_id: args.daily_edition_id,
		error_message: args.error_message
	});
}
