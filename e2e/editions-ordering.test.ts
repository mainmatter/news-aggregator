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

	test('manual article creation refreshes lineup and save buttons use shared feedback style', async ({
		page,
		db,
		schema
	}) => {
		const [user] = await db.select().from(schema.user).all();
		const edition_id = crypto.randomUUID();
		const edition_date = '2026-03-24';
		const source_id = crypto.randomUUID();
		const existing_article_id = crypto.randomUUID();

		await db.insert(schema.source).values({
			id: source_id,
			canonical_url: `https://example.com/source-${source_id}`
		});

		await db.insert(schema.user_source).values({
			user_id: user.id,
			source_id,
			display_name: 'Test Source',
			is_active: true
		});

		await db.insert(schema.daily_edition).values({
			id: edition_id,
			user_id: user.id,
			edition_date,
			status: 'draft',
			title: 'Manual Add Edition'
		});

		await db.insert(schema.article).values({
			id: existing_article_id,
			canonical_url: `https://example.com/${existing_article_id}`,
			title: 'Original Article',
			summary: 'Original summary',
			category: 'News'
		});

		await db.insert(schema.source_article).values({
			source_id,
			article_id: existing_article_id
		});

		await db.insert(schema.daily_edition_article).values({
			daily_edition_id: edition_id,
			article_id: existing_article_id,
			position: 1024
		});

		await page.goto(`/editions/${edition_date}`);

		const details_save_button = page.locator('.meta-actions button');
		await expect(details_save_button).toHaveText(/^save$/i);

		const article_card = page.locator('.article-card').first();
		await article_card.locator('.article-overrides .collapsible-toggle').click();

		const overrides_form = article_card.locator('.article-edit-form');
		const overrides_save_button = overrides_form.getByRole('button', { name: /^save$/i });

		await overrides_form.getByLabel('TITLE').fill('Original Article (Updated)');
		await overrides_save_button.click();
		await expect(overrides_save_button).toHaveAttribute('data-feedback', 'success');

		await page.locator('.manual-article .collapsible-toggle').click();

		const manual_form = page.locator('.manual-form');
		await manual_form.getByLabel('SOURCE').selectOption(source_id);
		await manual_form.getByLabel('URL').fill('https://example.com/manual-added-article');
		await manual_form.getByLabel('TITLE').fill('Manually Added Article');
		await manual_form.getByRole('button', { name: 'CREATE ARTICLE' }).click();

		await expect(page.locator('.article-card')).toHaveCount(2);
		await expect(page.locator('.article-card .article-title')).toContainText([
			'Original Article (Updated)',
			'Manually Added Article'
		]);
	});
});
