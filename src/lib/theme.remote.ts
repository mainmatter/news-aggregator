import { getRequestEvent, query } from '$app/server';

export const get_theme = query(async () => {
	const event = getRequestEvent();
	return (event.cookies.get('theme') as 'dark' | 'light' | undefined) ?? null;
});
