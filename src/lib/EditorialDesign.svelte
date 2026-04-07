<script lang="ts">
	import {
		get_edition_editor,
		get_editions,
		start_daily_edition_generation,
		type EditionArticleRow,
		type EditionEditor,
		type EditionSummary
	} from '$lib/editions.remote';
	import type { Article as ArticleType } from '$lib/schemas';
	import Article from '$lib/components/Article.svelte';
	import FeaturedArticle from '$lib/components/FeaturedArticle.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import PageFooter from '$lib/components/PageFooter.svelte';
	import SectionRule from '$lib/components/SectionRule.svelte';
	import NavLink from '$lib/components/NavLink.svelte';
	import { sign_out } from '$lib/auth.remote';

	function format_published_at(value: Date | string | null | undefined) {
		if (!value) {
			return 'Date unavailable';
		}

		const published_at = value instanceof Date ? value : new Date(value);

		if (Number.isNaN(published_at.getTime())) {
			return 'Date unavailable';
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

	let { date }: { date: string } = $props();

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

	const date_options: Intl.DateTimeFormatOptions = {
		weekday: 'long',
		year: 'numeric',
		month: 'long',
		day: 'numeric'
	};

	let display_date = $derived.by(() => {
		if (date) {
			// Parse YYYY-MM-DD without timezone shift
			const [y, m, d] = date.split('-').map(Number);
			return new Date(y, m - 1, d).toLocaleDateString('en-US', date_options);
		}
		return new Date().toLocaleDateString('en-US', date_options);
	});

	const is_today_or_future = $derived.by(() => {
		const today = new Date().toISOString().slice(0, 10);
		return date >= today;
	});

	const show_generation_cta = $derived(
		is_today_or_future &&
			(edition_state === 'missing' || edition_state === 'failed' || edition_state === 'empty')
	);
</script>

<div class="page-container">
	{#snippet generation_form_snippet()}
		<form
			class="generation-form"
			{...start_daily_edition_generation.enhance(async ({ data, submit }) => {
				const edition_date = data.edition_date;
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
			<button type="submit" class="generation-button">
				{get_generation_button_label(edition_state)}
			</button>
		</form>
	{/snippet}

	<PageHeader
		edition_label="Daily Edition"
		date={display_date}
		title="Your News"
		article_count={articles.length}
	>
		{#snippet nav()}
			<NavLink href="/sources">Manage Sources</NavLink>
			<form {...sign_out} class="sign-out-form">
				<button class="sign-out-btn" type="submit">Sign Out</button>
			</form>
		{/snippet}
	</PageHeader>

	<SectionRule />

	<main class="content">
		{#if edition_state === 'missing'}
			<section class="edition-state-panel">
				<p class="state-eyebrow">Edition unavailable</p>
				<h2>No edition has been created for this date yet.</h2>
				<p>Choose another date or start a generation run to prepare this edition.</p>
				{#if show_generation_cta}
					{@render generation_form_snippet()}
				{/if}
			</section>
		{:else if edition_state === 'generating'}
			<section class="edition-state-panel">
				<p class="state-eyebrow">Edition in progress</p>
				<h2>Today&apos;s edition is being assembled.</h2>
				<p>We&apos;re reviewing your saved sources and drafting the article lineup now.</p>
			</section>
		{:else if edition_state === 'failed'}
			<section class="edition-state-panel">
				<p class="state-eyebrow">Generation incomplete</p>
				<h2>This edition could not be generated.</h2>
				<p>
					Start a new generation run to try again, or return later after adjusting your sources.
				</p>
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

			<SectionRule />

			<div class="grid">
				{#each articles.slice(1) as article, i (article.id)}
					<Article {article} index={i + 1} />
				{/each}
			</div>
		{/if}
	</main>

	<PageFooter
		tagline="Carefully curated. Elegantly delivered."
		subtitle="No algorithms, no noise — just the stories that matter."
	/>
</div>

<style>
	.page-container {
		position: relative;
		z-index: 1;
		max-width: var(--page-max-width);
		margin: 0 auto;
		padding: clamp(var(--s-6), 5vw, var(--s-8)) clamp(var(--s-4), 4vw, var(--s-6))
			clamp(var(--s-8), 6vw, var(--s-10));
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 22rem), 1fr));
		gap: 0;
	}

	.edition-state-panel {
		display: grid;
		gap: var(--s-2);
		padding: var(--s-5) 0;
		max-width: 42rem;
	}

	.state-eyebrow {
		font-size: var(--text-xs);
		font-weight: 500;
		letter-spacing: var(--tracking-5);
		text-transform: uppercase;
		color: var(--muted);
	}

	.edition-state-panel h2 {
		font-family: var(--font-display);
		font-size: var(--text-2xl);
		font-weight: 400;
		line-height: 1.15;
	}

	.edition-state-panel p:last-child {
		font-size: var(--text-md);
		color: var(--muted);
	}

	.sign-out-form {
		display: inline;
	}

	.sign-out-btn {
		font-family: var(--font-body);
		font-size: var(--text-xs);
		font-weight: 500;
		letter-spacing: var(--tracking-5);
		text-transform: uppercase;
		color: var(--muted);
		background: none;
		border: none;
		cursor: pointer;
		padding: 0;
		transition: color 0.3s ease;
	}

	.sign-out-btn:hover {
		color: var(--accent);
		text-decoration: underline;
		text-underline-offset: 0.2em;
	}

	.generation-form {
		margin-top: var(--s-4);
	}

	.generation-button {
		padding: var(--s-3) var(--s-5);
		border: var(--s-px) solid var(--accent);
		background: var(--accent);
		color: var(--bg);
		font-family: var(--font-body);
		font-size: var(--text-xs);
		font-weight: 600;
		letter-spacing: var(--tracking-5);
		text-transform: uppercase;
		cursor: pointer;
		transition:
			background 0.2s ease,
			color 0.2s ease,
			border-color 0.2s ease;
	}

	.generation-button:hover {
		background: transparent;
		color: var(--accent);
	}
</style>
