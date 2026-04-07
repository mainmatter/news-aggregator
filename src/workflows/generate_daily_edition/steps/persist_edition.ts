import { db } from '$lib/server/db';
import {
	article,
	daily_edition,
	daily_edition_article,
	source_article
} from '$lib/server/db/schema';
import { get_default_edition_title, POSITION_STEP } from '$lib/server/editions';
import { normalize_url } from '$lib/server/sources';
import { eq, inArray } from 'drizzle-orm';
import { createHash } from 'node:crypto';
import type {
	PersistEditionResult,
	PreparedGenerationState,
	SourceGenerationResult
} from '../types';

type NormalizedArticle = {
	canonical_url: string;
	title: string | null;
	summary: string | null;
	category: string | null;
	published_at: Date | null;
	section: string | null;
	reason: string | null;
	position: number;
	source_ids: Set<string>;
};

function get_empty_summary(successful_sources: number) {
	if (successful_sources > 0) {
		return 'The workflow finished, but none of the successful source runs produced usable articles for this edition.';
	}

	return 'No new articles were available across your active sources for this edition.';
}

function get_generated_summary(successful_sources: number, published_articles: number) {
	return `Generated from ${successful_sources} source${successful_sources === 1 ? '' : 's'} with ${published_articles} article${published_articles === 1 ? '' : 's'} selected for this edition.`;
}

function count_article_details(
	article_row: Pick<NormalizedArticle, 'title' | 'summary' | 'category' | 'published_at'>
) {
	return [
		article_row.title,
		article_row.summary,
		article_row.category,
		article_row.published_at
	].filter(Boolean).length;
}

function pick_better_article(current: NormalizedArticle, candidate: NormalizedArticle) {
	const current_score = count_article_details(current);
	const candidate_score = count_article_details(candidate);

	if (candidate_score > current_score) {
		candidate.source_ids = new Set([...current.source_ids, ...candidate.source_ids]);
		candidate.position = Math.min(current.position, candidate.position);
		return candidate;
	}

	current.source_ids = new Set([...current.source_ids, ...candidate.source_ids]);
	current.position = Math.min(current.position, candidate.position);
	if (!current.section && candidate.section) current.section = candidate.section;
	if (!current.reason && candidate.reason) current.reason = candidate.reason;
	return current;
}

function parse_published_at(value: string | null | undefined) {
	if (!value) {
		return null;
	}

	const parsed = new Date(value);
	return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function normalize_articles(source_results: SourceGenerationResult[]) {
	const normalized_by_url = new Map<string, NormalizedArticle>();
	let next_position = POSITION_STEP;

	for (const result of source_results) {
		if (result.status !== 'success') {
			continue;
		}

		for (const article_row of result.articles) {
			let canonical_url: string;

			try {
				canonical_url = normalize_url(article_row.canonical_url || article_row.url);
			} catch {
				continue;
			}

			const candidate: NormalizedArticle = {
				canonical_url,
				title: article_row.title?.trim() || null,
				summary: article_row.summary?.trim() || null,
				category: article_row.category?.trim() || null,
				published_at: parse_published_at(article_row.published_at),
				section: article_row.section?.trim() || null,
				reason: article_row.reason?.trim() || null,
				position: next_position,
				source_ids: new Set([result.source_id])
			};

			next_position += POSITION_STEP;

			const existing = normalized_by_url.get(canonical_url);
			normalized_by_url.set(
				canonical_url,
				existing ? pick_better_article(existing, candidate) : candidate
			);
		}
	}

	return [...normalized_by_url.values()].sort((left, right) => left.position - right.position);
}

function build_content_hash(article_row: NormalizedArticle) {
	return createHash('sha256')
		.update(
			JSON.stringify({
				canonical_url: article_row.canonical_url,
				title: article_row.title,
				summary: article_row.summary,
				category: article_row.category
			})
		)
		.digest('hex');
}

export async function persist_edition({
	preparation,
	source_results
}: {
	preparation: PreparedGenerationState;
	source_results: SourceGenerationResult[];
}) {
	'use step';

	const successful_results = source_results.filter((result) => result.status === 'success');
	const failed_results = source_results.length - successful_results.length;
	const normalized_articles = normalize_articles(source_results);
	const now = new Date();
	let published_articles = 0;

	if (successful_results.length === 0) {
		if (preparation.had_existing_edition) {
			await db
				.update(daily_edition)
				.set({
					status: preparation.previous_status || 'draft',
					title: preparation.previous_title,
					summary: preparation.previous_summary,
					generated_at: preparation.previous_generated_at
				})
				.where(eq(daily_edition.id, preparation.edition_id));

			return {
				edition_id: preparation.edition_id,
				status: 'restored',
				successful_sources: 0,
				failed_sources: failed_results,
				published_articles: preparation.previous_article_count
			} satisfies PersistEditionResult;
		}

		await db
			.update(daily_edition)
			.set({
				status: 'published',
				title: get_default_edition_title(preparation.edition_date),
				summary: get_empty_summary(0),
				generated_at: now
			})
			.where(eq(daily_edition.id, preparation.edition_id));

		return {
			edition_id: preparation.edition_id,
			status: 'published',
			successful_sources: 0,
			failed_sources: failed_results,
			published_articles: 0
		} satisfies PersistEditionResult;
	}

	await db.transaction(async (transaction) => {
		const canonical_urls = normalized_articles.map((article_row) => article_row.canonical_url);
		const existing_articles = canonical_urls.length
			? await transaction
					.select()
					.from(article)
					.where(inArray(article.canonical_url, canonical_urls))
			: [];
		const existing_by_url = new Map(existing_articles.map((row) => [row.canonical_url, row]));
		const article_id_by_url = new Map(existing_articles.map((row) => [row.canonical_url, row.id]));

		const missing_articles = normalized_articles.filter(
			(article_row) => !existing_by_url.has(article_row.canonical_url)
		);

		if (missing_articles.length > 0) {
			const inserted = await transaction
				.insert(article)
				.values(
					missing_articles.map((article_row) => ({
						canonical_url: article_row.canonical_url,
						title: article_row.title,
						summary: article_row.summary,
						category: article_row.category,
						published_at: article_row.published_at,
						content_hash: build_content_hash(article_row),
						summarized_at: article_row.summary ? now : null
					}))
				)
				.returning();

			for (const row of inserted) {
				article_id_by_url.set(row.canonical_url, row.id);
			}
		}

		for (const article_row of normalized_articles) {
			const existing = existing_by_url.get(article_row.canonical_url);
			if (!existing) {
				continue;
			}

			const updates: Partial<typeof article.$inferInsert> = {};
			if (!existing.title && article_row.title) updates.title = article_row.title;
			if (!existing.summary && article_row.summary) {
				updates.summary = article_row.summary;
				updates.summarized_at = now;
			}
			if (!existing.category && article_row.category) updates.category = article_row.category;
			if (!existing.published_at && article_row.published_at) {
				updates.published_at = article_row.published_at;
			}
			if (!existing.content_hash) updates.content_hash = build_content_hash(article_row);

			if (Object.keys(updates).length > 0) {
				await transaction.update(article).set(updates).where(eq(article.id, existing.id));
			}
		}

		const source_article_values = normalized_articles.flatMap((article_row) => {
			const article_id = article_id_by_url.get(article_row.canonical_url);
			if (!article_id) {
				return [];
			}

			return [...article_row.source_ids].map((source_id) => ({ source_id, article_id }));
		});

		if (source_article_values.length > 0) {
			await transaction.insert(source_article).values(source_article_values).onConflictDoNothing();
		}

		await transaction
			.delete(daily_edition_article)
			.where(eq(daily_edition_article.daily_edition_id, preparation.edition_id));

		const edition_article_values = normalized_articles.flatMap((article_row, index) => {
			const article_id = article_id_by_url.get(article_row.canonical_url);
			if (!article_id) {
				return [];
			}

			return [
				{
					daily_edition_id: preparation.edition_id,
					article_id,
					position: (index + 1) * POSITION_STEP,
					section: article_row.section,
					reason: article_row.reason
				}
			];
		});

		if (edition_article_values.length > 0) {
			await transaction.insert(daily_edition_article).values(edition_article_values);
		}

		published_articles = edition_article_values.length;
		await transaction
			.update(daily_edition)
			.set({
				status: 'published',
				title: preparation.previous_title || get_default_edition_title(preparation.edition_date),
				summary:
					published_articles > 0
						? preparation.previous_summary ||
							get_generated_summary(successful_results.length, published_articles)
						: get_empty_summary(successful_results.length),
				generated_at: now
			})
			.where(eq(daily_edition.id, preparation.edition_id));
	});

	return {
		edition_id: preparation.edition_id,
		status: 'published',
		successful_sources: successful_results.length,
		failed_sources: failed_results,
		published_articles
	} satisfies PersistEditionResult;
}
