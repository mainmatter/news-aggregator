/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { createHmac } from 'node:crypto';

function require_env(name) {
	const value = process.env[name];
	if (!value) {
		throw new Error(`Missing required sandbox environment variable: ${name}`);
	}

	return value;
}

const callback_url = require_env('CALLBACK_URL');
const callback_secret = require_env('CALLBACK_SECRET');
const source_id = require_env('SOURCE_ID');
const source_name = require_env('SOURCE_NAME');
const source_url = require_env('SOURCE_URL');
const edition_date = require_env('EDITION_DATE');
const window_start_iso = require_env('WINDOW_START_ISO');
const window_end_iso = require_env('WINDOW_END_ISO');
const opencode_model = process.env.OPENCODE_MODEL || '';
const opencode_agent = process.env.OPENCODE_AGENT || '';
const opencode_provider_api_key = process.env.OPENCODE_PROVIDER_API_KEY || '';
const opencode_provider_base_url = process.env.OPENCODE_PROVIDER_BASE_URL || '';

const article_limit = 6;

function clean_text(value) {
	return value?.replace(/\s+/g, ' ').trim() || '';
}

function build_opencode_config() {
	const config = {
		server: {
			hostname: '0.0.0.0',
			port: 4096
		},
		permission: {
			bash: 'deny',
			edit: 'deny',
			webfetch: 'allow'
		},
		tools: {
			bash: false,
			edit: false,
			list: false,
			grep: false,
			glob: false,
			question: false,
			todowrite: false,
			task: false,
			websearch: false
		}
	};

	if (opencode_model) {
		config.model = opencode_model;

		if (opencode_provider_api_key) {
			const [provider_id] = opencode_model.split('/');
			config.provider = {
				[provider_id]: {
					options: {
						apiKey: opencode_provider_api_key,
						...(opencode_provider_base_url ? { baseURL: opencode_provider_base_url } : {})
					}
				}
			};
		}
	}

	return config;
}

async function prompt_structured(client, session_id, prompt, schema) {
	const response = await client.session.prompt({
		sessionID: session_id,
		...(opencode_agent ? { agent: opencode_agent } : {}),
		format: {
			type: 'json_schema',
			schema,
			retryCount: 2
		},
		parts: [{ type: 'text', text: prompt }]
	});

	if (response.info.error) {
		throw new Error(
			`Structured output error: ${response.info.error.data?.message || response.info.error.name}`
		);
	}

	return response.info.structured;
}

async function choose_links(client, session_id) {
	const prompt = [
		'You are selecting article links for a daily news edition.',
		`Edition date: ${edition_date}`,
		`Freshness window: ${window_start_iso} to ${window_end_iso}`,
		`Source: ${source_name} (${source_url})`,
		'',
		`Use the webfetch tool to fetch the page at ${source_url}.`,
		'Only return links that you can verify were discovered on the actual source after fetching it or on a clearly source-owned page linked from it.',
		'The returned article URLs may point to external domains, but each one must be directly linked from the relevant fetched source page.',
		'If the source is blocked or incomplete, you may try source-faithful workarounds such as redirects, alternate same-source URLs, RSS feeds, AMP/mobile pages, or a newsletter edition page, but never replace the source with external search results or unrelated reporting.',
		'If the provided source is a newsletter archive, issue index, or archive homepage, first identify the edition that matches the edition date or freshness window, fetch that edition page, and then extract the article links from that edition page.',
		'If the provided source is not a newsletter archive, do not force this workflow and just extract links directly from the fetched source content.',
		'From the relevant fetched source page, identify links that point to individual news/article pages.',
		'Exclude navigation links, category pages, login pages, video pages, archive index pages, and newsletter signup pages.',
		`Choose at most ${article_limit} URLs and prefer the most relevant recent journalism. If you cannot verify any article URLs as directly linked from the actual source workflow, return an empty list.`
	].join('\n');

	const schema = {
		type: 'object',
		properties: {
			urls: {
				type: 'array',
				items: { type: 'string' }
			}
		},
		required: ['urls']
	};

	const result = await prompt_structured(client, session_id, prompt, schema);
	return (result.urls || []).slice(0, article_limit);
}

async function summarize_article(client, session_id, article_url) {
	const prompt = [
		'Summarize this article for a daily news edition.',
		`Edition date: ${edition_date}`,
		`Freshness window: ${window_start_iso} to ${window_end_iso}`,
		`Source: ${source_name} (${source_url})`,
		`Article URL: ${article_url}`,
		'',
		`Use the webfetch tool to fetch the page at ${article_url}.`,
		'Read and analyze the article content.',
		'Use ISO 8601 for published_at when you can infer it. Keep summary under 80 words.'
	].join('\n');

	const schema = {
		type: 'object',
		properties: {
			title: { type: 'string' },
			summary: { type: 'string' },
			category: { type: 'string' },
			published_at: { type: ['string', 'null'] },
			section: { type: ['string', 'null'] },
			reason: { type: ['string', 'null'] }
		},
		required: ['title', 'summary', 'category', 'published_at', 'section', 'reason']
	};

	const parsed = await prompt_structured(client, session_id, prompt, schema);

	return {
		url: article_url,
		canonical_url: article_url,
		title: clean_text(parsed.title),
		summary: clean_text(parsed.summary),
		category: clean_text(parsed.category),
		published_at: parsed.published_at ?? null,
		section: parsed.section ?? null,
		reason: parsed.reason ?? null
	};
}

async function post_callback(payload) {
	const raw_body = JSON.stringify(payload);
	const timestamp = Date.now().toString();
	const signature = createHmac('sha256', callback_secret)
		.update(`${timestamp}.${raw_body}`)
		.digest('hex');
	console.log('fetching callback URL with payload:', payload, {
		raw_body,
		signature,
		callback_url
	});
	const response = await fetch(callback_url, {
		method: 'POST',
		headers: {
			'content-type': 'application/json',
			'x-news-callback-timestamp': timestamp,
			'x-news-callback-signature': signature
		},
		body: raw_body
	});

	if (!response.ok) {
		throw new Error(`Callback failed with status ${response.status}`);
	}
}

async function main() {
	let opencode_server = null;
	let client = null;

	try {
		const sdk = await import('@opencode-ai/sdk/v2');
		const { createOpencodeClient, createOpencodeServer } = sdk;

		opencode_server = await createOpencodeServer({
			hostname: '0.0.0.0',
			port: 4096,
			timeout: 15_000,
			config: build_opencode_config()
		});

		client = createOpencodeClient({
			baseUrl: opencode_server.url,
			directory: process.cwd(),
			responseStyle: 'data'
		});

		const link_session = await client.session.create({
			title: `Choose links for ${source_name}`
		});
		console.log('Link session ID:', link_session.id, 'choosing links...');
		const chosen_links = await choose_links(client, link_session.id);
		console.log({ chosen_links });
		const summaries = [];

		const promises = chosen_links.map(async (article_url) => {
			try {
				console.log(`--- Processing article: ${article_url} ---`);
				const article_session = await client.session.create({
					title: `Summarize: ${article_url}`
				});
				const summary = await summarize_article(client, article_session.id, article_url);
				console.log('summary:', summary);
				if (summary) {
					summaries.push(summary);
				}
			} catch {
				/** empty */
			}
		});

		await Promise.allSettled(promises);

		await post_callback({
			source_id,
			source_name,
			source_url,
			status: 'success',
			articles: summaries,
			generated_at: new Date().toISOString()
		});
	} catch (error) {
		await post_callback({
			source_id,
			source_name,
			source_url,
			status: 'error',
			articles: [],
			error: error instanceof Error ? error.message : 'Unknown sandbox failure',
			generated_at: new Date().toISOString()
		});
	} finally {
		opencode_server?.close();
		await client?.instance.dispose();
		process.exit(0);
	}
}

await main();
