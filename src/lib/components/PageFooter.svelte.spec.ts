import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import PageFooter from './PageFooter.svelte';

describe('PageFooter.svelte', () => {
	it('should render tagline text', async () => {
		render(PageFooter, {
			props: {
				tagline: 'Carefully curated. Elegantly delivered.',
				subtitle: 'No algorithms, no noise.'
			}
		});

		await expect
			.element(page.getByText('Carefully curated. Elegantly delivered.'))
			.toBeInTheDocument();
	});

	it('should render subtitle text', async () => {
		render(PageFooter, {
			props: {
				tagline: 'Tagline here',
				subtitle: 'Subtitle goes here'
			}
		});

		await expect.element(page.getByText('Subtitle goes here')).toBeInTheDocument();
	});
});
