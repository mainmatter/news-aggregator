import { expect, test } from './test';

test.describe('news', () => {
	test('shows responsive edition dates on news and editor pages', async ({ page, db, schema }) => {
		const [user] = await db.select().from(schema.user).all();
		const edition_id = crypto.randomUUID();
		const edition_date = '2026-03-23';

		await db.insert(schema.daily_edition).values({
			id: edition_id,
			user_id: user.id,
			edition_date,
			status: 'draft',
			title: 'Responsive Date Edition'
		});

		await page.setViewportSize({ width: 1280, height: 720 });
		await page.goto(`/news/${edition_date}`);

		await expect(page.locator('.date-long')).toBeVisible();
		await expect(page.locator('.date-long')).toHaveText('Monday, March 23, 2026');
		await expect(page.locator('.date-short')).toBeHidden();

		await page.goto(`/editions/${edition_date}`);

		await expect(page.locator('.date-long').first()).toBeVisible();
		await expect(page.locator('.date-long').first()).toHaveText('Monday, March 23, 2026');
		await expect(page.locator('.date-short').first()).toBeHidden();

		await page.setViewportSize({ width: 390, height: 844 });
		await page.goto(`/news/${edition_date}`);

		await expect(page.locator('.date-long')).toBeHidden();
		await expect(page.locator('.date-short')).toBeVisible();
		await expect(page.locator('.date-short')).toHaveText('Mar 23, 2026');

		await page.goto(`/editions/${edition_date}`);

		await expect(page.locator('.date-long').first()).toBeHidden();
		await expect(page.locator('.date-short').first()).toBeVisible();
		await expect(page.locator('.date-short').first()).toHaveText('Mar 23, 2026');

		await page.setViewportSize({ width: 1280, height: 720 });
		await page.goto('/editions');

		await expect(page.locator('.edition-card .date-long')).toBeVisible();
		await expect(page.locator('.edition-card .date-long')).toHaveText('Monday, March 23, 2026');
		await expect(page.locator('.edition-card .date-short')).toBeHidden();

		await page.setViewportSize({ width: 390, height: 844 });
		await page.goto('/editions');

		await expect(page.locator('.edition-card .date-long')).toBeHidden();
		await expect(page.locator('.edition-card .date-short')).toBeVisible();
		await expect(page.locator('.edition-card .date-short')).toHaveText('Mar 23, 2026');
	});

	test('shows manage sources CTA when user has no sources', async ({ page }) => {
		await page.goto('/news');

		await expect(page.locator('.generation-form a.generation-button')).toHaveText('Manage sources');
		await expect(page.locator('.generation-form a.generation-button')).toHaveAttribute(
			'href',
			'/sources'
		);
		await expect(page.locator('.generation-form button.generation-button')).toHaveCount(0);
		await expect(page.getByRole('button', { name: 'Start generation' })).toHaveCount(0);
	});

	test('shows start generation CTA when at least one active source is available', async ({
		page,
		db,
		schema
	}) => {
		const [user] = await db.select().from(schema.user).all();
		const source_id = crypto.randomUUID();

		await db.insert(schema.source).values({
			id: source_id,
			canonical_url: `https://example.com/${source_id}`
		});

		await db.insert(schema.user_source).values({
			user_id: user.id,
			source_id,
			display_name: 'Example source',
			is_active: true
		});

		await page.goto('/news');

		await expect(page.locator('.generation-form button.generation-button')).toHaveText(
			'Start generation'
		);
		await expect(page.getByRole('button', { name: 'Start generation' })).toBeVisible();
	});
});
