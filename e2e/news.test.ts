import { expect, test } from './test';

test.describe('news', () => {
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
