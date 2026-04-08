import { env } from '$env/dynamic/private';
import { Sandbox } from '@vercel/sandbox';
import { createHmac } from 'node:crypto';
import type { EditionGenerationInput, WorkflowUserSource } from '../types';
import runner_source from '../sandbox/runner.js?raw';

const sandbox_timeout_ms = 15 * 60 * 1000;

function resolve_webhook_url(webhook_url: string, tunnel_base_url?: string) {
	if (!tunnel_base_url) return webhook_url;

	const parsed = new URL(webhook_url);
	const tunnel = new URL(tunnel_base_url);
	parsed.protocol = tunnel.protocol;
	parsed.host = tunnel.host;
	parsed.port = '';
	return parsed.toString();
}

function derive_callback_secret(webhook_token: string) {
	return createHmac('sha256', env.WEBHOOK_SECRET).update(webhook_token).digest('hex');
}

function get_window_bounds(edition_date: string) {
	const window_end = new Date(`${edition_date}T23:59:59.999Z`);
	const window_start = new Date(window_end.getTime() - 48 * 60 * 60 * 1000);

	return {
		window_start_iso: window_start.toISOString(),
		window_end_iso: window_end.toISOString()
	};
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
	settings: { article_selection_prompt: string | null };
	webhook_url: string;
	webhook_token: string;
}) {
	'use step';

	if (!env.WEBHOOK_SECRET) {
		throw new Error('WEBHOOK_SECRET is not configured');
	}

	const callback_secret = derive_callback_secret(webhook_token);
	const { window_start_iso, window_end_iso } = get_window_bounds(input.edition_date);
	const resolved_url = resolve_webhook_url(webhook_url, input.tunnel_base_url);

	console.log('resolved webhook url', resolved_url);

	const sandbox_env: Record<string, string> = {
		CALLBACK_URL: resolved_url,
		CALLBACK_SECRET: callback_secret,
		SOURCE_ID: source.source_id,
		SOURCE_NAME: source.display_name,
		SOURCE_URL: source.canonical_url,
		EDITION_DATE: input.edition_date,
		WINDOW_START_ISO: window_start_iso,
		WINDOW_END_ISO: window_end_iso
	};

	if (settings.article_selection_prompt) {
		sandbox_env.ARTICLE_SELECTION_PROMPT = settings.article_selection_prompt;
	}

	if (source.label) {
		sandbox_env.SOURCE_LABEL = source.label;
	}

	if (env.OPENCODE_MODEL) sandbox_env.OPENCODE_MODEL = env.OPENCODE_MODEL;
	if (env.OPENCODE_AGENT) sandbox_env.OPENCODE_AGENT = env.OPENCODE_AGENT;
	if (env.OPENCODE_PROVIDER_API_KEY)
		sandbox_env.OPENCODE_PROVIDER_API_KEY = env.OPENCODE_PROVIDER_API_KEY;
	if (env.OPENCODE_PROVIDER_BASE_URL)
		sandbox_env.OPENCODE_PROVIDER_BASE_URL = env.OPENCODE_PROVIDER_BASE_URL;

	const sandbox_config: Record<string, unknown> = {
		runtime: 'node24',
		timeout: sandbox_timeout_ms,
		env: sandbox_env
	};

	if (env.VERCEL_TOKEN && env.VERCEL_PROJECT_ID && env.VERCEL_TEAM_ID) {
		sandbox_config.token = env.VERCEL_TOKEN;
		sandbox_config.projectId = env.VERCEL_PROJECT_ID;
		sandbox_config.teamId = env.VERCEL_TEAM_ID;
	}

	const sandbox = await Sandbox.create(sandbox_config);

	await sandbox.writeFiles([
		{
			path: 'package.json',
			content: Buffer.from(
				JSON.stringify(
					{
						name: 'source-extractor',
						version: '1.0.0',
						type: 'module'
					},
					null,
					2
				)
			)
		},
		{
			path: 'runner.js',
			content: Buffer.from(runner_source)
		}
	]);

	await sandbox.runCommand('npm', [
		'i',
		'--no-package-lock',
		'--silent',
		'@opencode-ai/sdk@1.3.17'
	]);

	await sandbox.runCommand('npm', ['i', '-g', 'opencode-ai@1.3.17']);

	const command = await sandbox.runCommand({
		cmd: 'node',
		args: ['runner.js'],
		detached: true,
		stderr: process.stderr,
		stdout: process.stdout
	});

	return { sandbox_id: sandbox.sandboxId, command_id: command.cmdId };
}
