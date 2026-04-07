import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { user_settings } from '$lib/server/db/schema';

export async function get_user_settings(user_id: string) {
	const [row] = await db
		.select({
			article_selection_prompt: user_settings.article_selection_prompt
		})
		.from(user_settings)
		.where(eq(user_settings.user_id, user_id))
		.limit(1);

	return {
		article_selection_prompt: row?.article_selection_prompt ?? null
	};
}

export async function upsert_user_settings({
	user_id,
	article_selection_prompt
}: {
	user_id: string;
	article_selection_prompt: string | null;
}) {
	await db
		.insert(user_settings)
		.values({
			user_id,
			article_selection_prompt
		})
		.onConflictDoUpdate({
			target: user_settings.user_id,
			set: {
				article_selection_prompt,
				updated_at: new Date()
			}
		});

	return get_user_settings(user_id);
}
