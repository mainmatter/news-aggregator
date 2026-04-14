import { describe, expect, it, vi } from 'vitest';
import * as schema from './db/schema';
import { create_test_database } from './test_database';

const workflow_api_mocks = vi.hoisted(() => ({
	start: vi.fn()
}));

vi.mock('workflow/api', () => ({
	start: workflow_api_mocks.start
}));

import { start_daily_edition_generation } from './edition_generation';

describe('start_daily_edition_generation', () => {
	it('rejects when the user has no active sources and does not start a workflow', async () => {
		const { database, cleanup } = await create_test_database();

		try {
			const user_id = crypto.randomUUID();
			const source_id = crypto.randomUUID();

			await database.insert(schema.user).values({
				id: user_id,
				name: 'No Sources User',
				email: `${user_id}@example.com`,
				emailVerified: true
			});

			await database.insert(schema.source).values({
				id: source_id,
				canonical_url: `https://example.com/${source_id}`
			});

			await database.insert(schema.user_source).values({
				user_id,
				source_id,
				display_name: 'Inactive source',
				is_active: false
			});

			await expect(
				start_daily_edition_generation({
					user_id,
					edition_date: '2026-04-14'
				})
			).rejects.toThrow('Add at least one active source before starting generation.');

			expect(workflow_api_mocks.start).not.toHaveBeenCalled();
		} finally {
			await cleanup();
		}
	});
});
