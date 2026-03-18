import { db } from '$lib/server/db';
import { source, user_source } from '$lib/server/db/schema';
import { and, eq } from 'drizzle-orm';

/**
 * Normalize a URL for deduplication.
 * - Trims whitespace
 * - Lowercases the scheme and host
 * - Removes default ports (80 for http, 443 for https)
 * - Removes trailing slash from the path (unless path is just "/")
 * - Drops the fragment
 */
export function normalize_url(raw: string): string {
	const trimmed = raw.trim();
	const url = new URL(trimmed);

	// Lowercase scheme + host is handled by URL constructor
	// Remove default ports
	if (
		(url.protocol === 'http:' && url.port === '80') ||
		(url.protocol === 'https:' && url.port === '443')
	) {
		url.port = '';
	}

	// Remove trailing slash unless path is exactly "/"
	if (url.pathname.length > 1 && url.pathname.endsWith('/')) {
		url.pathname = url.pathname.slice(0, -1);
	}

	// Drop fragment
	url.hash = '';

	return url.toString();
}

/**
 * Find a source by its canonical URL, or create it if it doesn't exist.
 * Returns the source row.
 */
export async function find_or_create_source(
	canonical_url: string,
	source_kind: string | null = null
) {
	const [existing] = await db
		.select()
		.from(source)
		.where(eq(source.canonical_url, canonical_url))
		.limit(1);

	if (existing) {
		return existing;
	}

	const [created] = await db
		.insert(source)
		.values({
			canonical_url,
			source_kind
		})
		.returning();

	return created;
}

/**
 * Verify that a user_source row belongs to the given user.
 * Returns the row if found, or null.
 */
export async function get_owned_user_source(user_source_id: string, user_id: string) {
	const [row] = await db
		.select()
		.from(user_source)
		.where(and(eq(user_source.id, user_source_id), eq(user_source.user_id, user_id)))
		.limit(1);

	return row ?? null;
}
