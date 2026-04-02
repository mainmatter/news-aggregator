import { dev } from '$app/environment';
import { start } from 'workflow/api';
import { get_owned_edition_generation_state } from '$lib/server/editions';
import { generate_daily_edition_workflow } from '../../workflows/generate_daily_edition';

async function get_tunnel_base_url() {
	if (!dev) return undefined;

	const { getTunnelUrl } = await import('virtual:vite-plugin-cloudflare-tunnel');
	return getTunnelUrl();
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

	const tunnel_base_url = await get_tunnel_base_url();

	return start(generate_daily_edition_workflow, [
		{
			user_id,
			edition_date,
			replace_existing,
			tunnel_base_url
		}
	]);
}
