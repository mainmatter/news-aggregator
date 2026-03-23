import { asc, eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import type { Database } from './db/create_db';
import * as schema from './db/schema';
import { create_test_database } from './test_database';
import * as editions from './editions';

async function create_edition(database: Database) {
	const user_id = crypto.randomUUID();
	const edition_id = crypto.randomUUID();

	await database.insert(schema.user).values({
		id: user_id,
		name: 'Test User',
		email: `${user_id}@example.com`,
		emailVerified: true
	});

	await database.insert(schema.daily_edition).values({
		id: edition_id,
		user_id,
		edition_date: '2026-03-23',
		status: 'draft'
	});

	return { edition_id, user_id };
}

async function add_article_to_edition(
	database: Database,
	edition_id: string,
	position: number,
	label: string
) {
	const article_id = crypto.randomUUID();
	const edition_article_id = crypto.randomUUID();

	await database.insert(schema.article).values({
		id: article_id,
		canonical_url: `https://example.com/${article_id}`,
		title: label,
		summary: `${label} summary`,
		category: 'News'
	});

	await database.insert(schema.daily_edition_article).values({
		id: edition_article_id,
		daily_edition_id: edition_id,
		article_id,
		position
	});

	return { article_id, edition_article_id };
}

async function seed_edition(database: Database, positions: number[]) {
	const { edition_id } = await create_edition(database);
	const seeded_rows = [] as Array<{ edition_article_id: string; label: string; position: number }>;

	for (const [index, position] of positions.entries()) {
		const label = `Article ${index + 1}`;
		const row = await add_article_to_edition(database, edition_id, position, label);
		seeded_rows.push({ ...row, label, position });
	}

	return { edition_id, seeded_rows };
}

describe('edition ordering helpers', () => {
	it('appends with sparse positions', async () => {
		const { database, cleanup } = await create_test_database();

		try {
			const { edition_id } = await create_edition(database);

			expect(await editions.get_next_position(edition_id)).toBe(editions.POSITION_STEP);

			await add_article_to_edition(database, edition_id, editions.POSITION_STEP, 'Article 1');

			expect(await editions.get_next_position(edition_id)).toBe(editions.POSITION_STEP * 2);
		} finally {
			await cleanup();
		}
	});

	it('computes start, middle, and end insertion positions', async () => {
		const { cleanup } = await create_test_database();

		try {
			expect(editions.calculate_position_for_index([], 0)).toEqual({
				position: editions.POSITION_STEP,
				needs_rebalance: false
			});

			expect(
				editions.calculate_position_for_index(
					[{ position: editions.POSITION_STEP }, { position: editions.POSITION_STEP * 2 }],
					0
				)
			).toEqual({
				position: 0,
				needs_rebalance: false
			});

			expect(
				editions.calculate_position_for_index(
					[{ position: editions.POSITION_STEP }, { position: editions.POSITION_STEP * 2 }],
					1
				)
			).toEqual({
				position: editions.POSITION_STEP * 1.5,
				needs_rebalance: false
			});

			expect(
				editions.calculate_position_for_index(
					[{ position: editions.POSITION_STEP }, { position: editions.POSITION_STEP * 2 }],
					2
				)
			).toEqual({
				position: editions.POSITION_STEP * 3,
				needs_rebalance: false
			});
		} finally {
			await cleanup();
		}
	});

	it('rebalances while preserving article order', async () => {
		const { database, cleanup } = await create_test_database();

		try {
			const { edition_id } = await seed_edition(database, [0.25, 0.5, 0.75]);

			await editions.rebalance_positions(edition_id);

			const rows = await editions.get_edition_articles(edition_id);

			expect(rows.map((row) => row.title)).toEqual(['Article 1', 'Article 2', 'Article 3']);
			expect(rows.map((row) => row.position)).toEqual([
				editions.POSITION_STEP,
				editions.POSITION_STEP * 2,
				editions.POSITION_STEP * 3
			]);
		} finally {
			await cleanup();
		}
	});

	it('moves an article by updating only the moved row when a midpoint is available', async () => {
		const { database, cleanup } = await create_test_database();

		try {
			const { edition_id, seeded_rows } = await seed_edition(database, [
				editions.POSITION_STEP,
				editions.POSITION_STEP * 2,
				editions.POSITION_STEP * 3
			]);

			await editions.move_edition_article(edition_id, seeded_rows[2].edition_article_id, 1);

			const rows = await database
				.select({
					id: schema.daily_edition_article.id,
					position: schema.daily_edition_article.position
				})
				.from(schema.daily_edition_article)
				.where(eq(schema.daily_edition_article.daily_edition_id, edition_id))
				.orderBy(asc(schema.daily_edition_article.position));

			expect(rows.map((row) => row.id)).toEqual([
				seeded_rows[0].edition_article_id,
				seeded_rows[2].edition_article_id,
				seeded_rows[1].edition_article_id
			]);
			expect(rows.map((row) => row.position)).toEqual([
				editions.POSITION_STEP,
				editions.POSITION_STEP * 1.5,
				editions.POSITION_STEP * 2
			]);

			const position_by_id = new Map(rows.map((row) => [row.id, row.position]));

			expect(position_by_id.get(seeded_rows[0].edition_article_id)).toBe(editions.POSITION_STEP);
			expect(position_by_id.get(seeded_rows[1].edition_article_id)).toBe(
				editions.POSITION_STEP * 2
			);
		} finally {
			await cleanup();
		}
	});

	it('rebalances before moving when the midpoint gap is exhausted', async () => {
		const { database, cleanup } = await create_test_database();

		try {
			const { edition_id, seeded_rows } = await seed_edition(database, [
				editions.POSITION_STEP,
				editions.POSITION_STEP + editions.MIN_POSITION_GAP / 2,
				editions.POSITION_STEP * 3
			]);

			await editions.move_edition_article(edition_id, seeded_rows[2].edition_article_id, 1);

			const rows = await database
				.select({
					id: schema.daily_edition_article.id,
					position: schema.daily_edition_article.position
				})
				.from(schema.daily_edition_article)
				.where(eq(schema.daily_edition_article.daily_edition_id, edition_id))
				.orderBy(asc(schema.daily_edition_article.position));

			expect(rows.map((row) => row.id)).toEqual([
				seeded_rows[0].edition_article_id,
				seeded_rows[2].edition_article_id,
				seeded_rows[1].edition_article_id
			]);
			expect(rows.map((row) => row.position)).toEqual([
				editions.POSITION_STEP,
				editions.POSITION_STEP * 1.5,
				editions.POSITION_STEP * 2
			]);
		} finally {
			await cleanup();
		}
	});

	it('leaves gaps untouched when an article is removed', async () => {
		const { database, cleanup } = await create_test_database();

		try {
			const { edition_id, seeded_rows } = await seed_edition(database, [
				editions.POSITION_STEP,
				editions.POSITION_STEP * 2,
				editions.POSITION_STEP * 3
			]);

			await database
				.delete(schema.daily_edition_article)
				.where(eq(schema.daily_edition_article.id, seeded_rows[1].edition_article_id));

			const rows = await editions.get_edition_articles(edition_id);

			expect(rows.map((row) => row.position)).toEqual([
				editions.POSITION_STEP,
				editions.POSITION_STEP * 3
			]);
		} finally {
			await cleanup();
		}
	});
});
