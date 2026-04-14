import { env } from '$env/dynamic/private';
import { createHmac } from 'node:crypto';
import type {
	EditionGenerationInput,
	SourceGenerationSettings,
	WorkflowUserSource
} from '../types';
import type { sandbox_create_config } from './types';

export const sandbox_timeout_ms = 15 * 60 * 1000;
export const sandbox_runtime = 'node24';
export const docker_sandbox_workspace = '/workspace';
export const default_docker_sandbox_image = 'node:24-bookworm-slim';
export const opencode_version = '1.3.17';

export function assert_webhook_secret_configured() {
	if (!env.WEBHOOK_SECRET) {
		throw new Error('WEBHOOK_SECRET is not configured');
	}
}

export function resolve_webhook_url(webhook_url: string, tunnel_base_url?: string) {
	if (!tunnel_base_url) return webhook_url;

	const parsed = new URL(webhook_url);
	const tunnel = new URL(tunnel_base_url);
	parsed.protocol = tunnel.protocol;
	parsed.host = tunnel.host;
	parsed.port = '';
	return parsed.toString();
}

export function derive_callback_secret(webhook_token: string) {
	assert_webhook_secret_configured();
	return createHmac('sha256', env.WEBHOOK_SECRET).update(webhook_token).digest('hex');
}

export function get_window_bounds(edition_date: string) {
	const window_end = new Date(`${edition_date}T23:59:59.999Z`);
	const window_start = new Date(window_end.getTime() - 48 * 60 * 60 * 1000);

	return {
		window_start_iso: window_start.toISOString(),
		window_end_iso: window_end.toISOString()
	};
}

export function create_source_sandbox_env({
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
}) {
	const callback_secret = derive_callback_secret(webhook_token);
	const { window_start_iso, window_end_iso } = get_window_bounds(input.edition_date);
	const resolved_url = resolve_webhook_url(webhook_url, input.tunnel_base_url);

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
	if (env.OPENCODE_PROVIDER_API_KEY) {
		sandbox_env.OPENCODE_PROVIDER_API_KEY = env.OPENCODE_PROVIDER_API_KEY;
	}
	if (env.OPENCODE_PROVIDER_BASE_URL) {
		sandbox_env.OPENCODE_PROVIDER_BASE_URL = env.OPENCODE_PROVIDER_BASE_URL;
	}

	return sandbox_env;
}

export function create_source_sandbox_config(args: {
	source: WorkflowUserSource;
	input: EditionGenerationInput;
	settings: SourceGenerationSettings;
	webhook_url: string;
	webhook_token: string;
}): sandbox_create_config {
	return {
		runtime: sandbox_runtime,
		timeout_ms: sandbox_timeout_ms,
		env: create_source_sandbox_env(args)
	};
}
