import { describe, expect, it, vi } from 'vitest';

const { mock_env } = vi.hoisted(() => ({
	mock_env: {
		SANDBOX_BACKEND: ''
	}
}));

vi.mock('$env/dynamic/private', () => ({
	env: mock_env
}));

import { get_sandbox_backend } from './backend';

describe('get_sandbox_backend', () => {
	it('defaults to vercel when SANDBOX_BACKEND is unset', () => {
		mock_env.SANDBOX_BACKEND = '';

		expect(get_sandbox_backend().name).toBe('vercel');
	});

	it('returns docker when SANDBOX_BACKEND=docker', () => {
		mock_env.SANDBOX_BACKEND = 'docker';

		expect(get_sandbox_backend().name).toBe('docker');
	});

	it('returns vercel when SANDBOX_BACKEND=vercel', () => {
		mock_env.SANDBOX_BACKEND = 'vercel';

		expect(get_sandbox_backend().name).toBe('vercel');
	});

	it('throws on invalid SANDBOX_BACKEND values', () => {
		mock_env.SANDBOX_BACKEND = 'podman';

		expect(() => get_sandbox_backend()).toThrow(
			'Invalid SANDBOX_BACKEND value: podman. Expected "vercel" or "docker".'
		);
	});
});
