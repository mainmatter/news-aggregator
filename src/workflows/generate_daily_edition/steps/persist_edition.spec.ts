import { describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import * as schema from '$lib/server/db/schema';
import { create_test_database } from '$lib/server/test_database';
import type { PreparedGenerationState, SourceGenerationResult } from '../types';

describe('persist_edition', () => {
	it('persists successful source articles into the edition', async () => {
		const { database, cleanup } = await create_test_database();
		const { persist_edition } = await import('./persist_edition');

		try {
			const user_id = crypto.randomUUID();
			const source_id = crypto.randomUUID();
			const edition_id = crypto.randomUUID();

			await database.insert(schema.user).values({
				id: user_id,
				name: 'Generated User',
				email: `${user_id}@example.com`,
				emailVerified: true
			});

			await database.insert(schema.source).values({
				id: source_id,
				canonical_url: `https://example.com/${source_id}`
			});

			await database.insert(schema.daily_edition).values({
				id: edition_id,
				user_id,
				edition_date: '2026-04-14',
				status: 'generating'
			});

			const preparation: PreparedGenerationState = {
				edition_id,
				edition_date: '2026-04-14',
				had_existing_edition: false,
				previous_status: null,
				previous_title: null,
				previous_summary: null,
				previous_generated_at: null,
				previous_article_count: 0,
				replace_existing: false,
				source_snapshot: []
			};

			const source_results: SourceGenerationResult[] = [
				{
					source_id,
					source_name: 'Example',
					source_url: `https://example.com/${source_id}`,
					status: 'success',
					articles: [
						{
							url: 'https://example.com/story',
							canonical_url: 'https://example.com/story',
							title: 'Story',
							summary: 'A useful story.',
							category: 'News',
							published_at: '2026-04-14T12:00:00.000Z',
							section: 'Top',
							reason: 'Relevant to the day.'
						}
					],
					generated_at: '2026-04-14T12:00:00.000Z'
				}
			];

			const result = await persist_edition({ preparation, source_results });

			expect(result).toMatchObject({
				edition_id,
				status: 'published',
				successful_sources: 1,
				failed_sources: 0,
				published_articles: 1
			});

			const [edition] = await database
				.select()
				.from(schema.daily_edition)
				.where(eq(schema.daily_edition.id, edition_id));
			expect(edition.status).toBe('published');

			const edition_articles = await database
				.select()
				.from(schema.daily_edition_article)
				.where(eq(schema.daily_edition_article.daily_edition_id, edition_id));
			expect(edition_articles).toHaveLength(1);
		} finally {
			await cleanup();
		}
	});
});
