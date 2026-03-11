import { page } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';

vi.mock('$lib/auth.remote', () => {
	const noop_field = {
		as: () => ({})
	};

	return {
		get_user: vi.fn().mockResolvedValue(null),
		login_or_register: {
			fields: {
				email: noop_field,
				_password: noop_field,
				name: noop_field,
				action: noop_field
			},
			result: null
		},
		sign_in_google: {}
	};
});

describe('/+page.svelte', () => {
	it('should render h1', async () => {
		const Page = (await import('./+page.svelte')).default;
		render(Page);

		const heading = page.getByRole('heading', { level: 1 });
		await expect.element(heading).toBeInTheDocument();
	});
});
