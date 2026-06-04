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
	it('uses a 7-day story window when the user has no prior generated editions', async () => {
		workflow_api_mocks.start.mockReset();
		const { database, cleanup } = await create_test_database();

		try {
			const user_id = crypto.randomUUID();
			const source_id = crypto.randomUUID();

			await database.insert(schema.user).values({
				id: user_id,
				name: 'New Edition User',
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
				display_name: 'Active source'
			});

			await start_daily_edition_generation({
				user_id,
				edition_date: '2026-04-14'
			});

			expect(workflow_api_mocks.start).toHaveBeenCalledOnce();
			const [[, [workflow_input]]] = workflow_api_mocks.start.mock.calls;
			expect(workflow_input.preparation.story_window_start).toEqual(
				new Date('2026-04-07T23:59:59.999Z')
			);
		} finally {
			await cleanup();
		}
	});

	it('uses the most recent generated edition as the story window start', async () => {
		workflow_api_mocks.start.mockReset();
		const { database, cleanup } = await create_test_database();

		try {
			const user_id = crypto.randomUUID();
			const source_id = crypto.randomUUID();
			const older_generated_at = new Date('2026-04-10T08:00:00.000Z');
			const latest_generated_at = new Date('2026-04-12T15:30:00.000Z');
			const future_generated_at = new Date('2026-04-20T15:30:00.000Z');

			await database.insert(schema.user).values({
				id: user_id,
				name: 'Returning Edition User',
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
				display_name: 'Active source'
			});

			await database.insert(schema.daily_edition).values([
				{
					user_id,
					edition_date: '2026-04-10',
					status: 'published',
					generated_at: older_generated_at
				},
				{
					user_id,
					edition_date: '2026-04-12',
					status: 'published',
					generated_at: latest_generated_at
				},
				{
					user_id,
					edition_date: '2026-04-20',
					status: 'published',
					generated_at: future_generated_at
				}
			]);

			await start_daily_edition_generation({
				user_id,
				edition_date: '2026-04-14'
			});

			expect(workflow_api_mocks.start).toHaveBeenCalledOnce();
			const [[, [workflow_input]]] = workflow_api_mocks.start.mock.calls;
			expect(workflow_input.preparation.story_window_start).toEqual(
				new Date('2026-04-12T00:00:00.000Z')
			);
		} finally {
			await cleanup();
		}
	});

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
