import { createWebhook, sleep } from 'workflow';
import {
	generation_failure_codes,
	report_generation_exception
} from '$lib/server/observability/sentry';
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

	const correlation_id = `${input.preparation.edition_id}:${source.source_id}`;

	try {
		using webhook = createWebhook();

		const { sandbox_id, command_id } = await launch_source_sandbox({
			source,
			input,
			settings,
			webhook_url: webhook.url,
			webhook_token: webhook.token,
			sentry_trace: input.sentry_trace,
			baggage: input.baggage,
			correlation_id
		});

		try {
			const outcome = await Promise.race([
				webhook.then((request) => ({ type: 'webhook' as const, request })),
				sleep(source_webhook_timeout).then(() => ({ type: 'timeout' as const }))
			]);

			if (outcome.type === 'timeout') {
				const timeout_error = new Error(
					`Timed out waiting 15 minutes for ${source.display_name} webhook`
				);

				report_generation_exception({
					error: timeout_error,
					tags: {
						error_code: generation_failure_codes.source_webhook_timeout,
						stage: 'source_webhook_timeout',
						edition_id: input.preparation.edition_id,
						edition_date: input.preparation.edition_date,
						source_id: source.source_id,
						correlation_id
					}
				});

				return {
					source_id: source.source_id,
					source_name: source.display_name,
					source_url: source.canonical_url,
					correlation_id,
					status: 'error',
					articles: [],
					error: timeout_error.message,
					generated_at: new Date().toISOString()
				};
			}

			const { request } = outcome;
			return await consume_source_webhook({
				request,
				webhook_token: webhook.token,
				source,
				edition_id: input.preparation.edition_id,
				edition_date: input.preparation.edition_date,
				correlation_id
			});
		} finally {
			await stop_sandbox({
				sandbox_id,
				command_id,
				edition_id: input.preparation.edition_id,
				edition_date: input.preparation.edition_date,
				source_id: source.source_id,
				correlation_id
			});
		}
	} catch (error) {
		report_generation_exception({
			error,
			tags: {
				error_code: generation_failure_codes.source_generation_failed,
				stage: 'run_source_generation',
				edition_id: input.preparation.edition_id,
				edition_date: input.preparation.edition_date,
				source_id: source.source_id,
				correlation_id
			}
		});

		return {
			source_id: source.source_id,
			source_name: source.display_name,
			source_url: source.canonical_url,
			correlation_id,
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
		const sources = await get_user_sources(input.user_id);

		if (sources.length === 0) {
			return await persist_edition({
				preparation: input.preparation,
				source_results: []
			});
		}

		const settings = await get_user_generation_settings(input.user_id);

		const source_results = await Promise.all(
			sources.map((source) => run_source_generation(source, input, settings))
		);

		return await persist_edition({
			preparation: input.preparation,
			source_results
		});
	} catch (error) {
		report_generation_exception({
			error,
			tags: {
				error_code: generation_failure_codes.workflow_generation_failed,
				stage: 'generate_daily_edition_workflow',
				edition_id: input.preparation.edition_id,
				edition_date: input.preparation.edition_date
			}
		});

		await mark_generation_failed({
			preparation: input.preparation,
			error_message: get_error_message(error)
		});

		throw error;
	}
}
