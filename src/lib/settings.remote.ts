import * as v from 'valibot';
import { form, query } from '$app/server';
import { get_user } from '$lib/auth.remote';
import {
	get_user_settings as get_server_user_settings,
	upsert_user_settings
} from '$lib/server/settings';

const article_selection_prompt_schema = v.optional(
	v.pipe(
		v.string(),
		v.trim(),
		v.maxLength(1000, 'Article selection guidance must be 1000 characters or fewer')
	)
);

export const get_user_settings = query(async () => {
	const user = await get_user();
	return get_server_user_settings(user.id);
});

export const update_user_settings = form(
	v.object({
		article_selection_prompt: article_selection_prompt_schema
	}),
	async ({ article_selection_prompt }) => {
		const user = await get_user();

		await upsert_user_settings({
			user_id: user.id,
			article_selection_prompt: article_selection_prompt || null
		});

		await get_user_settings().refresh();
	}
);
