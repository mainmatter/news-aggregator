import { db } from '$lib/server/db';
import {
	daily_edition,
	daily_edition_article,
	article,
	source_article,
	user_source
} from '$lib/server/db/schema';
import { and, eq, desc, asc, sql, like, or, exists } from 'drizzle-orm';

export const POSITION_STEP = 1024;
export const MIN_POSITION_GAP = 1e-6;

export function get_default_edition_title(edition_date: string) {
	const [year, month, day] = edition_date.split('-').map(Number);
	const formatted_date = new Date(Date.UTC(year, month - 1, day)).toLocaleDateString('en-US', {
		weekday: 'long',
		month: 'long',
		day: 'numeric',
		year: 'numeric',
		timeZone: 'UTC'
	});

	return `Daily Edition - ${formatted_date}`;
}

type Edition_position_row = {
	id: string;
	position: number;
};

async function await_all_settled(promises: Promise<unknown>[]) {
	const results = await Promise.allSettled(promises);
	const first_rejection = results.find((result) => result.status === 'rejected');

	if (first_rejection?.status === 'rejected') {
		throw first_rejection.reason;
	}
}

async function get_ordered_position_rows(edition_id: string) {
	return db
		.select({ id: daily_edition_article.id, position: daily_edition_article.position })
		.from(daily_edition_article)
		.where(eq(daily_edition_article.daily_edition_id, edition_id))
		.orderBy(asc(daily_edition_article.position), asc(daily_edition_article.id));
}

export function calculate_position_for_index(
	items: Array<Pick<Edition_position_row, 'position'>>,
	target_index: number
) {
	const clamped_target_index = Math.min(Math.max(0, target_index), items.length);
	const previous_item = items[clamped_target_index - 1] ?? null;
	const next_item = items[clamped_target_index] ?? null;

	if (!previous_item && !next_item) {
		return { position: POSITION_STEP, needs_rebalance: false };
	}

	if (!previous_item && next_item) {
		return { position: next_item.position - POSITION_STEP, needs_rebalance: false };
	}

	if (previous_item && !next_item) {
		return { position: previous_item.position + POSITION_STEP, needs_rebalance: false };
	}

	const gap = next_item.position - previous_item.position;
	const position = previous_item.position + gap / 2;

	return {
		position,
		needs_rebalance:
			!(gap > MIN_POSITION_GAP) ||
			!(position > previous_item.position) ||
			!(position < next_item.position)
	};
}

/**
 * Get all editions owned by a user, ordered by date descending.
 * Includes article count for the management list.
 */
export async function get_owned_editions(user_id: string) {
	const rows = await db
		.select({
			id: daily_edition.id,
			edition_date: daily_edition.edition_date,
			status: daily_edition.status,
			title: daily_edition.title,
			summary: daily_edition.summary,
			generated_at: daily_edition.generated_at,
			created_at: daily_edition.created_at,
			updated_at: daily_edition.updated_at,
			article_count: sql<number>`(
			select count(*) from daily_edition_article
			where daily_edition_article.daily_edition_id = "daily_edition"."id"
		)`.mapWith(Number)
		})
		.from(daily_edition)
		.where(eq(daily_edition.user_id, user_id))
		.orderBy(desc(daily_edition.edition_date));

	return rows;
}

/**
 * Get a single edition owned by a user, identified by date.
 * Returns null if not found or not owned.
 */
export async function get_owned_edition_by_date(user_id: string, edition_date: string) {
	const [row] = await db
		.select()
		.from(daily_edition)
		.where(and(eq(daily_edition.user_id, user_id), eq(daily_edition.edition_date, edition_date)))
		.limit(1);

	return row ?? null;
}

export async function get_owned_edition_generation_state(user_id: string, edition_date: string) {
	const [row] = await db
		.select({
			id: daily_edition.id,
			edition_date: daily_edition.edition_date,
			status: daily_edition.status,
			title: daily_edition.title,
			summary: daily_edition.summary,
			generated_at: daily_edition.generated_at,
			article_count: sql<number>`(
				select count(*) from daily_edition_article
				where daily_edition_article.daily_edition_id = ${daily_edition.id}
			)`.mapWith(Number)
		})
		.from(daily_edition)
		.where(and(eq(daily_edition.user_id, user_id), eq(daily_edition.edition_date, edition_date)))
		.limit(1);

	return row ?? null;
}

/**
 * Get a single edition by ID, verifying ownership.
 * Returns null if not found or not owned.
 */
export async function get_owned_edition(edition_id: string, user_id: string) {
	const [row] = await db
		.select()
		.from(daily_edition)
		.where(and(eq(daily_edition.id, edition_id), eq(daily_edition.user_id, user_id)))
		.limit(1);

	return row ?? null;
}

/**
 * Build the editor DTO for a single edition.
 * Joins daily_edition_article -> article -> source_article -> source
 * to get all the display data needed for the edition editor.
 */
export async function get_edition_articles(edition_id: string) {
	const rows = await db
		.select({
			id: daily_edition_article.id,
			article_id: daily_edition_article.article_id,
			position: daily_edition_article.position,
			section: daily_edition_article.section,
			reason: daily_edition_article.reason,
			custom_title: daily_edition_article.custom_title,
			custom_summary: daily_edition_article.custom_summary,
			custom_category: daily_edition_article.custom_category,
			canonical_url: article.canonical_url,
			title: article.title,
			summary: article.summary,
			category: article.category,
			published_at: article.published_at
		})
		.from(daily_edition_article)
		.innerJoin(article, eq(daily_edition_article.article_id, article.id))
		.where(eq(daily_edition_article.daily_edition_id, edition_id))
		.orderBy(asc(daily_edition_article.position));

	return rows;
}

/**
 * Find candidate articles from the current user's source universe,
 * excluding articles already in the given edition.
 * Supports optional text search on title/summary/url.
 */
export async function search_candidate_articles(
	user_id: string,
	edition_id: string,
	search_term?: string,
	limit = 20
) {
	// Subquery: article IDs already in this edition
	const already_in_edition = db
		.select({ article_id: daily_edition_article.article_id })
		.from(daily_edition_article)
		.where(
			and(
				eq(daily_edition_article.daily_edition_id, edition_id),
				eq(daily_edition_article.article_id, article.id)
			)
		);

	const conditions = [eq(user_source.user_id, user_id), sql`not ${exists(already_in_edition)}`];

	if (search_term && search_term.trim().length > 0) {
		const term = `%${search_term.trim()}%`;
		conditions.push(
			or(like(article.title, term), like(article.summary, term), like(article.canonical_url, term))!
		);
	}

	return db
		.selectDistinct({
			id: article.id,
			canonical_url: article.canonical_url,
			title: article.title,
			summary: article.summary,
			category: article.category,
			published_at: article.published_at,
			source_name: user_source.display_name
		})
		.from(article)
		.innerJoin(source_article, eq(source_article.article_id, article.id))
		.innerJoin(user_source, eq(user_source.source_id, source_article.source_id))
		.where(and(...conditions))
		.orderBy(desc(article.published_at))
		.limit(limit);
}

/**
 * Get the next available position for an article in an edition.
 */
export async function get_next_position(edition_id: string) {
	const [row] = await db
		.select({
			max_pos: sql<number | null>`max(${daily_edition_article.position})`
		})
		.from(daily_edition_article)
		.where(eq(daily_edition_article.daily_edition_id, edition_id));

	return (row?.max_pos ?? 0) + POSITION_STEP;
}

/**
 * Restore evenly spaced positions while preserving the current order.
 */
export async function rebalance_positions(edition_id: string) {
	const items = await get_ordered_position_rows(edition_id);

	if (items.length === 0) {
		return;
	}

	const max_absolute_position = items.reduce(
		(max_position, item) => Math.max(max_position, Math.abs(item.position)),
		0
	);
	const temporary_base = max_absolute_position + POSITION_STEP * (items.length + 1);

	const temporary_update_promises = Array.from(items.entries(), ([index, item]) =>
		db
			.update(daily_edition_article)
			.set({ position: temporary_base + index })
			.where(eq(daily_edition_article.id, item.id))
	);
	await await_all_settled(temporary_update_promises);

	const spaced_update_promises = Array.from(items.entries(), ([index, item]) =>
		db
			.update(daily_edition_article)
			.set({ position: (index + 1) * POSITION_STEP })
			.where(eq(daily_edition_article.id, item.id))
	);
	await await_all_settled(spaced_update_promises);
}

export async function move_edition_article(
	edition_id: string,
	edition_article_id: string,
	target_index: number
) {
	const ordered_items = await get_ordered_position_rows(edition_id);
	const current_index = ordered_items.findIndex((item) => item.id === edition_article_id);

	if (current_index === -1) {
		throw new Error('Article not found in this edition');
	}

	const clamped_target_index = Math.min(Math.max(0, target_index), ordered_items.length - 1);

	if (current_index === clamped_target_index) {
		return;
	}

	const items_without_moved = ordered_items.filter((item) => item.id !== edition_article_id);
	let next_position = calculate_position_for_index(items_without_moved, clamped_target_index);

	if (next_position.needs_rebalance) {
		await rebalance_positions(edition_id);

		const rebalanced_items = await get_ordered_position_rows(edition_id);
		const rebalanced_without_moved = rebalanced_items.filter(
			(item) => item.id !== edition_article_id
		);

		next_position = calculate_position_for_index(rebalanced_without_moved, clamped_target_index);

		if (next_position.needs_rebalance) {
			throw new Error('Unable to compute a stable position for this reorder');
		}
	}

	await db
		.update(daily_edition_article)
		.set({ position: next_position.position })
		.where(eq(daily_edition_article.id, edition_article_id));
}
