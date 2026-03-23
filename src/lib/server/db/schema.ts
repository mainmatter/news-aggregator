import { sql } from 'drizzle-orm';
import { index, integer, real, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { user } from './auth.schema';

const now = sql`(cast(unixepoch('subsecond') * 1000 as integer))`;

function create_id() {
	return text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID());
}

function create_timestamps() {
	return {
		created_at: integer('created_at', { mode: 'timestamp_ms' }).default(now).notNull(),
		updated_at: integer('updated_at', { mode: 'timestamp_ms' })
			.default(now)
			.$onUpdate(() => new Date())
			.notNull()
	};
}

export const source = sqliteTable(
	'source',
	{
		id: create_id(),
		canonical_url: text('canonical_url').notNull(),
		source_kind: text('source_kind'),
		last_visited_at: integer('last_visited_at', { mode: 'timestamp_ms' }),
		last_success_at: integer('last_success_at', { mode: 'timestamp_ms' }),
		...create_timestamps()
	},
	(table) => [uniqueIndex('source_canonical_url_unique').on(table.canonical_url)]
);

export const user_source = sqliteTable(
	'user_source',
	{
		id: create_id(),
		user_id: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		source_id: text('source_id')
			.notNull()
			.references(() => source.id, { onDelete: 'cascade' }),
		display_name: text('display_name').notNull(),
		label: text('label'),
		is_active: integer('is_active', { mode: 'boolean' }).default(true).notNull(),
		...create_timestamps()
	},
	(table) => [
		uniqueIndex('user_source_user_id_source_id_unique').on(table.user_id, table.source_id),
		index('user_source_source_id_is_active_idx').on(table.source_id, table.is_active)
	]
);

export const article = sqliteTable(
	'article',
	{
		id: create_id(),
		canonical_url: text('canonical_url').notNull(),
		title: text('title'),
		summary: text('summary'),
		category: text('category'),
		published_at: integer('published_at', { mode: 'timestamp_ms' }),
		content_hash: text('content_hash'),
		summarized_at: integer('summarized_at', { mode: 'timestamp_ms' }),
		...create_timestamps()
	},
	(table) => [
		uniqueIndex('article_canonical_url_unique').on(table.canonical_url),
		index('article_published_at_idx').on(table.published_at),
		index('article_content_hash_idx').on(table.content_hash)
	]
);

export const source_article = sqliteTable(
	'source_article',
	{
		id: create_id(),
		source_id: text('source_id')
			.notNull()
			.references(() => source.id, { onDelete: 'cascade' }),
		article_id: text('article_id')
			.notNull()
			.references(() => article.id, { onDelete: 'cascade' }),
		discovered_at: integer('discovered_at', { mode: 'timestamp_ms' }).default(now).notNull(),
		...create_timestamps()
	},
	(table) => [
		uniqueIndex('source_article_source_id_article_id_unique').on(table.source_id, table.article_id)
	]
);

export const daily_edition = sqliteTable(
	'daily_edition',
	{
		id: create_id(),
		user_id: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		edition_date: text('edition_date').notNull(),
		status: text('status').default('draft').notNull(),
		title: text('title'),
		summary: text('summary'),
		generated_at: integer('generated_at', { mode: 'timestamp_ms' }),
		...create_timestamps()
	},
	(table) => [
		uniqueIndex('daily_edition_user_id_edition_date_unique').on(table.user_id, table.edition_date)
	]
);

export const daily_edition_article = sqliteTable(
	'daily_edition_article',
	{
		id: create_id(),
		daily_edition_id: text('daily_edition_id')
			.notNull()
			.references(() => daily_edition.id, { onDelete: 'cascade' }),
		article_id: text('article_id')
			.notNull()
			.references(() => article.id, { onDelete: 'cascade' }),
		position: real('position').notNull(),
		section: text('section'),
		reason: text('reason'),
		custom_title: text('custom_title'),
		custom_summary: text('custom_summary'),
		custom_category: text('custom_category'),
		...create_timestamps()
	},
	(table) => [
		uniqueIndex('daily_edition_article_daily_edition_id_article_id_unique').on(
			table.daily_edition_id,
			table.article_id
		),
		uniqueIndex('daily_edition_article_daily_edition_id_position_unique').on(
			table.daily_edition_id,
			table.position
		)
	]
);

export const source_fetch_job = sqliteTable(
	'source_fetch_job',
	{
		id: create_id(),
		source_id: text('source_id')
			.notNull()
			.references(() => source.id, { onDelete: 'cascade' }),
		status: text('status').default('pending').notNull(),
		scheduled_for: integer('scheduled_for', { mode: 'timestamp_ms' }).default(now).notNull(),
		started_at: integer('started_at', { mode: 'timestamp_ms' }),
		finished_at: integer('finished_at', { mode: 'timestamp_ms' }),
		attempt_count: integer('attempt_count').default(0).notNull(),
		error_message: text('error_message'),
		metadata: text('metadata', { mode: 'json' }),
		...create_timestamps()
	},
	(table) => [
		index('source_fetch_job_source_id_status_scheduled_for_idx').on(
			table.source_id,
			table.status,
			table.scheduled_for
		)
	]
);

export const article_process_job = sqliteTable(
	'article_process_job',
	{
		id: create_id(),
		article_id: text('article_id')
			.notNull()
			.references(() => article.id, { onDelete: 'cascade' }),
		source_fetch_job_id: text('source_fetch_job_id').references(() => source_fetch_job.id, {
			onDelete: 'set null'
		}),
		status: text('status').default('pending').notNull(),
		scheduled_for: integer('scheduled_for', { mode: 'timestamp_ms' }).default(now).notNull(),
		started_at: integer('started_at', { mode: 'timestamp_ms' }),
		finished_at: integer('finished_at', { mode: 'timestamp_ms' }),
		attempt_count: integer('attempt_count').default(0).notNull(),
		error_message: text('error_message'),
		metadata: text('metadata', { mode: 'json' }),
		...create_timestamps()
	},
	(table) => [
		index('article_process_job_article_id_status_scheduled_for_idx').on(
			table.article_id,
			table.status,
			table.scheduled_for
		)
	]
);

export * from './auth.schema';
