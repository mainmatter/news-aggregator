import { get_user_settings } from '$lib/server/settings';

export async function get_user_generation_settings(user_id: string) {
	'use step';

	return get_user_settings(user_id);
}
