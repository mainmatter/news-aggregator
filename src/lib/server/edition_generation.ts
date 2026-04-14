import { dev } from '$app/environment';
import { db } from '$lib/server/db';
import { daily_edition, daily_edition_article, user_source } from '$lib/server/db/schema';
import {
	get_default_edition_title,
	get_owned_edition_generation_state
} from '$lib/server/editions';
import { and, eq, sql } from 'drizzle-orm';
import { start } from 'workflow/api';
import { generate_daily_edition_workflow } from '../../workflows/generate_daily_edition';
import type {
	PreparationGenerationInput,
	PreparedGenerationState
} from '../../workflows/generate_daily_edition/types';

async function get_tunnel_base_url() {
	if (!dev) return undefined;

	const { getTunnelUrl } = await import('virtual:vite-plugin-cloudflare-tunnel');
	return getTunnelUrl();
}

export async function prepare_generation(input: PreparationGenerationInput) {
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
			title: get_default_edition_title(input.edition_date),
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

export async function start_daily_edition_generation({
	user_id,
	edition_date,
	replace_existing = false
}: {
	user_id: string;
	edition_date: string;
	replace_existing?: boolean;
}) {
	const existing = await get_owned_edition_generation_state(user_id, edition_date);

	if (existing?.status === 'generating') {
		throw new Error('This edition is already generating');
	}

	if (existing && existing.article_count > 0 && !replace_existing) {
		throw new Error(
			'This edition already exists. Only empty editions can be generated again in v1.'
		);
	}

	const [active_source] = await db
		.select({ id: user_source.id })
		.from(user_source)
		.where(and(eq(user_source.user_id, user_id), eq(user_source.is_active, true)))
		.limit(1);

	if (!active_source) {
		throw new Error('Add at least one active source before starting generation.');
	}

	const tunnel_base_url = await get_tunnel_base_url();

	const preparation = await prepare_generation({
		user_id,
		edition_date,
		replace_existing,
		tunnel_base_url
	});

	return start(generate_daily_edition_workflow, [
		{
			user_id,
			edition_date,
			replace_existing,
			tunnel_base_url,
			preparation
		}
	]);
}
