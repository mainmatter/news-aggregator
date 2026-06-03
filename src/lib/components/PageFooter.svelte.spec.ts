import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import PageFooter from './PageFooter.svelte';

describe('PageFooter.svelte', () => {
	it('should render the Mainmatter credit', () => {
		const { container } = render(PageFooter);
		const footer = container.querySelector('footer');

		expect(footer).not.toBeNull();
		expect(footer?.textContent).toContain('Built by Mainmatter');
		expect(footer?.querySelector('svg')).not.toBeNull();
	});
});
