import * as v from 'valibot';
import { form, query, getRequestEvent } from '$app/server';
import { redirect } from '@sveltejs/kit';
import { auth } from '$lib/server/auth';
import { APIError } from 'better-auth/api';

/**
 * Get the current user. Resolves the session on demand (not in hooks).
 *
 * @param is_login_page - If `true`, redirects to `/news` when user IS authenticated.
 *   If `false` (default), redirects to `/` when user is NOT authenticated.
 *   Default is `false` so that calling `get_user()` from other remote functions
 *   automatically guards against unauthenticated access.
 */
export const get_user = query(v.optional(v.boolean(), false), async (is_login_page) => {
	const event = getRequestEvent();
	const session = await auth.api.getSession({ headers: event.request.headers });

	if (is_login_page) {
		if (session?.user) {
			redirect(302, '/news');
		}
		return null;
	}

	if (!session?.user) {
		redirect(302, '/');
	}

	return session.user;
});

export const login_or_register = form(
	v.object({
		email: v.pipe(v.string(), v.nonEmpty('Email is required')),
		_password: v.pipe(v.string(), v.nonEmpty('Password is required')),
		name: v.optional(v.string()),
		action: v.picklist(['login', 'register'])
	}),
	async ({ email, _password, name, action }) => {
		try {
			if (action === 'login') {
				await auth.api.signInEmail({
					body: { email, password: _password }
				});
			} else {
				await auth.api.signUpEmail({
					body: { email, password: _password, name: name || email }
				});
			}
		} catch (error) {
			if (error instanceof APIError) {
				return { error: error.message || `${action} failed` };
			}
			return { error: 'An unexpected error occurred' };
		}

		redirect(302, '/news');
	}
);

export const sign_in_google = form(async () => {
	const result = await auth.api.signInSocial({
		body: {
			provider: 'google',
			callbackURL: '/news'
		}
	});

	if (result.url) {
		redirect(302, result.url);
	}

	return { error: 'Google sign-in failed' };
});

export const sign_out = form(async () => {
	const event = getRequestEvent();

	await auth.api.signOut({
		headers: event.request.headers
	});

	redirect(302, '/');
});
