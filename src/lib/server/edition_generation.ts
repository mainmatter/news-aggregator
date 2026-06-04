import { dev } from '$app/environment';
import { db } from '$lib/server/db';
import { daily_edition, daily_edition_article, source, user_source } from '$lib/server/db/schema';
import {
	generation_failure_codes,
	report_generation_exception
} from '$lib/server/observability/sentry';
import {
	get_default_edition_title,
	get_owned_edition_generation_state
} from '$lib/server/editions';
import {
	create_participation_logs,
	finalize_pending_participation_as_error
} from '$lib/server/source_participation';
import * as Sentry from '@sentry/sveltekit';
import { and, desc, eq, isNotNull, lt, sql } from 'drizzle-orm';
import { start } from 'workflow/api';
import { generate_daily_edition_workflow } from '../../workflows/generate_daily_edition';
import { persist_edition } from '../../workflows/generate_daily_edition/steps/persist_edition';
import type {
	PreparationGenerationInput,
	PreparedGenerationState,
	SourceSnapshotEntry
} from '../../workflows/generate_daily_edition/types';

async function get_tunnel_base_url() {
	if (!dev) return undefined;
	return 'http://host.docker.internal:5173';
}

function get_error_message(error: unknown, fallback: string): string {
	if (error instanceof Error) return error.message;
	if (typeof error === 'string') return error;

	if (error && typeof error === 'object') {
		if ('message' in error && typeof error.message === 'string') return error.message;

		if ('cause' in error) {
			const cause_message: string = get_error_message(error.cause, fallback);
			if (cause_message !== fallback) return cause_message;
		}

		try {
			return JSON.stringify(error).slice(0, 500);
		} catch {
			// Fall through to the fallback below.
		}
	}

	return fallback;
}

async function load_source_snapshot(user_id: string): Promise<SourceSnapshotEntry[]> {
	const rows = await db
		.select({
			user_source_id: user_source.id,
			source_id: user_source.source_id,
			display_name: user_source.display_name,
			canonical_url: source.canonical_url,
			is_active: user_source.is_active,
			label: user_source.label
		})
		.from(user_source)
		.innerJoin(source, eq(user_source.source_id, source.id))
		.where(eq(user_source.user_id, user_id))
		.orderBy(user_source.created_at);

	return rows;
}

async function load_story_window_start(user_id: string, edition_date: string) {
	const [latest_generated_edition] = await db
		.select({ edition_date: daily_edition.edition_date })
		.from(daily_edition)
		.where(
			and(
				eq(daily_edition.user_id, user_id),
				lt(daily_edition.edition_date, edition_date),
				isNotNull(daily_edition.generated_at)
			)
		)
		.orderBy(desc(daily_edition.edition_date))
		.limit(1);

	if (latest_generated_edition) {
		return {
			story_window_start: new Date(`${latest_generated_edition.edition_date}T00:00:00.000Z`)
		};
	}

	const edition_window_end = new Date(`${edition_date}T23:59:59.999Z`);
	const story_window_start = new Date(edition_window_end.getTime() - 7 * 24 * 60 * 60 * 1000);

	return {
		story_window_start
	};
}

type PrepareGenerationArgs = PreparationGenerationInput & {
	source_snapshot: SourceSnapshotEntry[];
};

export async function prepare_generation(input: PrepareGenerationArgs) {
	const story_window = await load_story_window_start(input.user_id, input.edition_date);
	const [existing] = await db
		.select({
			id: daily_edition.id,
			edition_date: daily_edition.edition_date,
			status: daily_edition.status,
			title: daily_edition.title,
			summary: daily_edition.summary,
			generated_at: daily_edition.generated_at,
			article_count: sql<number>`(
				select count(*) from ${daily_edition_article}
				where ${daily_edition_article.daily_edition_id} = ${daily_edition.id}
			)`.mapWith(Number)
		})
		.from(daily_edition)
		.where(
			and(
				eq(daily_edition.user_id, input.user_id),
				eq(daily_edition.edition_date, input.edition_date)
			)
		)
		.limit(1);

	if (existing?.status === 'generating') {
		throw new Error('This edition is already generating');
	}

	if (existing && existing.article_count > 0 && !input.replace_existing) {
		throw new Error('This edition already has articles. Use replace_existing to rebuild it.');
	}

	let edition_id: string;
	let edition_date: string;
	let prepared_base: Omit<
		PreparedGenerationState,
		'source_snapshot' | 'story_window_start'
	>;

	if (existing) {
		await db
			.update(daily_edition)
			.set({ status: 'generating' })
			.where(eq(daily_edition.id, existing.id));

		edition_id = existing.id;
		edition_date = existing.edition_date;
		prepared_base = {
			edition_id: existing.id,
			edition_date: existing.edition_date,
			had_existing_edition: true,
			previous_status: existing.status,
			previous_title: existing.title,
			previous_summary: existing.summary,
			previous_generated_at: existing.generated_at,
			previous_article_count: existing.article_count,
			replace_existing: input.replace_existing
		};
	} else {
		const [created] = await db
			.insert(daily_edition)
			.values({
				user_id: input.user_id,
				edition_date: input.edition_date,
				status: 'generating',
				title: get_default_edition_title(input.edition_date),
				summary: 'Generating your daily edition from active sources.'
			})
			.returning();

		edition_id = created.id;
		edition_date = created.edition_date;
		prepared_base = {
			edition_id: created.id,
			edition_date: created.edition_date,
			had_existing_edition: false,
			previous_status: null,
			previous_title: null,
			previous_summary: null,
			previous_generated_at: null,
			previous_article_count: 0,
			replace_existing: input.replace_existing
		};
	}

	await create_participation_logs({
		user_id: input.user_id,
		daily_edition_id: edition_id,
		edition_date,
		snapshot: input.source_snapshot
	});

	return {
		...prepared_base,
		...story_window,
		source_snapshot: input.source_snapshot
	} satisfies PreparedGenerationState;
}

export async function start_daily_edition_generation({
	user_id,
	edition_date,
	replace_existing = false
}: {
	user_id: string;
	edition_date: string;
	replace_existing?: boolean;
}) {
	return Sentry.startSpan(
		{
			name: 'start_daily_edition_generation',
			op: 'edition_generation.start',
			attributes: {
				user_id,
				edition_date,
				replace_existing
			}
		},
		async () => {
			try {
				const trace_data = Sentry.getTraceData();
				const existing = await get_owned_edition_generation_state(user_id, edition_date);

				if (existing?.status === 'generating') {
					throw new Error('This edition is already generating');
				}

				if (existing && existing.article_count > 0 && !replace_existing) {
					throw new Error(
						'This edition already exists. Only empty editions can be generated again in v1.'
					);
				}

				const source_snapshot = await load_source_snapshot(user_id);

				if (source_snapshot.length === 0) {
					throw new Error('Add at least one active source before starting generation.');
				}

				const tunnel_base_url = await get_tunnel_base_url();

				const preparation = await prepare_generation({
					user_id,
					edition_date,
					replace_existing,
					tunnel_base_url,
					source_snapshot
				});

				const active_count = source_snapshot.filter((row) => row.is_active).length;

				if (active_count === 0) {
					// All sources inactive: short-circuit. Apply persist_edition([]) semantics inline.
					const persist_result = await persist_edition({
						preparation,
						source_results: []
					});

					return persist_result;
				}

				try {
					return await start(generate_daily_edition_workflow, [
						{
							user_id,
							edition_date,
							replace_existing,
							tunnel_base_url,
							sentry_trace: trace_data['sentry-trace'],
							baggage: trace_data.baggage,
							preparation
						}
					]);
				} catch (workflow_error) {
					const error_message = get_error_message(
						workflow_error,
						'Failed to start generation workflow'
					);

					await finalize_pending_participation_as_error({
						daily_edition_id: preparation.edition_id,
						error_message
					});

					throw workflow_error;
				}
			} catch (error) {
				report_generation_exception({
					error,
					tags: {
						error_code: generation_failure_codes.edition_generation_start_failed,
						stage: 'start_daily_edition_generation',
						user_id,
						edition_date
					}
				});

				throw error;
			}
		}
	);
}
