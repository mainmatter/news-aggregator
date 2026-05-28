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
import { eq } from 'drizzle-orm';

	describe('start_daily_edition_generation', () => {
	it('rejects when the user has no sources and does not create participation logs', async () => {
		workflow_api_mocks.start.mockReset();
		const { database, cleanup } = await create_test_database();

		try {
			const user_id = crypto.randomUUID();

			await database.insert(schema.user).values({
				id: user_id,
				name: 'Empty User',
				email: `${user_id}@example.com`,
				emailVerified: true
			});

			await expect(
				start_daily_edition_generation({
					user_id,
					edition_date: '2026-04-14'
				})
			).rejects.toThrow('Add at least one active source before starting generation.');

			expect(workflow_api_mocks.start).not.toHaveBeenCalled();

			const logs = await database.select().from(schema.source_participation_log);
			expect(logs).toHaveLength(0);
		} finally {
			await cleanup();
		}
	});

	it('short-circuits when all sources are inactive: creates skipped logs for the edition, does not start workflow', async () => {
		workflow_api_mocks.start.mockReset();
		const { database, cleanup } = await create_test_database();

		try {
			const user_id = crypto.randomUUID();
			const source_id = crypto.randomUUID();

			await database.insert(schema.user).values({
				id: user_id,
				name: 'Inactive Sources User',
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

			await start_daily_edition_generation({
				user_id,
				edition_date: '2026-04-14'
			});

			expect(workflow_api_mocks.start).not.toHaveBeenCalled();

			const editions = await database
				.select()
				.from(schema.daily_edition)
				.where(eq(schema.daily_edition.user_id, user_id));
			expect(editions).toHaveLength(1);
			expect(editions[0].status).toBe('published');

			const logs = await database
				.select()
				.from(schema.source_participation_log)
				.where(eq(schema.source_participation_log.daily_edition_id, editions[0].id));
			expect(logs).toHaveLength(1);
			expect(logs[0].status).toBe('skipped');
			expect(logs[0].reason).toBe('Source inactive when generation started.');
		} finally {
			await cleanup();
		}
	});
});
