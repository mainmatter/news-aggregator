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
	webhook_token
}: {
	source: WorkflowUserSource;
	input: EditionGenerationInput;
	settings: SourceGenerationSettings;
	webhook_url: string;
	webhook_token: string;
}): Promise<SourceSandboxRuntime> {
	'use step';

	assert_webhook_secret_configured();

	const backend = get_sandbox_backend();
	const sandbox_config = create_source_sandbox_config({
		source,
		input,
		settings,
		webhook_url,
		webhook_token
	});

	const sandbox = await backend.create(sandbox_config);

	try {
		await sandbox.writeFiles(get_runner_files());

		const install_sdk = await sandbox.runCommand({
			cmd: 'npm',
			args: ['i', '--no-package-lock', '--silent', `@opencode-ai/sdk@${opencode_version}`]
		});
		ensure_command_succeeded('Installing @opencode-ai/sdk in sandbox', install_sdk.exit_code);

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
		try {
			await backend.stop(sandbox.id);
		} catch (cleanup_error) {
			console.error(
				`[sandbox:${sandbox.id}] Failed to clean up sandbox after launch error:`,
				cleanup_error
			);
		}

		throw error;
	}
}
