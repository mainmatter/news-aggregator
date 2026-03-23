import { asc, eq } from 'drizzle-orm';
import { expect, test } from './test';

test.describe('edition ordering', () => {
	test('reorder persists after reload', async ({ page, db, schema }) => {
		const [user] = await db.select().from(schema.user).all();
		const edition_id = crypto.randomUUID();
		const edition_date = '2026-03-23';

		await db.insert(schema.daily_edition).values({
			id: edition_id,
			user_id: user.id,
			edition_date,
			status: 'draft',
			title: 'Ordering Test Edition'
		});

		for (const [index, title] of ['Article 1', 'Article 2', 'Article 3'].entries()) {
			const article_id = crypto.randomUUID();
			await db.insert(schema.article).values({
				id: article_id,
				canonical_url: `https://example.com/${article_id}`,
				title,
				summary: `${title} summary`,
				category: 'News'
			});

			await db.insert(schema.daily_edition_article).values({
				id: crypto.randomUUID(),
				daily_edition_id: edition_id,
				article_id,
				position: (index + 1) * 1024
			});
		}

		await page.goto(`/editions/${edition_date}`);

		const lineup_titles = page.locator('.article-card .article-title');
		const lineup_numbers = page.locator('.position-number');

		await expect(lineup_titles).toHaveText(['Article 1', 'Article 2', 'Article 3']);
		await expect(lineup_numbers).toHaveText(['1', '2', '3']);

		await page
			.locator('.article-card')
			.filter({ has: page.getByRole('heading', { name: 'Article 3' }) })
			.getByRole('button', { name: 'Up' })
			.click();

		await expect(lineup_titles).toHaveText(['Article 1', 'Article 3', 'Article 2']);
		await expect(lineup_numbers).toHaveText(['1', '2', '3']);

		await expect
			.poll(async () => {
				const rows = await db
					.select({ title: schema.article.title })
					.from(schema.daily_edition_article)
					.innerJoin(schema.article, eq(schema.daily_edition_article.article_id, schema.article.id))
					.where(eq(schema.daily_edition_article.daily_edition_id, edition_id))
					.orderBy(asc(schema.daily_edition_article.position));

				return rows.map((row) => row.title);
			})
			.toEqual(['Article 1', 'Article 3', 'Article 2']);

		await page.reload();

		await expect(lineup_titles).toHaveText(['Article 1', 'Article 3', 'Article 2']);
		await expect(lineup_numbers).toHaveText(['1', '2', '3']);
	});
});
