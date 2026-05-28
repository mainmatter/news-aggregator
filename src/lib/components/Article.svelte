<script lang="ts">
	import type { Article } from '$lib/schemas';
	import ArticleMeta from '$lib/components/ArticleMeta.svelte';

	let {
		article,
		index
	}: {
		article: Article;
		index: number;
	} = $props();

	const max_length = 150;
	const max_offset = 20;

	const should_trim = $derived(article.summary.length - max_offset >= max_length);
	const displayed_summary = $derived(
		should_trim ? article.summary.slice(0, max_length + max_offset) : article.summary
	);
</script>

<article class="grid-article" style:--i={index}>
	<span class="article-number">{String(index + 1).padStart(2, '0')}</span>
	<div class="article-content">
		<ArticleMeta category={article.category} items={[article.published_at]} />
		<h3 class="grid-headline">
			<a href={article.url} target="_blank" rel="noopener noreferrer">
				{article.title}
			</a>
		</h3>
		<p class="grid-summary" class:fade-out={should_trim}>{displayed_summary}</p>
		<div class="grid-footer">
			<span class="source">{article.source}</span>
			<a href={article.url} class="read-link-small" target="_blank" rel="noopener noreferrer">
				Read
				<span aria-hidden="true">→</span>
			</a>
		</div>
	</div>
</article>

<style>
	.grid-article {
		display: grid;
		grid-template-columns: clamp(var(--s-6), 8vw, var(--s-10)) minmax(0, 1fr);
		column-gap: clamp(var(--s-4), 4vw, var(--s-8));
		padding: var(--s-5) var(--s-3) var(--s-5) 0;
		border-bottom: var(--s-px) solid var(--rule);
		animation: fade-up 0.5s var(--ease-out-expo) both;
		animation-delay: calc(var(--i, 0) * 100ms + 200ms);
		transition:
			background 0.2s var(--ease-out-expo),
			border-color 0.2s var(--ease-out-expo);
		position: relative;
	}

	.grid-article:hover {
		background: var(--card-hover);
		border-color: var(--rule-strong);
	}

	.article-content {
		display: grid;
		align-content: start;
		gap: var(--s-3);
		min-width: 0;
	}

	.article-number {
		display: flex;
		align-items: flex-start;
		justify-content: flex-end;
		font-family: var(--font-display);
		font-size: var(--text-2xl);
		font-weight: 850;
		line-height: 1;
		color: var(--rule-strong);
		padding-top: var(--s-1);
		transition: color 0.2s var(--ease-out-expo);
	}

	.grid-article:hover .article-number {
		color: var(--accent);
	}

	.grid-headline {
		font-family: var(--font-display);
		font-size: var(--text-2xl);
		font-weight: 800;
		line-height: 1.05;
		letter-spacing: -0.03em;
		max-width: 28ch;
		text-wrap: balance;
	}

	.grid-headline a {
		color: var(--fg);
		text-decoration: none;
		transition: color 0.2s var(--ease-out-expo);
	}

	.grid-headline a:hover {
		color: var(--accent);
	}

	.grid-summary {
		font-size: var(--text-base);
		line-height: 1.55;
		color: var(--muted);
		max-width: var(--measure);
	}

	.fade-out {
		--fade-out: linear-gradient(to bottom, black 50%, transparent 100%);
		-webkit-mask-image: var(--fade-out);
		mask-image: var(--fade-out);
	}

	.grid-footer {
		display: flex;
		gap: var(--s-3);
		justify-content: space-between;
		align-items: center;
		margin-top: var(--s-1);
		padding-top: var(--s-3);
		border-top: var(--s-px) solid var(--rule);
		font-size: var(--text-xs);
		text-transform: uppercase;
		letter-spacing: var(--tracking-4);
	}

	.grid-footer .source {
		font-weight: 500;
		color: var(--muted);
	}

	.read-link-small {
		color: var(--accent);
		text-decoration: none;
		font-weight: 800;
		position: relative;
		padding-bottom: var(--s-2px);
		white-space: nowrap;
	}

	.read-link-small span {
		display: inline-block;
		transition: transform 0.2s var(--ease-out-expo);
	}

	.read-link-small:hover span {
		transform: translateX(var(--s-1));
	}

	@media (max-width: 760px) {
		.grid-article {
			grid-template-columns: 1fr;
			gap: var(--s-3);
		}

		.article-number {
			justify-content: flex-start;
			font-size: var(--text-xl);
			padding-top: 0;
		}
	}
</style>
