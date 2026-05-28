import * as v from 'valibot';
import { form, query } from '$app/server';
import { invalid } from '@sveltejs/kit';
import { and, asc, desc, eq, inArray, lte, sql } from 'drizzle-orm';
import { get_user } from '$lib/auth.remote';
import { db } from '$lib/server/db';
import {
	daily_edition,
	source,
	user_source,
	source_participation_log
} from '$lib/server/db/schema';
import { normalize_url, find_or_create_source, get_owned_user_source } from '$lib/server/sources';

const RECENT_HISTORY_LIMIT = 12;
const FULL_HISTORY_PAGE_SIZE = 50;

export const get_user_sources = query(async () => {
	const user = await get_user();

	const rows = await db
		.select({
			user_source_id: user_source.id,
			source_id: user_source.source_id,
			display_name: user_source.display_name,
			canonical_url: source.canonical_url,
			source_kind: source.source_kind,
			label: user_source.label,
			is_active: user_source.is_active,
			created_at: user_source.created_at,
			updated_at: user_source.updated_at
		})
		.from(user_source)
		.innerJoin(source, eq(user_source.source_id, source.id))
		.where(eq(user_source.user_id, user!.id))
		.orderBy(user_source.created_at);

	if (rows.length === 0) {
		return [] as Array<(typeof rows)[number] & { recent_runs: ParticipationRunRow[] }>;
	}

	const user_source_ids = rows.map((row) => row.user_source_id);

	const ranked_participation = db
		.select({
			id: source_participation_log.id,
			user_source_id: source_participation_log.user_source_id,
			daily_edition_id: source_participation_log.daily_edition_id,
			edition_date: source_participation_log.edition_date,
			status: source_participation_log.status,
			selected_article_count: source_participation_log.selected_article_count,
			reason: source_participation_log.reason,
			started_at: source_participation_log.started_at,
			finished_at: source_participation_log.finished_at,
			source_display_name_snapshot: source_participation_log.source_display_name_snapshot,
			source_canonical_url_snapshot: source_participation_log.source_canonical_url_snapshot,
			rank: sql<number>`row_number() over (
				partition by ${source_participation_log.user_source_id}
				order by ${source_participation_log.started_at} desc, ${source_participation_log.created_at} desc
			)`.as('rank')
		})
		.from(source_participation_log)
		.where(
			and(
				eq(source_participation_log.user_id, user!.id),
				inArray(source_participation_log.user_source_id, user_source_ids)
			)
		)
		.as('ranked_participation');

	const participation_rows = await db
		.select({
			id: ranked_participation.id,
			user_source_id: ranked_participation.user_source_id,
			daily_edition_id: ranked_participation.daily_edition_id,
			edition_date: ranked_participation.edition_date,
			status: ranked_participation.status,
			selected_article_count: ranked_participation.selected_article_count,
			reason: ranked_participation.reason,
			started_at: ranked_participation.started_at,
			finished_at: ranked_participation.finished_at,
			source_display_name_snapshot: ranked_participation.source_display_name_snapshot,
			source_canonical_url_snapshot: ranked_participation.source_canonical_url_snapshot
		})
		.from(ranked_participation)
		.where(lte(ranked_participation.rank, RECENT_HISTORY_LIMIT))
		.orderBy(asc(ranked_participation.user_source_id), asc(ranked_participation.rank));

	const by_user_source = new Map<string, ParticipationRunRow[]>();
	for (const row of participation_rows) {
		if (!row.user_source_id) continue;

		const list = by_user_source.get(row.user_source_id) ?? [];
		list.push({
			id: row.id,
			user_source_id: row.user_source_id,
			daily_edition_id: row.daily_edition_id,
			edition_date: row.edition_date,
			status: row.status,
			selected_article_count: row.selected_article_count,
			reason: row.reason,
			started_at: row.started_at,
			finished_at: row.finished_at,
			source_display_name_snapshot: row.source_display_name_snapshot,
			source_canonical_url_snapshot: row.source_canonical_url_snapshot
		});
		by_user_source.set(row.user_source_id, list);
	}

	return rows.map((row) => ({
		...row,
		recent_runs: by_user_source.get(row.user_source_id) ?? []
	}));
});

export type ParticipationRunRow = {
	id: string;
	user_source_id: string | null;
	daily_edition_id: string;
	edition_date: string;
	status: string;
	selected_article_count: number;
	reason: string | null;
	started_at: Date;
	finished_at: Date | null;
	source_display_name_snapshot: string;
	source_canonical_url_snapshot: string;
};

export type UserSource = Awaited<ReturnType<typeof get_user_sources>>[number];

export const get_source_run_history = query(
	v.object({
		user_source_id: v.pipe(v.string(), v.nonEmpty()),
		page: v.optional(v.number(), 1)
	}),
	async ({ user_source_id, page }) => {
		const user = await get_user();

		const [owned] = await db
			.select({
				user_source_id: user_source.id,
				display_name: user_source.display_name,
				canonical_url: source.canonical_url
			})
			.from(user_source)
			.innerJoin(source, eq(user_source.source_id, source.id))
			.where(and(eq(user_source.id, user_source_id), eq(user_source.user_id, user!.id)))
			.limit(1);

		if (!owned) {
			return null;
		}

		const [count_row] = await db
			.select({ count: sql<number>`count(*)`.mapWith(Number) })
			.from(source_participation_log)
			.where(
				and(
					eq(source_participation_log.user_source_id, user_source_id),
					eq(source_participation_log.user_id, user!.id)
				)
			);

		const total_count = count_row?.count ?? 0;
		const page_size = FULL_HISTORY_PAGE_SIZE;
		const total_pages = Math.max(1, Math.ceil(total_count / page_size));

		let resolved_page = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
		if (resolved_page > total_pages) resolved_page = total_pages;

		const offset = (resolved_page - 1) * page_size;

		const rows = await db
			.select({
				id: source_participation_log.id,
				daily_edition_id: source_participation_log.daily_edition_id,
				edition_date: source_participation_log.edition_date,
				status: source_participation_log.status,
				selected_article_count: source_participation_log.selected_article_count,
				reason: source_participation_log.reason,
				error_message: source_participation_log.error_message,
				started_at: source_participation_log.started_at,
				finished_at: source_participation_log.finished_at,
				source_display_name_snapshot: source_participation_log.source_display_name_snapshot,
				source_canonical_url_snapshot: source_participation_log.source_canonical_url_snapshot,
				run_status: daily_edition.status
			})
			.from(source_participation_log)
			.leftJoin(daily_edition, eq(source_participation_log.daily_edition_id, daily_edition.id))
			.where(
				and(
					eq(source_participation_log.user_source_id, user_source_id),
					eq(source_participation_log.user_id, user!.id)
				)
			)
			.orderBy(
				desc(source_participation_log.started_at),
				desc(source_participation_log.created_at)
			)
			.limit(page_size)
			.offset(offset);

		return {
			source: owned,
			rows,
			page: resolved_page,
			page_size,
			total_count,
			total_pages
		};
	}
);

export type SourceRunHistory = NonNullable<Awaited<ReturnType<typeof get_source_run_history>>>;
export type SourceRunHistoryRow = SourceRunHistory['rows'][number];

export const create_user_source = form(
	v.object({
		canonical_url: v.pipe(
			v.string(),
			v.trim(),
			v.nonEmpty('URL is required'),
			v.url('Must be a valid URL')
		),
		display_name: v.pipe(v.string(), v.trim(), v.nonEmpty('Name is required')),
		label: v.optional(v.pipe(v.string(), v.trim())),
		is_active: v.optional(v.boolean(), true)
	}),
	async ({ canonical_url, display_name, label, is_active }, issue) => {
		const user = await get_user();

		let normalized: string;
		try {
			normalized = normalize_url(canonical_url);
		} catch {
			invalid(issue.canonical_url('Invalid URL format'));
		}

		const source_row = await find_or_create_source(normalized);

		// Check if this user already has this source
		const [existing] = await db
			.select()
			.from(user_source)
			.where(and(eq(user_source.user_id, user!.id), eq(user_source.source_id, source_row.id)))
			.limit(1);

		if (existing) {
			invalid(issue.canonical_url('You already have a source with this URL'));
		} else {
			await db.insert(user_source).values({
				user_id: user.id,
				source_id: source_row.id,
				display_name,
				label: label || null,
				is_active
			});
		}

		await get_user_sources().refresh();
	}
);

export const update_user_source = form(
	v.object({
		user_source_id: v.pipe(v.string(), v.nonEmpty()),
		display_name: v.pipe(v.string(), v.trim(), v.nonEmpty('Name is required')),
		canonical_url: v.optional(v.pipe(v.string(), v.trim(), v.url('Must be a valid URL'))),
		label: v.optional(v.pipe(v.string(), v.trim())),
		is_active: v.optional(v.boolean(), false)
	}),
	async ({ user_source_id, display_name, canonical_url, label, is_active }, issue) => {
		const user = await get_user();
		const row = await get_owned_user_source(user_source_id, user!.id);

		if (!row) {
			invalid('Source not found');
		}

		// If URL changed, relink to a different source
		if (canonical_url) {
			let normalized: string;
			try {
				normalized = normalize_url(canonical_url);
			} catch {
				invalid(issue.canonical_url('Invalid URL format'));
			}

			// Get the current source to check if URL actually changed
			const [current_source] = await db
				.select()
				.from(source)
				.where(eq(source.id, row.source_id))
				.limit(1);

			if (current_source && current_source.canonical_url !== normalized) {
				const new_source = await find_or_create_source(normalized);

				// Check uniqueness: does this user already have the new source?
				const [duplicate] = await db
					.select()
					.from(user_source)
					.where(and(eq(user_source.user_id, user!.id), eq(user_source.source_id, new_source.id)))
					.limit(1);

				if (duplicate && duplicate.id !== user_source_id) {
					invalid(issue.canonical_url('You already have a source with this URL'));
				}

				await db
					.update(user_source)
					.set({ source_id: new_source.id })
					.where(eq(user_source.id, user_source_id));
			}
		}

		// Update per-user fields
		const updates: Record<string, unknown> = {};
		updates.display_name = display_name;
		if (label !== undefined) updates.label = label || null;
		if (is_active !== undefined) updates.is_active = is_active;

		await db.update(user_source).set(updates).where(eq(user_source.id, user_source_id));
		await get_user_sources().refresh();
	}
);

export const delete_user_source = form(
	v.object({
		user_source_id: v.pipe(v.string(), v.nonEmpty())
	}),
	async ({ user_source_id }) => {
		const user = await get_user();
		const row = await get_owned_user_source(user_source_id, user!.id);

		if (!row) {
			invalid('Source not found');
		}

		await db.delete(user_source).where(eq(user_source.id, user_source_id));

		await get_user_sources().refresh();
	}
);
