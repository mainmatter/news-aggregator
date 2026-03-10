import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import NavLink from './NavLink.svelte';
import { text_snippet } from './test-utils';

describe('NavLink.svelte', () => {
	it('should render a link with correct href and text', async () => {
		render(NavLink, {
			props: {
				href: '/sources',
				children: text_snippet('Manage Sources')
			}
		});

		const link = page.getByRole('link', { name: 'Manage Sources' });
		await expect.element(link).toBeInTheDocument();
		await expect.element(link).toHaveAttribute('href', '/sources');
	});
});
