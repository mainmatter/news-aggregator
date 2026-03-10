import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import SectionRule from './SectionRule.svelte';

describe('SectionRule.svelte', () => {
	it('should render a separator role element', async () => {
		render(SectionRule);

		const separator = page.getByRole('separator');
		await expect.element(separator).toBeInTheDocument();
	});
});
