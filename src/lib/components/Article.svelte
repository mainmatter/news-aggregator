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
			Read &rarr;
		</a>
	</div>
</article>

<style>
	.grid-article {
		padding: 2rem 2rem 2rem 0;
		border-bottom: 1px solid var(--rule);
		animation: fade-up 0.6s ease-out both;
		animation-delay: calc(var(--i, 0) * 100ms + 200ms);
		transition: background 0.3s ease;
		position: relative;
	}

	/* Vertical rule between columns */
	.grid-article:nth-child(even) {
		padding-left: 2rem;
		padding-right: 0;
		border-left: 1px solid var(--rule);
	}

	.grid-article:hover {
		background: var(--card-hover);
	}

	.article-number {
		display: block;
		font-family: var(--font-display);
		font-size: 2.5rem;
		font-weight: 300;
		font-variation-settings: 'opsz' 72;
		line-height: 1;
		color: var(--rule);
		margin-bottom: 0.75rem;
		transition: color 0.3s ease;
	}

	.grid-article:hover .article-number {
		color: var(--accent);
	}

	.grid-headline {
		font-family: var(--font-display);
		font-size: clamp(1.1rem, 2vw, 1.35rem);
		font-weight: 500;
		font-variation-settings: 'opsz' 32;
		line-height: 1.3;
		margin-bottom: 0.6rem;
	}

	.grid-headline a {
		color: var(--fg);
		text-decoration: none;
		transition: color 0.3s ease;
	}

	.grid-headline a:hover {
		color: var(--accent);
	}

	.grid-summary {
		font-size: 0.88rem;
		line-height: 1.65;
		color: var(--muted);
		margin-bottom: 1rem;
	}

	.fade-out {
		--fade-out: linear-gradient(to bottom, black 50%, transparent 100%);
		-webkit-mask-image: var(--fade-out);
		mask-image: var(--fade-out);
	}

	.grid-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-top: 0.75rem;
		border-top: 1px solid var(--rule);
		font-size: 0.72rem;
		text-transform: uppercase;
		letter-spacing: 0.06em;
	}

	.grid-footer .source {
		font-weight: 500;
		color: var(--muted);
	}

	.read-link-small {
		color: var(--accent);
		text-decoration: none;
		font-weight: 500;
		position: relative;
		padding-bottom: 2px;
	}

	.read-link-small::after {
		content: '';
		position: absolute;
		left: 0;
		bottom: 0;
		width: 0;
		height: 1px;
		background: var(--accent);
		transition: width 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
	}

	.read-link-small:hover::after {
		width: 100%;
	}

	@media (max-width: 768px) {
		.grid-article:nth-child(even) {
			padding-left: 0;
			border-left: none;
		}

		.grid-article {
			padding-right: 0;
		}
	}
</style>
