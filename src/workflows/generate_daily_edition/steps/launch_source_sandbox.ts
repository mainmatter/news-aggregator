import {
	generation_failure_codes,
	report_generation_exception
} from '$lib/server/observability/sentry';
import { get_sandbox_backend } from '../sandbox/backend';
import { get_runner_files } from '../sandbox/runner_files';
import {
	assert_webhook_secret_configured,
	create_source_sandbox_config,
	opencode_version
} from '../sandbox/shared';
import type {
	EditionGenerationInput,
	SourceGenerationSettings,
	SourceSandboxRuntime,
	WorkflowUserSource
} from '../types';

function ensure_command_succeeded(command_description: string, exit_code: number) {
	if (exit_code !== 0) {
		throw new Error(`${command_description} failed with exit code ${exit_code}`);
	}
}

export async function launch_source_sandbox({
	source,
	input,
	settings,
	webhook_url,
	webhook_token,
	sentry_trace,
	baggage,
	correlation_id
}: {
	source: WorkflowUserSource;
	input: EditionGenerationInput;
	settings: SourceGenerationSettings;
	webhook_url: string;
	webhook_token: string;
	sentry_trace?: string;
	baggage?: string;
	correlation_id: string;
}): Promise<SourceSandboxRuntime> {
	'use step';

	assert_webhook_secret_configured();

	const backend = get_sandbox_backend();
	const sandbox_config = create_source_sandbox_config({
		source,
		input,
		settings,
		webhook_url,
		webhook_token,
		sentry_trace,
		baggage,
		correlation_id
	});

	const sandbox = await backend.create(sandbox_config);

	try {
		await sandbox.writeFiles(get_runner_files());

		const install_sdk = await sandbox.runCommand({
			cmd: 'npm',
			args: ['i', '--no-package-lock', '--silent', `@opencode-ai/sdk@${opencode_version}`]
		});
		ensure_command_succeeded('Installing @opencode-ai/sdk in sandbox', install_sdk.exit_code);

		const install_sentry = await sandbox.runCommand({
			cmd: 'npm',
			args: ['i', '--no-package-lock', '--silent', '@sentry/node']
		});
		ensure_command_succeeded('Installing @sentry/node in sandbox', install_sentry.exit_code);

		const install_cli = await sandbox.runCommand({
			cmd: 'npm',
			args: ['i', '-g', `opencode-ai@${opencode_version}`]
		});
		ensure_command_succeeded('Installing opencode-ai CLI in sandbox', install_cli.exit_code);

		const command = await sandbox.runCommand({
			cmd: 'node',
			args: ['runner.js'],
			env: sandbox_config.env,
			detached: true,
			stderr: process.stderr,
			stdout: process.stdout
		});

		return { sandbox_id: sandbox.id, command_id: command.id };
	} catch (error) {
		report_generation_exception({
			error,
			tags: {
				error_code: generation_failure_codes.sandbox_launch_failed,
				stage: 'launch_source_sandbox',
				edition_id: input.preparation.edition_id,
				edition_date: input.preparation.edition_date,
				source_id: source.source_id,
				correlation_id
			}
		});

		try {
			await backend.stop(sandbox.id);
		} catch (cleanup_error) {
			report_generation_exception({
				error: cleanup_error,
				tags: {
					error_code: generation_failure_codes.sandbox_launch_cleanup_failed,
					stage: 'launch_source_sandbox_cleanup',
					edition_id: input.preparation.edition_id,
					edition_date: input.preparation.edition_date,
					source_id: source.source_id,
					correlation_id
				}
			});

			console.error(
				`[sandbox:${sandbox.id}] Failed to clean up sandbox after launch error:`,
				cleanup_error
			);
		}

		throw error;
	}
}
