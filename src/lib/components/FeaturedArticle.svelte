<script lang="ts">
	import type { Article } from '$lib/schemas';
	import ArticleMeta from '$lib/components/ArticleMeta.svelte';

	let { article, index }: { article: Article; index: number } = $props();
</script>

<article class="featured" style:--i={index}>
	<ArticleMeta category={article.category} items={[article.source, article.published_at]} />
	<h2 class="featured-headline">{article.title}</h2>
	<div class="featured-body">
		<p class="featured-summary">{article.summary}</p>
	</div>
	<a href={article.url} class="read-link" target="_blank" rel="noopener noreferrer">
		Read Full Article
	</a>
</article>

<style>
	.featured {
		padding: var(--s-6) 0 var(--s-6);
		animation: fade-up 0.8s ease-out both;
		animation-delay: calc(var(--i, 0) * 120ms + 200ms);
	}

	.featured-headline {
		--_indent: clamp(var(--s-4), 3vw, var(--s-5));
		font-family: var(--font-display);
		font-size: clamp(2rem, 5vw, 3.25rem);
		font-weight: 400;
		font-variation-settings: 'opsz' 48;
		line-height: 1.15;
		letter-spacing: -0.02em;
		color: var(--fg);
		max-width: 800px;
		margin-bottom: var(--s-5);
		border-left: 3px solid var(--accent);
		padding-left: var(--_indent);
	}

	.featured-body {
		--_indent: clamp(var(--s-4), 3vw, var(--s-5));
		max-width: 600px;
		margin-left: var(--_indent);
		padding-left: var(--_indent);
		border-left: var(--s-px) solid var(--rule);
	}

	.featured-summary {
		font-size: var(--text-md);
		line-height: 1.75;
		color: var(--muted);
	}

	/* Drop cap on featured summary */
	.featured-summary::first-letter {
		font-family: var(--font-display);
		font-size: 3.6em;
		font-weight: 400;
		font-variation-settings: 'opsz' 72;
		float: left;
		line-height: 0.75;
		margin-right: 0.08em;
		margin-top: 0.08em;
		color: var(--fg);
	}

	.read-link {
		display: inline-block;
		margin-top: var(--s-5);
		margin-left: clamp(var(--s-4), 6vw, var(--s-6));
		font-size: var(--text-sm);
		font-weight: 500;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--accent);
		text-decoration: none;
		position: relative;
		padding-bottom: var(--s-1);
	}

	.read-link::after {
		content: '';
		position: absolute;
		left: 0;
		bottom: 0;
		width: 0;
		height: var(--s-px);
		background: var(--accent);
		transition: width 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
	}

	.read-link:hover::after {
		width: 100%;
	}
</style>
