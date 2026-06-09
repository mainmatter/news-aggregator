import { describe, expect, it } from 'vitest';
import { create_tar_archive } from './docker_backend';

describe('create_tar_archive', () => {
	it('returns the archive before a consumer starts reading it', async () => {
		expect.assertions(1);

		const archive = await Promise.race([
			create_tar_archive([
				{
					path: 'large.txt',
					content: 'x'.repeat(1024 * 1024)
				}
			]),
			new Promise<never>((_, reject) => {
				setTimeout(() => reject(new Error('Timed out waiting for tar archive')), 100);
			})
		]);

		archive.resume();
		expect(archive.readable).toBe(true);
	});
});
