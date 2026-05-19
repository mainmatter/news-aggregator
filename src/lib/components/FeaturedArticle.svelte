<script lang="ts">
	import type { Article } from '$lib/schemas';
	import ArticleMeta from '$lib/components/ArticleMeta.svelte';

	let { article, index }: { article: Article; index: number } = $props();
</script>

<article class="featured" style:--i={index}>
	<p class="lead-kicker">Lead story</p>
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
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(18rem, 0.72fr);
		column-gap: clamp(var(--s-5), 6vw, var(--s-10));
		row-gap: var(--s-4);
		padding: clamp(var(--s-6), 7vw, var(--s-12)) 0;
		border-bottom: var(--s-2px) solid var(--fg);
		animation: fade-up 0.65s var(--ease-out-expo) both;
		animation-delay: calc(var(--i, 0) * 120ms + 200ms);
	}

	.lead-kicker {
		grid-column: 1;
		width: fit-content;
		padding: var(--s-2) var(--s-3);
		background: var(--support-soft);
		color: var(--accent);
		font-size: var(--text-xs);
		font-weight: 800;
		letter-spacing: var(--tracking-6);
		line-height: 1;
		text-transform: uppercase;
	}

	.featured :global(.article-meta) {
		grid-column: 2;
		align-self: center;
		justify-self: start;
		max-width: 42ch;
		font-size: var(--text-xs);
		letter-spacing: var(--tracking-4);
	}

	.featured-headline {
		grid-column: 1;
		font-family: var(--font-display);
		font-size: var(--text-fluid-5xl);
		font-weight: 850;
		line-height: 0.98;
		letter-spacing: -0.045em;
		color: var(--fg);
		max-width: 15ch;
		text-wrap: balance;
	}

	.featured-body {
		grid-column: 2;
		align-self: end;
		max-width: var(--measure);
		padding-top: var(--s-4);
		border-top: var(--s-2px) solid var(--rule-strong);
	}

	.featured-summary {
		font-size: var(--text-lg);
		line-height: 1.55;
		color: var(--muted);
	}

	.read-link {
		grid-column: 2;
		display: inline-flex;
		align-items: center;
		gap: var(--s-2);
		width: fit-content;
		font-size: var(--text-sm);
		font-weight: 800;
		letter-spacing: var(--tracking-5);
		text-transform: uppercase;
		color: var(--accent);
		text-decoration: none;
		transition:
			transform 0.2s var(--ease-out-expo),
			color 0.2s var(--ease-out-expo);
	}

	.read-link::before {
		content: '→';
		color: var(--support);
	}

	.read-link:hover {
		color: var(--fg);
		transform: translateX(var(--s-1));
	}

	@media (max-width: 760px) {
		.featured {
			grid-template-columns: 1fr;
		}

		.lead-kicker,
		.featured :global(.article-meta),
		.featured-headline,
		.featured-body,
		.read-link {
			grid-column: 1;
		}

		.read-link {
			margin-top: var(--s-2);
		}
	}
</style>
