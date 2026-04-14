import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';

const mock_page = {
	params: {
		date: '2000-01-01'
	}
};

vi.mock('$app/state', () => ({
	page: mock_page
}));

describe('EditionsList.svelte', () => {
	it('should always show a clickable today link separated from the historical days', async () => {
		const EditionsList = (await import('./EditionsList.svelte')).default;
		const { container } = render(EditionsList, {
			props: {
				editions: [],
				max: 5
			}
		});

		expect(container.querySelector('a[href="/news"]')).not.toBeNull();
		expect(container.querySelector('.today-separator')).not.toBeNull();
	});
});
