import { env } from '$env/dynamic/private';
import { docker_sandbox_backend } from './docker_backend';
import type { sandbox_backend } from './types';
import { vercel_sandbox_backend } from './vercel_backend';

export function get_sandbox_backend(): sandbox_backend {
	const selected_backend = env.SANDBOX_BACKEND?.trim() || 'vercel';

	if (selected_backend === 'vercel') {
		return vercel_sandbox_backend;
	}

	if (selected_backend === 'docker') {
		return docker_sandbox_backend;
	}

	throw new Error(
		`Invalid SANDBOX_BACKEND value: ${env.SANDBOX_BACKEND}. Expected "vercel" or "docker".`
	);
}
