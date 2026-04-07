import { createWebhook, sleep } from 'workflow';
import {
	consume_source_webhook,
	get_user_generation_settings,
	get_user_sources,
	launch_source_sandbox,
	mark_generation_failed,
	persist_edition,
	stop_sandbox
} from './steps';
import type { EditionGenerationInput, SourceGenerationResult, WorkflowUserSource } from './types';

function get_error_message(error: unknown) {
	if (error instanceof Error) {
		return error.message;
	}

	return 'Unknown generation failure';
}

const source_webhook_timeout = '15m';

async function run_source_generation(
	source: WorkflowUserSource,
	input: EditionGenerationInput,
	settings: Awaited<ReturnType<typeof get_user_generation_settings>>
): Promise<SourceGenerationResult> {
	'use workflow';

	try {
		using webhook = createWebhook();

		const { sandbox_id, command_id } = await launch_source_sandbox({
			source,
			input,
			settings,
			webhook_url: webhook.url,
			webhook_token: webhook.token
		});

		try {
			const outcome = await Promise.race([
				webhook.then((request) => ({ type: 'webhook' as const, request })),
				sleep(source_webhook_timeout).then(() => ({ type: 'timeout' as const }))
			]);

			if (outcome.type === 'timeout') {
				return {
					source_id: source.source_id,
					source_name: source.display_name,
					source_url: source.canonical_url,
					status: 'error',
					articles: [],
					error: `Timed out waiting 15 minutes for ${source.display_name} webhook`,
					generated_at: new Date().toISOString()
				};
			}

			const { request } = outcome;
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

	try {
		const [sources, settings] = await Promise.all([
			get_user_sources(input.user_id),
			get_user_generation_settings(input.user_id)
		]);
		const source_results = await Promise.all(
			sources.map((source) => run_source_generation(source, input, settings))
		);

		return await persist_edition({
			preparation: input.preparation,
			source_results
		});
	} catch (error) {
		await mark_generation_failed({
			preparation: input.preparation,
			error_message: get_error_message(error)
		});

		throw error;
	}
}
