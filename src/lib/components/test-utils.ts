import { createRawSnippet } from 'svelte';

export function text_snippet(txt: string) {
	return createRawSnippet(() => ({
		render: () => `<span>${txt}</span>`
	}));
}

export function html_snippet(html: string) {
	return createRawSnippet(() => ({
		render: () => html
	}));
}
