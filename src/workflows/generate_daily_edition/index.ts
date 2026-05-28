import { createWebhook, sleep } from 'workflow';
import {
	generation_failure_codes,
	report_generation_exception
} from '$lib/server/observability/sentry';
import {
	consume_source_webhook,
	get_user_generation_settings,
	launch_source_sandbox,
	mark_generation_failed,
	persist_edition,
	step_finalize_edition_participation_failed,
	step_finalize_source_participation,
	step_mark_participation_running,
	stop_sandbox
} from './steps';
import type { EditionGenerationInput, SourceGenerationResult, WorkflowUserSource } from './types';

function get_error_message(error: unknown): string {
	if (error instanceof Error) {
		return error.message;
	}

	if (typeof error === 'string') {
		return error;
	}

	if (error && typeof error === 'object') {
		if ('message' in error && typeof error.message === 'string') {
			return error.message;
		}

		if ('cause' in error) {
			const cause_message: string = get_error_message(error.cause);
			if (cause_message !== 'Unknown generation failure') {
				return cause_message;
			}
		}

		try {
			return JSON.stringify(error).slice(0, 500);
		} catch {
			// Fall through to the default below.
		}
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

	let result: SourceGenerationResult;

	try {
		using webhook = createWebhook();

		await step_mark_participation_running({
			daily_edition_id: input.preparation.edition_id,
			user_source_id: source.user_source_id
		});

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

				result = {
					source_id: source.source_id,
					source_name: source.display_name,
					source_url: source.canonical_url,
					correlation_id,
					status: 'error',
					articles: [],
					error: timeout_error.message,
					reason: timeout_error.message,
					generated_at: new Date().toISOString()
				};
			} else {
				const { request } = outcome;
				result = await consume_source_webhook({
					request,
					webhook_token: webhook.token,
					source,
					edition_id: input.preparation.edition_id,
					edition_date: input.preparation.edition_date,
					correlation_id
				});
			}
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
		const error_message = get_error_message(error);
		result = {
			source_id: source.source_id,
			source_name: source.display_name,
			source_url: source.canonical_url,
			correlation_id,
			status: 'error',
			articles: [],
			error: error_message,
			reason: error_message,
			generated_at: new Date().toISOString()
		};
	}

	await step_finalize_source_participation({
		daily_edition_id: input.preparation.edition_id,
		user_source_id: source.user_source_id,
		result
	});

	return result;
}

export async function generate_daily_edition_workflow(input: EditionGenerationInput) {
	'use workflow';

	const snapshot = input.preparation.source_snapshot;
	const active_sources: WorkflowUserSource[] = snapshot
		.filter((entry) => entry.is_active)
		.map((entry) => ({
			user_source_id: entry.user_source_id,
			source_id: entry.source_id,
			display_name: entry.display_name,
			canonical_url: entry.canonical_url,
			label: entry.label
		}));
	try {
		if (active_sources.length === 0) {
			const persist_result = await persist_edition({
				preparation: input.preparation,
				source_results: []
			});

			return persist_result;
		}

		const settings = await get_user_generation_settings(input.user_id);

		const source_results = await Promise.all(
			active_sources.map((source) => run_source_generation(source, input, settings))
		);

		const persist_result = await persist_edition({
			preparation: input.preparation,
			source_results
		});

		return persist_result;
	} catch (error) {
		const error_message = get_error_message(error);

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
			error_message
		});

		await step_finalize_edition_participation_failed({
			daily_edition_id: input.preparation.edition_id,
			error_message
		});

		throw error;
	}
}
