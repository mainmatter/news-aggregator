import { page } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';

vi.mock('$lib/theme.remote', () => ({
	get_theme: vi.fn().mockResolvedValue(null)
}));

describe('/+page.svelte', () => {
	it('should render h1', async () => {
		const Page = (await import('./+page.svelte')).default;
		render(Page);

		const heading = page.getByRole('heading', { level: 1 });
		await expect.element(heading).toBeInTheDocument();
	});
});
