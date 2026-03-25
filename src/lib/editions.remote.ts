import { form, query } from '$app/server';
import { get_user } from '$lib/auth.remote';
import { db } from '$lib/server/db';
import {
	article,
	daily_edition,
	daily_edition_article,
	source_article,
	user_source
} from '$lib/server/db/schema';
import {
	calculate_position_for_index,
	get_edition_articles,
	get_next_position,
	get_owned_edition,
	get_owned_edition_by_date,
	get_owned_editions,
	POSITION_STEP,
	search_candidate_articles
} from '$lib/server/editions';
import { normalize_url } from '$lib/server/sources';
import { invalid } from '@sveltejs/kit';
import { and, asc, eq } from 'drizzle-orm';
import * as v from 'valibot';

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function await_all_settled(promises: Promise<unknown>[]) {
	const results = await Promise.allSettled(promises);
	const first_rejection = results.find((result) => result.status === 'rejected');

	if (first_rejection?.status === 'rejected') {
		throw first_rejection.reason;
	}
}

async function get_ordered_edition_rows(transaction: Transaction, edition_id: string) {
	return transaction
		.select({ id: daily_edition_article.id, position: daily_edition_article.position })
		.from(daily_edition_article)
		.where(eq(daily_edition_article.daily_edition_id, edition_id))
		.orderBy(asc(daily_edition_article.position), asc(daily_edition_article.id));
}

async function rebalance_positions_in_transaction(transaction: Transaction, edition_id: string) {
	const items = await get_ordered_edition_rows(transaction, edition_id);

	if (items.length === 0) {
		return;
	}

	const max_absolute_position = items.reduce(
		(max_position, item) => Math.max(max_position, Math.abs(item.position)),
		0
	);
	const temporary_base = max_absolute_position + POSITION_STEP * (items.length + 1);

	const temporary_update_promises = Array.from(items.entries(), ([index, item]) =>
		transaction
			.update(daily_edition_article)
			.set({ position: temporary_base + index })
			.where(eq(daily_edition_article.id, item.id))
	);
	await await_all_settled(temporary_update_promises);

	const spaced_update_promises = Array.from(items.entries(), ([index, item]) =>
		transaction
			.update(daily_edition_article)
			.set({ position: (index + 1) * POSITION_STEP })
			.where(eq(daily_edition_article.id, item.id))
	);
	await await_all_settled(spaced_update_promises);
}

// ─── Types ───────────────────────────────────────────────────────────

export type EditionSummary = Awaited<ReturnType<typeof get_owned_editions>>[number];

export type EditionEditor = {
	id: string;
	edition_date: string;
	status: string;
	title: string | null;
	summary: string | null;
	articles: EditionArticleRow[];
};

export type EditionArticleRow = Awaited<ReturnType<typeof get_edition_articles>>[number];

export type CandidateArticle = Awaited<ReturnType<typeof search_candidate_articles>>[number];

// ─── Queries ─────────────────────────────────────────────────────────

/**
 * Get all editions for the current user.
 */
export const get_editions = query(async () => {
	const user = await get_user();
	return get_owned_editions(user.id);
});

/**
 * Get the full edition editor payload for /editions/[date].
 */
export const get_edition_editor = query(v.string(), async (edition_date) => {
	const user = await get_user();

	const edition = await get_owned_edition_by_date(user.id, edition_date);
	if (!edition) {
		return null;
	}

	const articles = await get_edition_articles(edition.id);

	return {
		id: edition.id,
		edition_date: edition.edition_date,
		status: edition.status,
		title: edition.title,
		summary: edition.summary,
		articles
	} satisfies EditionEditor;
});

/**
 * Search for articles available to add to an edition.
 */
export const search_editable_articles = query(
	v.object({
		edition_id: v.string(),
		search_term: v.optional(v.string())
	}),
	async ({ edition_id, search_term }) => {
		const user = await get_user();
		return search_candidate_articles(user.id, edition_id, search_term);
	}
);

// ─── Mutations ───────────────────────────────────────────────────────

/**
 * Create a new edition for a given date.
 */
export const create_edition = form(
	v.object({
		edition_date: v.pipe(
			v.string(),
			v.nonEmpty('Date is required'),
			v.regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD format')
		),
		title: v.optional(v.pipe(v.string(), v.trim())),
		summary: v.optional(v.pipe(v.string(), v.trim())),
		status: v.optional(v.pipe(v.string(), v.trim()), 'draft')
	}),
	async ({ edition_date, title, summary, status }, issue) => {
		const user = await get_user();

		// Check for duplicate date
		const existing = await get_owned_edition_by_date(user.id, edition_date);
		if (existing) {
			invalid(issue.edition_date('You already have an edition for this date'));
		}

		await db.insert(daily_edition).values({
			user_id: user.id,
			edition_date,
			title: title || null,
			summary: summary || null,
			status
		});

		await get_editions().refresh();
	}
);

/**
 * Delete an existing edition.
 */
export const delete_edition = form(
	v.object({
		edition_id: v.pipe(v.string(), v.nonEmpty())
	}),
	async ({ edition_id }) => {
		const user = await get_user();
		const edition = await get_owned_edition(edition_id, user.id);

		if (!edition) {
			invalid('Edition not found');
		}

		await db.delete(daily_edition).where(eq(daily_edition.id, edition_id));

		await get_editions().refresh();
	}
);

/**
 * Update edition metadata (title, summary, status).
 */
export const update_edition_meta = form(
	v.object({
		edition_id: v.pipe(v.string(), v.nonEmpty()),
		title: v.optional(v.pipe(v.string(), v.trim())),
		summary: v.optional(v.pipe(v.string(), v.trim())),
		status: v.optional(v.pipe(v.string(), v.trim()))
	}),
	async ({ edition_id, title, summary, status }) => {
		const user = await get_user();
		const edition = await get_owned_edition(edition_id, user.id);

		if (!edition) {
			invalid('Edition not found');
		}

		const updates: Record<string, unknown> = {};
		if (title !== undefined) updates.title = title || null;
		if (summary !== undefined) updates.summary = summary || null;
		if (status !== undefined) updates.status = status;

		await db.update(daily_edition).set(updates).where(eq(daily_edition.id, edition_id));

		await get_editions().refresh();
		await get_edition_editor(edition.edition_date).refresh();
	}
);

/**
 * Add an existing article to an edition.
 */
export const add_edition_article = form(
	v.object({
		edition_id: v.pipe(v.string(), v.nonEmpty()),
		article_id: v.pipe(v.string(), v.nonEmpty()),
		section: v.optional(v.pipe(v.string(), v.trim())),
		reason: v.optional(v.pipe(v.string(), v.trim()))
	}),
	async ({ edition_id, article_id, section, reason }, issue) => {
		const user = await get_user();
		const edition = await get_owned_edition(edition_id, user.id);

		if (!edition) {
			invalid('Edition not found');
		}

		// Check for duplicate article in edition
		const [existing] = await db
			.select()
			.from(daily_edition_article)
			.where(
				and(
					eq(daily_edition_article.daily_edition_id, edition_id),
					eq(daily_edition_article.article_id, article_id)
				)
			)
			.limit(1);

		if (existing) {
			invalid(issue.article_id('This article is already in the edition'));
		}

		const position = await get_next_position(edition_id);

		await db.insert(daily_edition_article).values({
			daily_edition_id: edition_id,
			article_id,
			position,
			section: section || null,
			reason: reason || null
		});

		await get_edition_editor(edition.edition_date).refresh();
		await get_editions().refresh();
	}
);

/**
 * Update an edition article's overrides (custom_title, custom_summary, etc.).
 */
export const update_edition_article = form(
	v.object({
		edition_article_id: v.pipe(v.string(), v.nonEmpty()),
		edition_id: v.pipe(v.string(), v.nonEmpty()),
		custom_title: v.optional(v.pipe(v.string(), v.trim())),
		custom_summary: v.optional(v.pipe(v.string(), v.trim())),
		custom_category: v.optional(v.pipe(v.string(), v.trim())),
		section: v.optional(v.pipe(v.string(), v.trim())),
		reason: v.optional(v.pipe(v.string(), v.trim()))
	}),
	async ({
		edition_article_id,
		edition_id,
		custom_title,
		custom_summary,
		custom_category,
		section,
		reason
	}) => {
		const user = await get_user();
		const edition = await get_owned_edition(edition_id, user.id);

		if (!edition) {
			invalid('Edition not found');
		}

		// Verify the article belongs to this edition
		const [dea] = await db
			.select()
			.from(daily_edition_article)
			.where(
				and(
					eq(daily_edition_article.id, edition_article_id),
					eq(daily_edition_article.daily_edition_id, edition_id)
				)
			)
			.limit(1);

		if (!dea) {
			invalid('Article not found in this edition');
		}

		const updates: Record<string, unknown> = {};
		if (custom_title !== undefined) updates.custom_title = custom_title || null;
		if (custom_summary !== undefined) updates.custom_summary = custom_summary || null;
		if (custom_category !== undefined) updates.custom_category = custom_category || null;
		if (section !== undefined) updates.section = section || null;
		if (reason !== undefined) updates.reason = reason || null;

		await db
			.update(daily_edition_article)
			.set(updates)
			.where(eq(daily_edition_article.id, edition_article_id));

		await get_edition_editor(edition.edition_date).refresh();
	}
);

/**
 * Remove an article from an edition.
 */
export const remove_edition_article = form(
	v.object({
		edition_article_id: v.pipe(v.string(), v.nonEmpty()),
		edition_id: v.pipe(v.string(), v.nonEmpty())
	}),
	async ({ edition_article_id, edition_id }) => {
		const user = await get_user();
		const edition = await get_owned_edition(edition_id, user.id);

		if (!edition) {
			invalid('Edition not found');
		}

		// Verify the article belongs to this edition
		const [dea] = await db
			.select()
			.from(daily_edition_article)
			.where(
				and(
					eq(daily_edition_article.id, edition_article_id),
					eq(daily_edition_article.daily_edition_id, edition_id)
				)
			)
			.limit(1);

		if (!dea) {
			invalid('Article not found in this edition');
		}

		await db.delete(daily_edition_article).where(eq(daily_edition_article.id, edition_article_id));

		await get_edition_editor(edition.edition_date).refresh();
		await get_editions().refresh();
	}
);

/**
 * Reorder articles within an edition.
 * Accepts the edition_article_id to move and the new position.
 */
export const reorder_edition_articles = form(
	v.object({
		edition_id: v.pipe(v.string(), v.nonEmpty()),
		edition_article_id: v.pipe(v.string(), v.nonEmpty()),
		new_position: v.pipe(v.number(), v.minValue(0))
	}),
	async ({ edition_id, edition_article_id, new_position }) => {
		const user = await get_user();
		const edition = await get_owned_edition(edition_id, user.id);

		if (!edition) {
			invalid('Edition not found');
		}

		try {
			await db.transaction(async (transaction) => {
				const ordered_items = await get_ordered_edition_rows(transaction, edition_id);
				const current_index = ordered_items.findIndex((item) => item.id === edition_article_id);

				if (current_index === -1) {
					throw new Error('Article not found in this edition');
				}

				const clamped_target_index = Math.min(Math.max(0, new_position), ordered_items.length - 1);

				if (current_index === clamped_target_index) {
					return;
				}

				const items_without_moved = ordered_items.filter((item) => item.id !== edition_article_id);
				let next_position = calculate_position_for_index(items_without_moved, clamped_target_index);

				if (next_position.needs_rebalance) {
					await rebalance_positions_in_transaction(transaction, edition_id);

					const rebalanced_items = await get_ordered_edition_rows(transaction, edition_id);
					const rebalanced_without_moved = rebalanced_items.filter(
						(item) => item.id !== edition_article_id
					);

					next_position = calculate_position_for_index(
						rebalanced_without_moved,
						clamped_target_index
					);

					if (next_position.needs_rebalance) {
						throw new Error('Unable to compute a stable position for this reorder');
					}
				}

				await transaction
					.update(daily_edition_article)
					.set({ position: next_position.position })
					.where(eq(daily_edition_article.id, edition_article_id));
			});
		} catch (error) {
			if (error instanceof Error && error.message === 'Article not found in this edition') {
				invalid('Article not found in this edition');
			}

			throw error;
		}

		await get_edition_editor(edition.edition_date).refresh();
	}
);

/**
 * Create a manual article (not from ingestion) and add it to an edition.
 * Creates a real article row, links it to a user-owned source, then adds to the edition.
 */
export const create_manual_article = form(
	v.object({
		edition_id: v.pipe(v.string(), v.nonEmpty()),
		source_id: v.pipe(v.string(), v.nonEmpty('Source is required')),
		canonical_url: v.pipe(
			v.string(),
			v.trim(),
			v.nonEmpty('URL is required'),
			v.url('Must be a valid URL')
		),
		title: v.pipe(v.string(), v.trim(), v.nonEmpty('Title is required')),
		summary: v.optional(v.pipe(v.string(), v.trim())),
		category: v.optional(v.pipe(v.string(), v.trim())),
		published_at: v.optional(v.pipe(v.string(), v.trim()))
	}),
	async (
		{ edition_id, source_id, canonical_url, title, summary, category, published_at },
		issue
	) => {
		const user = await get_user();
		const edition = await get_owned_edition(edition_id, user.id);

		if (!edition) {
			invalid('Edition not found');
		}

		// Verify the source belongs to the user
		const [owned_source] = await db
			.select()
			.from(user_source)
			.where(and(eq(user_source.source_id, source_id), eq(user_source.user_id, user.id)))
			.limit(1);

		if (!owned_source) {
			invalid(issue.source_id('You do not own this source'));
		}

		let normalized: string;
		try {
			normalized = normalize_url(canonical_url);
		} catch {
			invalid(issue.canonical_url('Invalid URL format'));
		}

		// Find or create the article by canonical URL
		let [article_row] = await db
			.select()
			.from(article)
			.where(eq(article.canonical_url, normalized))
			.limit(1);

		if (article_row) {
			// Article already exists, just check if it's already in the edition
			const [existing_in_edition] = await db
				.select()
				.from(daily_edition_article)
				.where(
					and(
						eq(daily_edition_article.daily_edition_id, edition_id),
						eq(daily_edition_article.article_id, article_row.id)
					)
				)
				.limit(1);

			if (existing_in_edition) {
				invalid(issue.canonical_url('An article with this URL is already in the edition'));
			}
		} else {
			// Create the article
			const [created] = await db
				.insert(article)
				.values({
					canonical_url: normalized,
					title,
					summary: summary || null,
					category: category || null,
					published_at: published_at ? new Date(published_at) : null
				})
				.returning();

			article_row = created;

			// Link to source via source_article
			const [existing_link] = await db
				.select()
				.from(source_article)
				.where(
					and(
						eq(source_article.source_id, source_id),
						eq(source_article.article_id, article_row.id)
					)
				)
				.limit(1);

			if (!existing_link) {
				await db.insert(source_article).values({
					source_id,
					article_id: article_row.id
				});
			}
		}

		// Add to edition
		const position = await get_next_position(edition_id);

		await db.insert(daily_edition_article).values({
			daily_edition_id: edition_id,
			article_id: article_row.id,
			position
		});

		await get_edition_editor(edition.edition_date).refresh();
		await get_editions().refresh();
	}
);
