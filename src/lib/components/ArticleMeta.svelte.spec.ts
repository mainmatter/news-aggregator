import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import ArticleMeta from './ArticleMeta.svelte';

describe('ArticleMeta.svelte', () => {
	it('should render category and all items', async () => {
		render(ArticleMeta, {
			props: { category: 'Tech', items: ['Reuters', '2 hours ago'] }
		});

		await expect.element(page.getByText('Tech')).toBeInTheDocument();
		await expect.element(page.getByText('Reuters')).toBeInTheDocument();
		await expect.element(page.getByText('2 hours ago')).toBeInTheDocument();
	});

	it('should style category with accent color', async () => {
		render(ArticleMeta, { props: { category: 'Science', items: ['Nature'] } });

		const category = page.getByText('Science');
		await expect.element(category).toHaveClass('category');
	});

	it('should render dots between category and items', async () => {
		const { container } = render(ArticleMeta, {
			props: { category: 'Tech', items: ['Source', 'Time'] }
		});

		const dots = container.querySelectorAll('.dot');
		expect(dots.length).toBe(2);
	});

	it('should omit empty items and their separator dots', async () => {
		const { container } = render(ArticleMeta, {
			props: { category: 'Tech', items: ['Source', ''] }
		});

		await expect.element(page.getByText('Source')).toBeInTheDocument();

		const dots = container.querySelectorAll('.dot');
		expect(dots.length).toBe(1);
		expect(container.querySelectorAll('span').length).toBe(3);
	});
});
