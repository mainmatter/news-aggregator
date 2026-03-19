import { db } from '$lib/server/db';
import {
	daily_edition,
	daily_edition_article,
	article,
	source_article,
	user_source
} from '$lib/server/db/schema';
import { and, eq, desc, asc, sql, like, or, exists } from 'drizzle-orm';

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

	return (row?.max_pos ?? -1) + 1;
}

/**
 * Reindex all article positions in an edition sequentially (0, 1, 2, ...).
 * Useful after removing or reordering articles to avoid gaps/conflicts.
 */
export async function reindex_positions(edition_id: string) {
	const items = await db
		.select({ id: daily_edition_article.id, position: daily_edition_article.position })
		.from(daily_edition_article)
		.where(eq(daily_edition_article.daily_edition_id, edition_id))
		.orderBy(asc(daily_edition_article.position));

	for (let i = 0; i < items.length; i++) {
		if (items[i].position !== i) {
			await db
				.update(daily_edition_article)
				.set({ position: i })
				.where(eq(daily_edition_article.id, items[i].id));
		}
	}
}
