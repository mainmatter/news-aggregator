import { db } from '$lib/server/db';
import { daily_edition } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { PreparedGenerationState } from '../types';

export async function mark_generation_failed({
	preparation,
	error_message
}: {
	preparation: PreparedGenerationState;
	error_message: string;
}) {
	'use step';

	if (preparation.had_existing_edition) {
		await db
			.update(daily_edition)
			.set({
				status: preparation.previous_status || 'draft',
				title: preparation.previous_title,
				summary: preparation.previous_summary,
				generated_at: preparation.previous_generated_at
			})
			.where(eq(daily_edition.id, preparation.edition_id));

		return;
	}

	await db
		.update(daily_edition)
		.set({
			status: 'failed',
			summary: `Generation failed: ${error_message}`
		})
		.where(eq(daily_edition.id, preparation.edition_id));
}
