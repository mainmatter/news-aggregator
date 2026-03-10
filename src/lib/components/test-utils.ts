import { createRawSnippet } from 'svelte';

export function text_snippet(txt: string) {
	return createRawSnippet(() => ({
		render: () => `<span>${txt}</span>`
	}));
}
