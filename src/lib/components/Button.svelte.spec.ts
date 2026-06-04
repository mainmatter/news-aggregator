import { page } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Button from './Button.svelte';
import { text_snippet } from './test-utils';

function wait(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('Button.svelte', () => {
	it('should render button with text', async () => {
		const onclick = vi.fn();
		render(Button, {
			props: {
				onclick,
				children: text_snippet('Click me')
			}
		});

		const button = page.getByRole('button', { name: 'Click me' });
		await expect.element(button).toBeInTheDocument();
	});

	it('should apply default variant class', async () => {
		const onclick = vi.fn();
		render(Button, {
			props: {
				onclick,
				children: text_snippet('Default')
			}
		});

		const button = page.getByRole('button', { name: 'Default' });
		await expect.element(button).toHaveClass('btn-default');
	});

	it('should apply ghost variant class', async () => {
		const onclick = vi.fn();
		render(Button, {
			props: {
				onclick,
				variant: 'ghost',
				children: text_snippet('Ghost')
			}
		});

		const button = page.getByRole('button', { name: 'Ghost' });
		await expect.element(button).toHaveClass('btn-ghost');
	});

	it('should fire onclick when clicked', async () => {
		const onclick = vi.fn();
		render(Button, {
			props: {
				onclick,
				children: text_snippet('Fire')
			}
		});

		const button = page.getByRole('button', { name: 'Fire' });
		await button.click();
		expect(onclick).toHaveBeenCalled();
	});

	it('should show a loading overlay without disabling the button', async () => {
		const onclick = vi.fn();
		const { container } = render(Button, {
			props: {
				onclick,
				loading: true,
				children: text_snippet('Save')
			}
		});

		const button = page.getByRole('button', { name: 'Save' });
		await expect.element(button).toHaveAttribute('aria-busy', 'true');
		await expect.element(button).not.toBeDisabled();
		expect(container.querySelector('.loading-overlay')).not.toBeNull();

		await button.click();
		expect(onclick).toHaveBeenCalled();
	});

	it('should keep the loading overlay visible for at least 300ms', async () => {
		const { container, rerender } = render(Button, {
			props: {
				loading: true,
				children: text_snippet('Save')
			}
		});

		const button = page.getByRole('button', { name: 'Save' });
		await expect.element(button).toHaveAttribute('aria-busy', 'true');

		await rerender({ loading: false, children: text_snippet('Save') });
		expect(container.querySelector('.loading-overlay')).not.toBeNull();
		await expect.element(button).not.toHaveAttribute('aria-busy');

		await wait(250);
		expect(container.querySelector('.loading-overlay')).not.toBeNull();

		await wait(100);
		expect(container.querySelector('.loading-overlay')).toBeNull();
		await expect.element(button).not.toHaveAttribute('aria-busy');
	});

	it('should expose an imperative status animation API', async () => {
		vi.useFakeTimers();

		const { component } = render(Button, {
			props: {
				children: text_snippet('Save')
			}
		});

		const button = page.getByRole('button', { name: 'Save' });

		component.show_feedback('success', 800);
		await expect.element(button).toHaveAttribute('data-feedback', 'success');

		await vi.advanceTimersByTimeAsync(800);
		await expect.element(button).toHaveAttribute('data-feedback', 'idle');

		vi.useRealTimers();
	});
});
