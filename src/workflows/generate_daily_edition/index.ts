import { createWebhook } from 'workflow';
import {
	consume_source_webhook,
	get_user_sources,
	launch_source_sandbox,
	mark_generation_failed,
	persist_edition,
	prepare_generation,
	stop_sandbox
} from './steps';
import type { EditionGenerationInput, SourceGenerationResult, WorkflowUserSource } from './types';

function get_error_message(error: unknown) {
	if (error instanceof Error) {
		return error.message;
	}

	return 'Unknown generation failure';
}

async function run_source_generation(
	source: WorkflowUserSource,
	input: EditionGenerationInput
): Promise<SourceGenerationResult> {
	'use workflow';

	try {
		using webhook = createWebhook();

		const { sandbox_id, command_id } = await launch_source_sandbox({
			source,
			input,
			webhook_url: webhook.url,
			webhook_token: webhook.token
		});

		try {
			const request = await webhook;
			return await consume_source_webhook({ request, webhook_token: webhook.token, source });
		} finally {
			await stop_sandbox({ sandbox_id, command_id });
		}
	} catch (error) {
		return {
			source_id: source.source_id,
			source_name: source.display_name,
			source_url: source.canonical_url,
			status: 'error',
			articles: [],
			error: get_error_message(error),
			generated_at: new Date().toISOString()
		};
	}
}

export async function generate_daily_edition_workflow(input: EditionGenerationInput) {
	'use workflow';

	const preparation = await prepare_generation(input);

	try {
		const sources = await get_user_sources(input.user_id);
		const source_results = await Promise.all(
			sources.map((source) => run_source_generation(source, input))
		);

		return await persist_edition({
			preparation,
			source_results
		});
	} catch (error) {
		await mark_generation_failed({
			preparation,
			error_message: get_error_message(error)
		});

		throw error;
	}
}
