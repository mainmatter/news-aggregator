import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import FormField from './FormField.svelte';
import { html_snippet } from './test-utils';

describe('FormField.svelte', () => {
	it('renders a labelled field with control content', async () => {
		render(FormField, {
			props: {
				for: 'feed-url',
				label: 'Feed URL',
				children: html_snippet('<input id="feed-url" />')
			}
		});

		const label = page.getByText('Feed URL');
		await expect.element(label).toBeInTheDocument();
		await expect.element(label).toHaveAttribute('for', 'feed-url');
		await expect.element(page.getByRole('textbox')).toBeInTheDocument();
	});

	it('renders optional and description copy', async () => {
		render(FormField, {
			props: {
				for: 'summary',
				label: 'Summary',
				optional: true,
				description: 'Shown in the edition list.',
				children: html_snippet('<textarea id="summary"></textarea>')
			}
		});

		await expect.element(page.getByText('(optional)')).toBeInTheDocument();
		await expect.element(page.getByText('Shown in the edition list.')).toBeInTheDocument();
	});

	it('renders a custom label note', async () => {
		render(FormField, {
			props: {
				for: 'name',
				label: 'Name',
				label_note: '(for registration)',
				children: html_snippet('<input id="name" />')
			}
		});

		await expect.element(page.getByText('(for registration)')).toBeInTheDocument();
	});
});
