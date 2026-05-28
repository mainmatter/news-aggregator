import { db } from '$lib/server/db';
import { source_participation_log } from '$lib/server/db/schema';
import { and, eq, inArray } from 'drizzle-orm';

export const SOURCE_INACTIVE_REASON = 'Source inactive when generation started.';
export const SOURCE_SUCCESS_ZERO_LINKS_FALLBACK_REASON =
	'No articles were selected for this source, and no reason was provided.';
export const GENERATION_ABORTED_PREFIX = 'Generation aborted before source completed: ';

export type ParticipationStatus =
	| 'queued'
	| 'running'
	| 'success'
	| 'error'
	| 'skipped';

export type SourceSnapshotEntry = {
	user_source_id: string;
	source_id: string;
	display_name: string;
	canonical_url: string;
	is_active: boolean;
	label: string | null;
};

export type CreateParticipationLogsInput = {
	user_id: string;
	daily_edition_id: string;
	edition_date: string;
	snapshot: SourceSnapshotEntry[];
};

export async function create_participation_logs({
	user_id,
	daily_edition_id,
	edition_date,
	snapshot
}: CreateParticipationLogsInput) {
	await db.transaction(async (transaction) => {
		await transaction
			.delete(source_participation_log)
			.where(eq(source_participation_log.daily_edition_id, daily_edition_id));

		if (snapshot.length > 0) {
			const now = new Date();
			await transaction.insert(source_participation_log).values(
				snapshot.map((entry) => ({
					user_id,
					daily_edition_id,
					edition_date,
					user_source_id: entry.user_source_id,
					source_id: entry.source_id,
					source_display_name_snapshot: entry.display_name,
					source_canonical_url_snapshot: entry.canonical_url,
					status: entry.is_active
						? ('queued' satisfies ParticipationStatus)
						: ('skipped' satisfies ParticipationStatus),
					selected_article_count: 0,
					reason: entry.is_active ? null : SOURCE_INACTIVE_REASON,
					finished_at: entry.is_active ? null : now
				}))
			);
		}
	});
}

export async function mark_participation_running({
	daily_edition_id,
	user_source_id
}: {
	daily_edition_id: string;
	user_source_id: string;
}) {
	await db
		.update(source_participation_log)
		.set({
			status: 'running' satisfies ParticipationStatus,
			started_at: new Date()
		})
		.where(
			and(
				eq(source_participation_log.daily_edition_id, daily_edition_id),
				eq(source_participation_log.user_source_id, user_source_id)
			)
		);
}

export async function finalize_source_participation({
	daily_edition_id,
	user_source_id,
	status,
	selected_article_count,
	reason,
	error_message
}: {
	daily_edition_id: string;
	user_source_id: string;
	status: 'success' | 'error';
	selected_article_count: number;
	reason: string | null;
	error_message: string | null;
}) {
	await db
		.update(source_participation_log)
		.set({
			status,
			selected_article_count,
			reason,
			error_message,
			finished_at: new Date()
		})
		.where(
			and(
				eq(source_participation_log.daily_edition_id, daily_edition_id),
				eq(source_participation_log.user_source_id, user_source_id)
			)
		);
}

export async function finalize_pending_participation_as_error({
	daily_edition_id,
	error_message
}: {
	daily_edition_id: string;
	error_message: string;
}) {
	const reason = `${GENERATION_ABORTED_PREFIX}${error_message}`;
	const now = new Date();

	await db
		.update(source_participation_log)
		.set({
			status: 'error' satisfies ParticipationStatus,
			reason,
			error_message,
			finished_at: now
		})
		.where(
			and(
				eq(source_participation_log.daily_edition_id, daily_edition_id),
				inArray(source_participation_log.status, ['queued', 'running'])
			)
		);
}
