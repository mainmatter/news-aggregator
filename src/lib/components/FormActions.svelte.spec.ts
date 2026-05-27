import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import FormActions from './FormActions.svelte';
import { html_snippet } from './test-utils';

describe('FormActions.svelte', () => {
	it('renders action content in a shared action row', async () => {
		render(FormActions, {
			props: {
				children: html_snippet('<button>Save</button>')
			}
		});

		const button = page.getByRole('button', { name: 'Save' });
		await expect.element(button).toBeInTheDocument();
	});
});
