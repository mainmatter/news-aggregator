import { sentrySvelteKit } from '@sentry/sveltekit';
import devtoolsJson from 'vite-plugin-devtools-json';
import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import { sveltekit } from '@sveltejs/kit/vite';
import { workflowPlugin } from 'workflow/sveltekit';
import cloudflare from 'vite-plugin-cloudflare-tunnel';

const sentry_org = process.env.SENTRY_ORG;
const sentry_project = process.env.SENTRY_PROJECT;

const sentry_plugin =
	sentry_org && sentry_project
		? sentrySvelteKit({
				org: sentry_org,
				project: sentry_project,
				...(process.env.SENTRY_AUTH_TOKEN ? { authToken: process.env.SENTRY_AUTH_TOKEN } : {}),
				...(process.env.SENTRY_RELEASE ? { release: { name: process.env.SENTRY_RELEASE } } : {})
			})
		: null;

export default defineConfig({
	plugins: [
		...(sentry_plugin ? [sentry_plugin] : []),
		sveltekit(),
		workflowPlugin(),
		devtoolsJson(),
		cloudflare()
	],
	test: {
		expect: { requireAssertions: true },
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'client',
					browser: {
						enabled: true,
						provider: playwright(),
						instances: [{ browser: 'chromium', headless: true }]
					},
					include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
					exclude: ['src/lib/server/**']
				}
			},

			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	}
});
