import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import PageHeader from './PageHeader.svelte';
import { text_snippet } from './test-utils';

describe('PageHeader.svelte', () => {
	it('should render all text content', async () => {
		render(PageHeader, {
			props: {
				edition_label: 'Daily Edition',
				date: 'Tuesday, March 10, 2026',
				title: 'Your News',
				article_count: 6,
				nav: text_snippet('Nav content')
			}
		});

		await expect.element(page.getByText('Daily Edition')).toBeInTheDocument();
		await expect.element(page.getByText('Tuesday, March 10, 2026')).toBeInTheDocument();
		await expect.element(page.getByText('6 Stories')).toBeInTheDocument();
		await expect.element(page.getByText('Nav content')).toBeInTheDocument();
	});

	it('should render h1 with title', async () => {
		render(PageHeader, {
			props: {
				edition_label: 'Daily Edition',
				date: 'Tuesday, March 10, 2026',
				title: 'Your News',
				article_count: 6,
				nav: text_snippet('Nav')
			}
		});

		const heading = page.getByRole('heading', { level: 1 });
		await expect.element(heading).toBeInTheDocument();
		await expect.element(heading).toHaveTextContent('Your News');
	});
});
