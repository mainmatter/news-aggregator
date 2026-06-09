<script lang="ts">
	import Article from '$lib/components/Article.svelte';
	import Button from '$lib/components/Button.svelte';
	import FeaturedArticle from '$lib/components/FeaturedArticle.svelte';
	import PageFooter from '$lib/components/PageFooter.svelte';
	import {
		get_edition_editor,
		get_editions,
		get_generation_progress_messages,
		start_daily_edition_generation,
		type EditionArticleRow,
		type EditionEditor,
		type EditionSummary
	} from '$lib/editions.remote';
	import { format_edition_date } from '$lib/date_format';
	import type { Article as ArticleType } from '$lib/schemas';
	import EditionsList from '$lib/components/EditionsList.svelte';
	import Masthead from '$lib/components/Masthead.svelte';
	import { get_user_sources } from '$lib/sources.remote';

	function get_default_edition_date() {
		return new Date().toISOString().slice(0, 10);
	}

	let { params } = $props();

	const sources = $derived(await get_user_sources());
	const date = $derived(params.date || get_default_edition_date());
	const has_available_sources = $derived(sources.some((source) => source.is_active === true));

	function format_published_at(value: Date | string | null | undefined) {
		if (!value) {
			return '';
		}

		const published_at = value instanceof Date ? value : new Date(value);

		if (Number.isNaN(published_at.getTime())) {
			return '';
		}

		return published_at.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}

	function get_source_name(url: string | null | undefined) {
		if (!url) {
			return 'Unknown source';
		}

		try {
			return new URL(url).hostname.replace(/^www\./, '');
		} catch {
			return 'Unknown source';
		}
	}

	function map_edition_article(article: EditionArticleRow): ArticleType {
		const url = article.canonical_url || '#';

		return {
			id: article.id,
			article_id: article.article_id,
			canonical_url: url,
			url,
			title: article.custom_title || article.title || 'Untitled article',
			source: get_source_name(article.canonical_url),
			published_at: format_published_at(article.published_at),
			summary:
				article.custom_summary || article.summary || article.reason || 'Summary unavailable.',
			category: article.custom_category || article.category || article.section || 'General',
			position: article.position,
			section: article.section,
			reason: article.reason,
			custom_title: article.custom_title,
			custom_summary: article.custom_summary,
			custom_category: article.custom_category
		};
	}

	function upsert_generating_edition(
		current: EditionSummary[],
		edition_date: string,
		current_edition: EditionEditor | null
	) {
		const optimistic_entry: EditionSummary = {
			id: current_edition?.id ?? crypto.randomUUID(),
			edition_date,
			status: 'generating',
			title: current_edition?.title ?? null,
			summary: current_edition?.summary ?? null,
			article_count: 0,
			generated_at: current_edition?.generated_at ?? null,
			created_at: new Date(),
			updated_at: new Date()
		};

		const next = current.some((item) => item.edition_date === edition_date)
			? current.map((item) =>
					item.edition_date === edition_date ? { ...item, ...optimistic_entry } : item
				)
			: [...current, optimistic_entry];

		return next.toSorted((a, b) => b.edition_date.localeCompare(a.edition_date));
	}

	function get_generation_button_label(edition_state: string) {
		if (edition_state === 'failed') {
			return 'Retry generation';
		}

		return 'Start generation';
	}

	const editions = $derived(await get_editions());
	const edition = $derived(await get_edition_editor(date));
	const articles = $derived(edition?.articles.map(map_edition_article) ?? []);
	const edition_state = $derived.by(() => {
		if (!edition) {
			return 'missing';
		}

		if (edition.status === 'generating') {
			return 'generating';
		}

		if (edition.status === 'failed') {
			return 'failed';
		}

		if (edition.status === 'published' && articles.length === 0) {
			return 'published-empty';
		}

		if (articles.length === 0) {
			return 'empty';
		}

		return 'ready';
	});

	let display_date = $derived(format_edition_date(date));

	const is_today_or_future = $derived.by(() => {
		const today = new Date().toISOString().slice(0, 10);
		return date >= today;
	});

	const show_generation_cta = $derived(
		has_available_sources &&
			is_today_or_future &&
			(edition_state === 'missing' || edition_state === 'failed' || edition_state === 'empty')
	);

	const generation_event_source_url = $derived(
		edition_state === 'generating' && edition?.id
			? `/news/generation-events/${encodeURIComponent(edition.id)}`
			: null
	);

	let generation_progress_messages = $derived(
		edition?.id ? await get_generation_progress_messages(edition.id) : []
	);

	function parse_generation_progress(event: MessageEvent) {
		try {
			const payload = JSON.parse(event.data) as unknown;

			if (
				typeof payload === 'object' &&
				payload !== null &&
				'type' in payload &&
				payload.type === 'progress' &&
				'message' in payload &&
				typeof payload.message === 'string'
			) {
				if (!edition?.id) {
					return;
				}

				generation_progress_messages = [
					...generation_progress_messages,
					{
						id: `live:${crypto.randomUUID()}`,
						message: payload.message
					}
				];
			}
		} catch {
			// Ignore malformed progress events.
		}
	}

	$effect(() => {
		if (!generation_event_source_url) {
			return;
		}

		const events = new EventSource(generation_event_source_url);
		const refresh_edition = () => {
			void Promise.all([get_editions().refresh(), get_edition_editor(date).refresh()]);
			events.close();
		};

		events.addEventListener('generation-finished', refresh_edition);
		events.addEventListener('generation-progress', parse_generation_progress);

		return () => {
			events.removeEventListener('generation-finished', refresh_edition);
			events.removeEventListener('generation-progress', parse_generation_progress);
			events.close();
		};
	});
</script>

<svelte:head>
	<title>Your News — Editorial</title>
</svelte:head>

{#snippet generation_form_snippet()}
	<form
		class="generation-form"
		{...start_daily_edition_generation.enhance(async ({ submit }) => {
			const edition_date = start_daily_edition_generation.fields.edition_date.value()!;
			const current_edition = edition;

			await submit().updates(
				get_editions().withOverride((current) =>
					upsert_generating_edition(current, edition_date, current_edition)
				),
				get_edition_editor(edition_date).withOverride((current) => ({
					id: current?.id ?? current_edition?.id ?? crypto.randomUUID(),
					edition_date,
					status: 'generating',
					title: current?.title ?? current_edition?.title ?? null,
					summary: current?.summary ?? current_edition?.summary ?? null,
					generated_at: current?.generated_at ?? current_edition?.generated_at ?? null,
					articles: []
				}))
			);
		})}
	>
		<input {...start_daily_edition_generation.fields.edition_date.as('hidden', date)} />
		<Button
			type="submit"
			class="generation-button"
			loading={!!start_daily_edition_generation.pending}
		>
			{get_generation_button_label(edition_state)}
		</Button>
	</form>
{/snippet}

<Masthead>
	{#snippet top_left()}Daily Edition{/snippet}
	{#snippet top_center()}{articles.length} Stories{/snippet}
	{#snippet top_right()}
		<span class="date-long">{display_date.long}</span>
		<span class="date-short">{display_date.short}</span>
	{/snippet}
	{#snippet title()}Your News{/snippet}

	<EditionsList {editions} />
</Masthead>

<main class="content">
	{#if edition_state === 'missing'}
		<section class="edition-state-panel">
			<p class="state-eyebrow">Edition unavailable</p>
			{#if has_available_sources}
				<h2>No edition has been created for this date yet.</h2>
				<p>Choose another date or start a generation run to prepare this edition.</p>
			{:else}
				<h2>No edition can be generated yet.</h2>
				<p>Generation needs at least one active source.</p>
			{/if}
			{#if show_generation_cta}
				{@render generation_form_snippet()}
			{:else if !has_available_sources}
				<div class="generation-form">
					<a href="/sources" class="generation-button">Manage sources</a>
				</div>
			{/if}
		</section>
	{:else if edition_state === 'generating'}
		<section class="edition-state-panel">
			<p class="state-eyebrow">Edition in progress</p>
			<h2>Today&apos;s edition is being assembled.</h2>
			<p class="state-description">
				We&apos;re reviewing your saved sources and drafting the article lineup now. If the page
				doesn't refresh automatically try to refresh manually in a few minutes.
			</p>
			{#if generation_progress_messages.length > 0}
				<ul class="generation-progress" aria-label="Generation progress">
					{#each generation_progress_messages as progress_message, i (progress_message.id)}
						<li style:--i="'{i.toString().padStart(2, '0')}'">
							{progress_message.message}
						</li>
					{/each}
				</ul>
			{/if}
		</section>
	{:else if edition_state === 'failed'}
		<section class="edition-state-panel">
			<p class="state-eyebrow">Generation incomplete</p>
			<h2>This edition could not be generated.</h2>
			<p>Start a new generation run to try again, or return later after adjusting your sources.</p>
			{#if show_generation_cta}
				{@render generation_form_snippet()}
			{/if}
		</section>
	{:else if edition_state === 'published-empty'}
		<section class="edition-state-panel">
			<p class="state-eyebrow">Published edition</p>
			<h2>No new articles made it into this edition.</h2>
			<p>The edition has been published, but there were no stories to include for this date.</p>
		</section>
	{:else if edition_state === 'empty'}
		<section class="edition-state-panel">
			<p class="state-eyebrow">Edition ready for curation</p>
			<h2>No articles have been added yet.</h2>
			<p>
				This edition exists, but it still needs stories before it can read like a finished front
				page.
			</p>
			{#if show_generation_cta}
				{@render generation_form_snippet()}
			{/if}
		</section>
	{:else}
		{#if articles[0]}
			<FeaturedArticle article={articles[0]} index={0} />
		{/if}

		<div class="grid">
			{#each articles.slice(1) as article, i (article.id)}
				<Article {article} index={i + 1} />
			{/each}
		</div>
	{/if}
</main>

<PageFooter />

<style>
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 22rem), 1fr));
		gap: 0;
	}

	.date-short {
		display: none;
	}

	@media (max-width: 640px) {
		.date-long {
			display: none;
		}

		.date-short {
			display: inline;
		}
	}

	.edition-state-panel {
		display: grid;
		gap: var(--s-4);
		max-width: var(--measure);
		padding: clamp(var(--s-6), 6vw, var(--s-10)) 0;
	}

	.state-eyebrow {
		font-size: var(--text-xs);
		font-weight: 800;
		letter-spacing: var(--tracking-5);
		text-transform: uppercase;
		color: var(--accent);
	}

	.edition-state-panel h2 {
		font-family: var(--font-display);
		font-size: var(--text-3xl);
		font-weight: 850;
		line-height: 1;
		letter-spacing: -0.04em;
		text-wrap: balance;
	}

	.edition-state-panel p:last-child {
		font-size: var(--text-md);
		color: var(--muted);
	}

	.state-description {
		font-size: var(--text-md);
		color: var(--muted);
	}

	.generation-progress {
		position: relative;
		display: flex;
		flex-direction: column;
		justify-content: end;
		gap: var(--s-2);
		height: calc(var(--s-12) + var(--s-6));
		overflow: hidden;
		padding: var(--s-5) 0;
		border-block: var(--s-px) solid var(--rule);
		color: var(--fg);
		font-size: var(--text-sm);
		line-height: 1.45;
		list-style: none;
		-webkit-mask-image: linear-gradient(
			to bottom,
			transparent,
			black var(--s-5),
			black calc(100% - var(--s-5)),
			transparent
		);
		mask-image: linear-gradient(
			to bottom,
			transparent,
			black var(--s-5),
			black calc(100% - var(--s-5)),
			transparent
		);
	}

	.generation-progress li {
		position: relative;
		display: grid;
		grid-template-columns: var(--s-6) 1fr;
		gap: var(--s-3);
		align-items: baseline;
		padding-block: var(--s-1);
		border-top: var(--s-px) solid color-mix(in oklch, var(--rule) 65%, transparent);
		color: var(--muted);
	}

	.generation-progress li::before {
		content: var(--i);
		color: var(--rule-strong);
		font-size: var(--text-xs);
		font-weight: 800;
		letter-spacing: var(--tracking-4);
	}

	.generation-progress li:nth-last-child(3) {
		opacity: 0.82;
	}

	.generation-progress li:nth-last-child(2) {
		opacity: 0.92;
	}

	.generation-progress li:last-child {
		color: var(--fg);
		opacity: 1;
	}

	.generation-progress li:last-child::after {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(
			100deg,
			transparent,
			color-mix(in oklch, var(--support) 22%, transparent),
			transparent
		);
		transform: translateX(-100%);
		animation: progress-shimmer 1.8s var(--ease-out-expo) infinite;
		pointer-events: none;
	}

	.generation-progress li:last-child::before {
		color: var(--accent);
	}

	@keyframes progress-shimmer {
		to {
			transform: translateX(100%);
		}
	}

	@supports not (
		(mask-image: linear-gradient(black, transparent)) or
			(-webkit-mask-image: linear-gradient(black, transparent))
	) {
		.generation-progress::before,
		.generation-progress::after {
			content: '';
			position: absolute;
			right: 0;
			left: 0;
			z-index: 1;
			height: var(--s-5);
			pointer-events: none;
		}

		.generation-progress::before {
			top: 0;
			background: linear-gradient(to bottom, var(--bg), transparent);
		}

		.generation-progress::after {
			bottom: 0;
			background: linear-gradient(to top, var(--bg), transparent);
		}
	}

	.generation-form {
		margin-top: var(--s-4);
	}

	.generation-button,
	:global(button.generation-button) {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: var(--s-3) var(--s-5);
		border: var(--s-px) solid var(--accent);
		background: var(--accent);
		color: var(--accent-contrast);
		font-family: var(--font-display);
		font-size: var(--text-xs);
		font-weight: 800;
		letter-spacing: var(--tracking-5);
		text-transform: uppercase;
		text-decoration: none;
		cursor: pointer;
		transition:
			background 0.2s var(--ease-out-expo),
			color 0.2s var(--ease-out-expo),
			border-color 0.2s var(--ease-out-expo);
	}

	.generation-button:hover,
	:global(button.generation-button:hover) {
		background: var(--fg);
		border-color: var(--fg);
		color: var(--bg);
	}
</style>
