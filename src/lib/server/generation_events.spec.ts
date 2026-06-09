import { describe, expect, it, vi } from 'vitest';
import {
	add_generation_listener,
	get_recent_generation_progress,
	notify_generation_finished,
	notify_generation_progress
} from './generation_events';

describe('generation events', () => {
	it('notifies only listeners for the finished edition', async () => {
		expect.assertions(3);

		const matching_listener = vi.fn();
		const other_listener = vi.fn();
		const matching_subscription = await add_generation_listener('edition-1', matching_listener);
		const other_subscription = await add_generation_listener('edition-2', other_listener);

		await notify_generation_finished({ edition_id: 'edition-1', status: 'published' });
		await matching_subscription.unsubscribe();
		await other_subscription.unsubscribe();
		await notify_generation_finished({ edition_id: 'edition-1', status: 'published' });

		expect(matching_listener).toHaveBeenCalledOnce();
		expect(matching_listener).toHaveBeenCalledWith({
			edition_id: 'edition-1',
			status: 'published'
		});
		expect(other_listener).not.toHaveBeenCalled();
	});

	it('publishes progress updates for the active edition', async () => {
		expect.assertions(2);

		const listener = vi.fn();
		const subscription = await add_generation_listener('edition-progress', listener);

		await notify_generation_progress({
			edition_id: 'edition-progress',
			message: 'Found 3 promising stories from The Daily Planet.'
		});
		await subscription.unsubscribe();

		expect(listener).toHaveBeenCalledOnce();
		expect(listener).toHaveBeenCalledWith({
			type: 'progress',
			edition_id: 'edition-progress',
			message: 'Found 3 promising stories from The Daily Planet.'
		});
	});

	it('stores recent progress updates for replay after refreshes', async () => {
		expect.assertions(1);

		await notify_generation_progress({
			edition_id: 'edition-replay',
			message: 'Queued source analysis.'
		});
		await notify_generation_finished({ edition_id: 'edition-replay', status: 'published' });

		expect(await get_recent_generation_progress('edition-replay')).toEqual([
			{
				type: 'progress',
				edition_id: 'edition-replay',
				message: 'Queued source analysis.'
			}
		]);
	});
});
