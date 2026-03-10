import { page } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';

vi.mock('$lib/theme.remote', () => ({
	get_theme: vi.fn().mockResolvedValue(null)
}));

describe('ModeToggle.svelte', () => {
	it('should render button', async () => {
		const ModeToggle = (await import('./ModeToggle.svelte')).default;
		render(ModeToggle);

		const button = page.getByRole('button');
		await expect.element(button).toBeInTheDocument();
	});

	it('should toggle label text when clicked', async () => {
		const ModeToggle = (await import('./ModeToggle.svelte')).default;
		render(ModeToggle);

		const button = page.getByRole('button');
		// Default is dark (theme === null), so should show "Light" label
		await expect.element(page.getByText('Light')).toBeInTheDocument();

		await button.click();
		await expect.element(page.getByText('Dark')).toBeInTheDocument();
	});
});
