import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import FeaturedArticle from './FeaturedArticle.svelte';

function make_article() {
	return {
		id: 1,
		title: 'Global Climate Summit Reaches Historic Agreement',
		source: 'Reuters',
		published_at: '2026-03-09',
		summary:
			'World leaders have agreed to ambitious new emissions targets, pledging a 60% reduction by 2035.',
		url: 'https://example.com/climate',
		category: 'World'
	};
}

describe('FeaturedArticle.svelte', () => {
	it('should render article title as h2', async () => {
		render(FeaturedArticle, { props: { article: make_article(), index: 0 } });

		const heading = page.getByRole('heading', { level: 2 });
		await expect.element(heading).toBeInTheDocument();
		await expect
			.element(heading)
			.toHaveTextContent('Global Climate Summit Reaches Historic Agreement');
	});

	it('should render meta with category, source, and date', async () => {
		render(FeaturedArticle, { props: { article: make_article(), index: 0 } });

		const category = page.getByText('World', { exact: true }).first();
		await expect.element(category).toBeInTheDocument();
		await expect.element(page.getByText('Reuters')).toBeInTheDocument();
		await expect.element(page.getByText('2026-03-09')).toBeInTheDocument();
	});

	it('should render summary text', async () => {
		render(FeaturedArticle, { props: { article: make_article(), index: 0 } });

		await expect.element(page.getByText(/World leaders have agreed/)).toBeInTheDocument();
	});

	it('should render read full article link', async () => {
		render(FeaturedArticle, { props: { article: make_article(), index: 0 } });

		const link = page.getByRole('link', { name: 'Read Full Article' });
		await expect.element(link).toBeInTheDocument();
		await expect.element(link).toHaveAttribute('href', 'https://example.com/climate');
	});
});
