import { expect, test } from './test';

test.use({ auto_register_user: false });

test('login page has expected h1', async ({ page }) => {
	await page.goto('/');
	await expect(page.locator('h1')).toBeVisible();
});
