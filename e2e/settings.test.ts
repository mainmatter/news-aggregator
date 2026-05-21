import { expect, test } from './test';

test.describe('settings', () => {
	test('updates article selection guidance', async ({ page, db, schema }) => {
		await page.goto('/settings');

		const settings_form = page.locator('.settings-form');
		const settings_textarea = settings_form.getByLabel('Article selection guidance');
		const settings_save_button = settings_form.getByRole('button', { name: 'SAVE' });

		await expect(page.getByRole('link', { name: 'Editions' })).toHaveAttribute('href', '/editions');
		await expect(page.getByRole('link', { name: 'Sources' })).toHaveAttribute('href', '/sources');

		await settings_textarea.fill('   Prefer deep reporting on climate\nwith policy context.   ');
		await settings_save_button.click();
		await page.reload();
		await expect(settings_textarea).toHaveValue(
			'Prefer deep reporting on climate\nwith policy context.'
		);

		await settings_textarea.fill('  Focus on accountability reporting and labor news.  ');
		await settings_save_button.click();
		await page.reload();
		await expect(settings_textarea).toHaveValue(
			'Focus on accountability reporting and labor news.'
		);

		await settings_textarea.fill('');
		await settings_save_button.click();
		await page.reload();
		await expect(settings_textarea).toHaveValue('');

		const user_setting_rows = await db.select().from(schema.user_settings).all();

		expect(user_setting_rows).toHaveLength(1);
		expect(user_setting_rows[0]?.article_selection_prompt).toBeNull();
	});
});
