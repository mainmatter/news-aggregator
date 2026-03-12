/* eslint-disable no-empty-pattern */
import { test as base, expect, type Page } from '@playwright/test';
import { create_db, type Database } from '../src/lib/server/db/create_db.js';
import * as schema from '../src/lib/server/db/schema.js';
import { reset } from 'drizzle-seed';

const database_url = process.env.DATABASE_URL;
const database_auth_token = process.env.DATABASE_AUTH_TOKEN;

if (!database_url) throw new Error('DATABASE_URL is not set');
if (!database_auth_token) throw new Error('DATABASE_AUTH_TOKEN is not set');

const test_db = create_db(database_url, database_auth_token);

export const test_user = {
	email: 'reader@example.com',
	password: 'TestPassword123!',
	name: 'Test User'
};

export const register_user = async (page: Page) => {
	await page.goto('/');
	await page.locator('input#email').fill(test_user.email);
	await page.locator('input#password').fill(test_user.password);
	await page.locator('input#name').fill(test_user.name);
	await page.getByRole('button', { name: 'Create Account' }).click();
	await expect(page).toHaveURL('/news', { timeout: 10_000 });
};

export const sign_in_user = async (page: Page) => {
	await page.goto('/');
	await page.locator('input#email').fill(test_user.email);
	await page.locator('input#password').fill(test_user.password);
	await page.getByRole('button', { name: 'Sign In' }).click();
	await expect(page).toHaveURL('/news', { timeout: 10_000 });
};

type Options = {
	auto_register_user: boolean;
};

type Fixtures = {
	db: Database;
	schema: typeof schema;
	register_authenticated_user: void;
};

export const test = base.extend<Options & Fixtures>({
	auto_register_user: [true, { option: true }],
	db: [
		async ({}, use) => {
			await reset(test_db as never, schema);
			await use(test_db);
			await reset(test_db as never, schema);
		},
		{ auto: true }
	],
	schema: async ({}, use) => {
		await use(schema);
	},
	register_authenticated_user: [
		async ({ auto_register_user, page }, use) => {
			if (auto_register_user) {
				await register_user(page);
			}

			await use();
		},
		{ auto: true }
	]
});

export { expect };
