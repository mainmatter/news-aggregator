import { db } from '$lib/server/db';
import { source, user_source } from '$lib/server/db/schema';
import { and, asc, eq } from 'drizzle-orm';
import type { WorkflowUserSource } from '../types';

export async function get_user_sources(user_id: string) {
	'use step';

	const rows = await db
		.select({
			source_id: user_source.source_id,
			display_name: user_source.display_name,
			canonical_url: source.canonical_url,
			label: user_source.label
		})
		.from(user_source)
		.innerJoin(source, eq(user_source.source_id, source.id))
		.where(and(eq(user_source.user_id, user_id), eq(user_source.is_active, true)))
		.orderBy(asc(user_source.created_at));

	return rows satisfies WorkflowUserSource[];
}
