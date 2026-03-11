import { expect, test } from '@playwright/test';

// Use a unique suffix per test run to avoid email collisions across runs
const uid = Date.now();

test.describe('unauthenticated', () => {
	test('login page renders with expected elements', async ({ page }) => {
		await page.goto('/');

		// Masthead
		await expect(page.locator('h1')).toHaveText('Your News');

		// Form fields
		await expect(page.locator('input#email')).toBeVisible();
		await expect(page.locator('input#password')).toBeVisible();
		await expect(page.locator('input#name')).toBeVisible();

		// Submit buttons
		await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
		await expect(page.getByRole('button', { name: 'Create Account' })).toBeVisible();
		await expect(page.getByRole('button', { name: /google/i })).toBeVisible();
	});

	test('/news redirects unauthenticated user to /', async ({ page }) => {
		await page.goto('/news');

		// Should be redirected to the login page
		await expect(page).toHaveURL('/');
		await expect(page.locator('h1')).toHaveText('Your News');
		await expect(page.locator('input#email')).toBeVisible();
	});
});

test.describe('registration and login flow', () => {
	const test_email = `test-${uid}@example.com`;
	const test_password = 'TestPassword123!';

	test('can register a new account and get redirected to /news', async ({ page }) => {
		await page.goto('/');

		await page.locator('input#email').fill(test_email);
		await page.locator('input#password').fill(test_password);
		await page.locator('input#name').fill('Test User');
		await page.getByRole('button', { name: 'Create Account' }).click();

		// Should redirect to /news after successful registration
		await expect(page).toHaveURL('/news', { timeout: 10_000 });
		await expect(page.locator('h1')).toHaveText('Your News');
	});

	test('authenticated user on / gets redirected to /news', async ({ page }) => {
		// First, log in
		await page.goto('/');
		await page.locator('input#email').fill(test_email);
		await page.locator('input#password').fill(test_password);
		await page.getByRole('button', { name: 'Sign In' }).click();
		await expect(page).toHaveURL('/news', { timeout: 10_000 });

		// Now navigate to / — should be redirected back to /news
		await page.goto('/');
		await expect(page).toHaveURL('/news', { timeout: 10_000 });
	});

	test('can sign out and get redirected to /', async ({ page }) => {
		// First, log in
		await page.goto('/');
		await page.locator('input#email').fill(test_email);
		await page.locator('input#password').fill(test_password);
		await page.getByRole('button', { name: 'Sign In' }).click();
		await expect(page).toHaveURL('/news', { timeout: 10_000 });

		// Click sign out
		await page.getByRole('button', { name: /sign out/i }).click();

		// Should redirect to login page
		await expect(page).toHaveURL('/', { timeout: 10_000 });
		await expect(page.locator('input#email')).toBeVisible();
	});

	test('shows error for invalid login', async ({ page }) => {
		await page.goto('/');

		await page.locator('input#email').fill('nonexistent@example.com');
		await page.locator('input#password').fill('WrongPassword!');
		await page.getByRole('button', { name: 'Sign In' }).click();

		// Should stay on / and show an error
		await expect(page).toHaveURL('/');
		await expect(page.locator('.error-message')).toBeVisible({ timeout: 10_000 });
	});
});
