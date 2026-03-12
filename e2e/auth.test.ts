import { expect, register_user, sign_in_user, test, test_user } from './test';

test.describe('unauthenticated', () => {
	test.use({ auto_register_user: false });

	test('login page renders with expected elements', async ({ page, db, schema }) => {
		const users = await db.select().from(schema.user).all();

		expect(users).toHaveLength(0);

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

test.describe('authenticated', () => {
	test('authenticated user on / gets redirected to /news', async ({ page }) => {
		await page.goto('/');
		await expect(page).toHaveURL('/news', { timeout: 10_000 });
	});

	test('can sign out and get redirected to /', async ({ page }) => {
		await page.getByRole('button', { name: /sign out/i }).click();

		await expect(page).toHaveURL('/', { timeout: 10_000 });
		await expect(page.locator('input#email')).toBeVisible();
	});
});

test.describe('registration and login flow', () => {
	test.use({ auto_register_user: false });

	test('can register a new account and get redirected to /news', async ({ page }) => {
		await register_user(page);
		await expect(page.locator('h1')).toHaveText('Your News');
	});

	test('shows error for invalid login', async ({ page }) => {
		await register_user(page);

		await page.context().clearCookies();
		await page.goto('/');

		await page.locator('input#email').fill(test_user.email);
		await page.locator('input#password').fill('WrongPassword!');
		await page.getByRole('button', { name: 'Sign In' }).click();

		await expect(page).toHaveURL('/');
		await expect(page.locator('.error-message')).toBeVisible({ timeout: 10_000 });
	});

	test('can sign in after registering an account', async ({ page }) => {
		await register_user(page);

		await page.context().clearCookies();

		await sign_in_user(page);
		await expect(page.locator('h1')).toHaveText('Your News');
	});
});
