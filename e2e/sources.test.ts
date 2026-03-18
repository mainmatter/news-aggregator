import { expect, test } from './test';

test.describe('sources', () => {
	test('handles validation and CRUD operations', async ({ page, db, schema }) => {
		await page.goto('/sources');

		const add_form = page.locator('.add-form');

		await page.getByRole('button', { name: 'ADD SOURCE' }).click();

		await expect(page.getByText('URL is required')).toBeVisible();
		await expect(page.getByText('Name is required')).toBeVisible();

		await add_form.getByLabel('FEED URL').fill('https://example.com/feed.xml');
		await add_form.getByLabel('DISPLAY NAME').fill('Example Feed');
		await add_form.getByLabel('LABEL (optional)').fill('Tech');
		await page.getByRole('button', { name: 'ADD SOURCE' }).click();

		const source_card = page.locator('.source-card').first();

		await expect(source_card).toBeVisible();
		await expect(source_card.getByRole('heading', { name: 'Example Feed' })).toBeVisible();
		await expect(page.getByText('1 SOURCE')).toBeVisible();

		await add_form.getByLabel('FEED URL').fill('https://example.com/second-feed.xml');
		await add_form.getByLabel('DISPLAY NAME').fill('Second Feed');
		await add_form.getByLabel('LABEL (optional)').fill('Business');
		await page.getByRole('button', { name: 'ADD SOURCE' }).click();

		const second_source_card = page.locator('.source-card').filter({
			has: page.getByRole('heading', { name: 'Second Feed' })
		});

		await expect(second_source_card).toBeVisible();
		await expect(second_source_card.getByRole('heading', { name: 'Second Feed' })).toBeVisible();
		await expect(page.getByText('2 SOURCES')).toBeVisible();

		await second_source_card.getByLabel('URL').fill('https://example.com/feed.xml');
		await second_source_card.getByRole('button', { name: 'SAVE' }).click();
		await expect(
			second_source_card.getByText('You already have a source with this URL')
		).toBeVisible();

		await source_card.getByLabel('DISPLAY NAME').fill('');
		await source_card.getByRole('button', { name: 'SAVE' }).click();
		await expect(source_card.getByText('Name is required')).toBeVisible();

		await source_card.getByLabel('DISPLAY NAME').fill('Updated Feed');
		await source_card.getByLabel('URL').fill('https://example.com/updated-feed.xml');
		await source_card.getByLabel('LABEL').fill('World');
		await source_card.getByRole('checkbox', { name: 'ACTIVE' }).uncheck();
		await source_card.getByRole('button', { name: 'SAVE' }).click();

		await expect(source_card.getByRole('heading', { name: 'Updated Feed' })).toBeVisible();
		await expect(source_card.getByLabel('URL')).toHaveValue('https://example.com/updated-feed.xml');
		await expect(source_card.getByLabel('LABEL')).toHaveValue('World');
		await expect(source_card.getByRole('checkbox', { name: 'ACTIVE' })).not.toBeChecked();

		await page.reload();

		const reloaded_card = page.locator('.source-card').first();

		await expect(reloaded_card.getByRole('heading', { name: 'Updated Feed' })).toBeVisible();
		await expect(reloaded_card.getByLabel('DISPLAY NAME')).toHaveValue('Updated Feed');
		await expect(reloaded_card.getByLabel('URL')).toHaveValue(
			'https://example.com/updated-feed.xml'
		);
		await expect(reloaded_card.getByLabel('LABEL')).toHaveValue('World');
		await expect(reloaded_card.getByRole('checkbox', { name: 'ACTIVE' })).not.toBeChecked();

		await reloaded_card.getByLabel('DISPLAY NAME').fill('Reader Alias');
		await reloaded_card.getByRole('button', { name: 'SAVE' }).click();
		await expect(reloaded_card.getByRole('heading', { name: 'Reader Alias' })).toBeVisible();

		const user_source_rows = await db.select().from(schema.user_source).all();

		const aliased_user_source = user_source_rows.find(
			(row) => row.display_name === 'Reader Alias' && row.label === 'World'
		);

		expect(aliased_user_source?.display_name).toBe('Reader Alias');

		await reloaded_card.getByRole('button', { name: 'DELETE' }).click();
		await second_source_card.getByRole('button', { name: 'DELETE' }).click();

		await expect(page.locator('.source-card')).toHaveCount(0);
		await expect(page.getByText('No sources yet. Add one above to get started.')).toBeVisible();
	});
});
