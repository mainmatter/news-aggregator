import { sequence } from '@sveltejs/kit/hooks';
import type { Handle } from '@sveltejs/kit';
import { building } from '$app/environment';
import { auth } from '$lib/server/auth';
import { svelteKitHandler } from 'better-auth/svelte-kit';

const handle_theme: Handle = async ({ event, resolve }) => {
	const theme = event.cookies.get('theme') as 'dark' | 'light' | undefined;
	event.locals.theme = theme ?? null;

	return resolve(event, {
		transformPageChunk({ html }) {
			if (theme) {
				return html.replace('<html lang="en">', `<html lang="en" class="${theme}">`);
			}
			return html;
		}
	});
};

const handle_better_auth: Handle = async ({ event, resolve }) => {
	return svelteKitHandler({ event, resolve, auth, building });
};

export const handle: Handle = sequence(handle_theme, handle_better_auth);
