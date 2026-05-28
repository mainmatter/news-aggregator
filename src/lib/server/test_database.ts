import { migrate } from 'drizzle-orm/libsql/migrator';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { vi } from 'vitest';
import { create_db, type Database } from './db/create_db';

const database_state = vi.hoisted(() => ({
	database: null as Database | null
}));

vi.mock('$lib/server/db', () => ({
	get db() {
		if (!database_state.database) {
			throw new Error('Test database has not been initialized');
		}

		return database_state.database;
	}
}));

export async function create_test_database() {
	const temp_dir = await mkdtemp(join(tmpdir(), 'news-aggregator-test-'));
	const database = create_db(`file:${join(temp_dir, 'test.db')}`, '');
	await migrate(database, { migrationsFolder: 'drizzle' });
	database_state.database = database;

	return {
		database,
		async cleanup() {
			database_state.database = null;
			await rm(temp_dir, { recursive: true, force: true });
		}
	};
}
