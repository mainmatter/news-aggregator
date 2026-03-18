import * as v from 'valibot';
import { form, query } from '$app/server';
import { invalid } from '@sveltejs/kit';
import { eq, and } from 'drizzle-orm';
import { get_user } from '$lib/auth.remote';
import { db } from '$lib/server/db';
import { source, user_source } from '$lib/server/db/schema';
import { normalize_url, find_or_create_source, get_owned_user_source } from '$lib/server/sources';

export const get_user_sources = query(async () => {
	const user = await get_user();

	const rows = await db
		.select({
			user_source_id: user_source.id,
			source_id: user_source.source_id,
			display_name: user_source.display_name,
			canonical_url: source.canonical_url,
			source_kind: source.source_kind,
			label: user_source.label,
			is_active: user_source.is_active,
			created_at: user_source.created_at,
			updated_at: user_source.updated_at
		})
		.from(user_source)
		.innerJoin(source, eq(user_source.source_id, source.id))
		.where(eq(user_source.user_id, user!.id))
		.orderBy(user_source.created_at);

	return rows;
});

export type UserSource = Awaited<ReturnType<typeof get_user_sources>>[number];

export const create_user_source = form(
	v.object({
		canonical_url: v.pipe(
			v.string(),
			v.trim(),
			v.nonEmpty('URL is required'),
			v.url('Must be a valid URL')
		),
		display_name: v.pipe(v.string(), v.trim(), v.nonEmpty('Name is required')),
		label: v.optional(v.pipe(v.string(), v.trim())),
		is_active: v.optional(v.boolean(), true)
	}),
	async ({ canonical_url, display_name, label, is_active }, issue) => {
		const user = await get_user();

		let normalized: string;
		try {
			normalized = normalize_url(canonical_url);
		} catch {
			invalid(issue.canonical_url('Invalid URL format'));
		}

		const source_row = await find_or_create_source(normalized);

		// Check if this user already has this source
		const [existing] = await db
			.select()
			.from(user_source)
			.where(and(eq(user_source.user_id, user!.id), eq(user_source.source_id, source_row.id)))
			.limit(1);

		if (existing) {
			invalid(issue.canonical_url('You already have a source with this URL'));
		} else {
			await db.insert(user_source).values({
				user_id: user.id,
				source_id: source_row.id,
				display_name,
				label: label || null,
				is_active
			});
		}

		await get_user_sources().refresh();
	}
);

export const update_user_source = form(
	v.object({
		user_source_id: v.pipe(v.string(), v.nonEmpty()),
		display_name: v.pipe(v.string(), v.trim(), v.nonEmpty('Name is required')),
		canonical_url: v.optional(v.pipe(v.string(), v.trim(), v.url('Must be a valid URL'))),
		label: v.optional(v.pipe(v.string(), v.trim())),
		is_active: v.optional(v.boolean(), false)
	}),
	async ({ user_source_id, display_name, canonical_url, label, is_active }, issue) => {
		const user = await get_user();
		const row = await get_owned_user_source(user_source_id, user!.id);

		if (!row) {
			invalid('Source not found');
		}

		// If URL changed, relink to a different source
		if (canonical_url) {
			let normalized: string;
			try {
				normalized = normalize_url(canonical_url);
			} catch {
				invalid(issue.canonical_url('Invalid URL format'));
			}

			// Get the current source to check if URL actually changed
			const [current_source] = await db
				.select()
				.from(source)
				.where(eq(source.id, row.source_id))
				.limit(1);

			if (current_source && current_source.canonical_url !== normalized) {
				const new_source = await find_or_create_source(normalized);

				// Check uniqueness: does this user already have the new source?
				const [duplicate] = await db
					.select()
					.from(user_source)
					.where(and(eq(user_source.user_id, user!.id), eq(user_source.source_id, new_source.id)))
					.limit(1);

				if (duplicate && duplicate.id !== user_source_id) {
					invalid(issue.canonical_url('You already have a source with this URL'));
				}

				await db
					.update(user_source)
					.set({ source_id: new_source.id })
					.where(eq(user_source.id, user_source_id));
			}
		}

		// Update per-user fields
		const updates: Record<string, unknown> = {};
		updates.display_name = display_name;
		if (label !== undefined) updates.label = label || null;
		if (is_active !== undefined) updates.is_active = is_active;

		await db.update(user_source).set(updates).where(eq(user_source.id, user_source_id));
		await get_user_sources().refresh();
	}
);

export const delete_user_source = form(
	v.object({
		user_source_id: v.pipe(v.string(), v.nonEmpty())
	}),
	async ({ user_source_id }) => {
		const user = await get_user();
		const row = await get_owned_user_source(user_source_id, user!.id);

		if (!row) {
			invalid('Source not found');
		}

		await db.delete(user_source).where(eq(user_source.id, user_source_id));

		await get_user_sources().refresh();
	}
);
