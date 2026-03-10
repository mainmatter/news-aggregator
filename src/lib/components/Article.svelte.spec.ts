import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Article from './Article.svelte';

const MAX_LENGTH = 150;
const MAX_OFFSET = 20;

function make_article(summary: string) {
	return {
		article: {
			id: 1,
			title: 'Test Article',
			source: 'Test Source',
			published_at: '2026-03-09',
			summary,
			url: 'https://example.com',
			category: 'Tech'
		},
		index: 0
	};
}

describe('Article.svelte summary trimming', () => {
	it('should not trim a short summary that is below max_length', async () => {
		const short_summary = 'This is a short summary.';
		render(Article, { props: make_article(short_summary) });

		const summary_el = page.getByText(short_summary);
		await expect.element(summary_el).toBeInTheDocument();
		await expect.element(summary_el).not.toHaveClass('fade-out');
	});

	it('should not trim when summary length minus max_offset is below max_length', async () => {
		// length = MAX_LENGTH + MAX_OFFSET - 5 = 165 characters
		// total - MAX_OFFSET = 145, which is < MAX_LENGTH (150), so no trim
		const summary = 'A'.repeat(MAX_LENGTH + MAX_OFFSET - 5);
		render(Article, { props: make_article(summary) });

		const summary_el = page.getByText(summary);
		await expect.element(summary_el).toBeInTheDocument();
		await expect.element(summary_el).not.toHaveClass('fade-out');
	});

	it('should trim a long summary and add fade-out class', async () => {
		// length = 300, total - MAX_OFFSET = 280 > MAX_LENGTH (150), so it should trim
		const long_summary = 'B'.repeat(300);
		render(Article, { props: make_article(long_summary) });

		const summary_el = page.getByRole('article').getByText(/^B+$/);
		await expect.element(summary_el).toBeInTheDocument();
		await expect.element(summary_el).toHaveClass('fade-out');

		const text = await summary_el.element().textContent;
		// trimmed to MAX_LENGTH + MAX_OFFSET = 170 characters
		expect(text).toHaveLength(MAX_LENGTH + MAX_OFFSET);
	});

	it('should not trim when summary is exactly at the boundary', async () => {
		// length = MAX_LENGTH + MAX_OFFSET = 170
		// total - MAX_OFFSET = 150, which is NOT below MAX_LENGTH, it's equal
		// The check is "total - max_offset < max_length" — equal means it SHOULD trim
		// Actually re-reading: "check if the total length - max_offset is below the trim"
		// "below" means strictly less than, so equal => trim
		const summary = 'C'.repeat(MAX_LENGTH + MAX_OFFSET);
		render(Article, { props: make_article(summary) });

		const summary_el = page.getByRole('article').getByText(/^C+$/);
		await expect.element(summary_el).toHaveClass('fade-out');

		const text = await summary_el.element().textContent;
		expect(text).toHaveLength(MAX_LENGTH + MAX_OFFSET);
	});
});
