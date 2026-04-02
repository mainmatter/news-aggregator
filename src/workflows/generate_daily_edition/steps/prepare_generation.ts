import { db } from '$lib/server/db';
import { daily_edition, daily_edition_article } from '$lib/server/db/schema';
import { and, eq, sql } from 'drizzle-orm';
import type { EditionGenerationInput, PreparedGenerationState } from '../types';

function get_default_title(edition_date: string) {
	const [year, month, day] = edition_date.split('-').map(Number);
	const formatted_date = new Date(Date.UTC(year, month - 1, day)).toLocaleDateString('en-US', {
		weekday: 'long',
		month: 'long',
		day: 'numeric',
		year: 'numeric',
		timeZone: 'UTC'
	});

	return `Daily Edition - ${formatted_date}`;
}

export async function prepare_generation(input: EditionGenerationInput) {
	'use step';

	const [existing] = await db
		.select({
			id: daily_edition.id,
			edition_date: daily_edition.edition_date,
			status: daily_edition.status,
			title: daily_edition.title,
			summary: daily_edition.summary,
			generated_at: daily_edition.generated_at,
			article_count: sql<number>`(
				select count(*) from ${daily_edition_article}
				where ${daily_edition_article.daily_edition_id} = ${daily_edition.id}
			)`.mapWith(Number)
		})
		.from(daily_edition)
		.where(
			and(
				eq(daily_edition.user_id, input.user_id),
				eq(daily_edition.edition_date, input.edition_date)
			)
		)
		.limit(1);

	if (existing?.status === 'generating') {
		throw new Error('This edition is already generating');
	}

	if (existing && existing.article_count > 0 && !input.replace_existing) {
		throw new Error('This edition already has articles. Use replace_existing to rebuild it.');
	}

	if (existing) {
		await db
			.update(daily_edition)
			.set({ status: 'generating' })
			.where(eq(daily_edition.id, existing.id));

		return {
			edition_id: existing.id,
			edition_date: existing.edition_date,
			had_existing_edition: true,
			previous_status: existing.status,
			previous_title: existing.title,
			previous_summary: existing.summary,
			previous_generated_at: existing.generated_at,
			previous_article_count: existing.article_count,
			replace_existing: input.replace_existing
		} satisfies PreparedGenerationState;
	}

	const [created] = await db
		.insert(daily_edition)
		.values({
			user_id: input.user_id,
			edition_date: input.edition_date,
			status: 'generating',
			title: get_default_title(input.edition_date),
			summary: 'Generating your daily edition from active sources.'
		})
		.returning();

	return {
		edition_id: created.id,
		edition_date: created.edition_date,
		had_existing_edition: false,
		previous_status: null,
		previous_title: null,
		previous_summary: null,
		previous_generated_at: null,
		previous_article_count: 0,
		replace_existing: input.replace_existing
	} satisfies PreparedGenerationState;
}
