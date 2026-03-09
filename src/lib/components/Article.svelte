<script lang="ts">
	let {
		article,
		index,
		featured = false
	}: {
		article: {
			title: string;
			source: string;
			published_at: string;
			summary: string;
			url: string;
			category: string;
		};
		index: number;
		featured?: boolean;
	} = $props();
</script>

{#if featured}
	<article class="featured" style:--i={index}>
		<div class="featured-meta">
			<span class="category">{article.category}</span>
			<span class="meta-dot">&middot;</span>
			<span class="source">{article.source}</span>
			<span class="meta-dot">&middot;</span>
			<time class="time">{article.published_at}</time>
		</div>
		<h2 class="featured-headline">{article.title}</h2>
		<div class="featured-body">
			<p class="featured-summary">{article.summary}</p>
		</div>
		<a href={article.url} class="read-link" target="_blank" rel="noopener noreferrer">
			Read Full Article
		</a>
	</article>
{:else}
	<article class="grid-article" style:--i={index}>
		<span class="article-number">{String(index + 1).padStart(2, '0')}</span>
		<div class="grid-meta">
			<span class="category">{article.category}</span>
			<span class="meta-dot">&middot;</span>
			<time class="time">{article.published_at}</time>
		</div>
		<h3 class="grid-headline">
			<a href={article.url} target="_blank" rel="noopener noreferrer">
				{article.title}
			</a>
		</h3>
		<p class="grid-summary">{article.summary}</p>
		<div class="grid-footer">
			<span class="source">{article.source}</span>
			<a href={article.url} class="read-link-small" target="_blank" rel="noopener noreferrer">
				Read &rarr;
			</a>
		</div>
	</article>
{/if}

<style>
	/* ===== Featured Article ===== */
	.featured {
		padding: 2rem 0 2.5rem;
		animation: fade-up 0.8s ease-out both;
		animation-delay: calc(var(--i, 0) * 120ms + 200ms);
	}

	.featured-meta {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 1.25rem;
		font-size: 0.72rem;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--muted);
	}

	.featured-meta .category {
		color: var(--accent);
		font-weight: 600;
	}

	.meta-dot {
		color: var(--rule);
	}

	.featured-headline {
		font-family: var(--font-display);
		font-size: clamp(2rem, 5vw, 3.25rem);
		font-weight: 400;
		font-variation-settings: 'opsz' 48;
		line-height: 1.15;
		letter-spacing: -0.02em;
		color: var(--fg);
		max-width: 800px;
		margin-bottom: 1.5rem;
		border-left: 3px solid var(--accent);
		padding-left: 1.25rem;
	}

	.featured-body {
		max-width: 600px;
		margin-left: 1.25rem;
		padding-left: 1.25rem;
		border-left: 1px solid var(--rule);
	}

	.featured-summary {
		font-size: 1.05rem;
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
		margin-top: 1.5rem;
		margin-left: 2.5rem;
		font-size: 0.78rem;
		font-weight: 500;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--accent);
		text-decoration: none;
		position: relative;
		padding-bottom: 4px;
	}

	.read-link::after {
		content: '';
		position: absolute;
		left: 0;
		bottom: 0;
		width: 0;
		height: 1px;
		background: var(--accent);
		transition: width 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
	}

	.read-link:hover::after {
		width: 100%;
	}

	/* ===== Grid Articles ===== */
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

	.grid-meta {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		margin-bottom: 0.6rem;
		font-size: 0.68rem;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--muted);
	}

	.category {
		font-weight: 600;
		color: var(--accent);
	}

	.source {
		color: var(--muted);
	}

	.time {
		color: var(--muted);
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
		display: -webkit-box;
		-webkit-line-clamp: 3;
		-webkit-box-orient: vertical;
		overflow: hidden;
		margin-bottom: 1rem;
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

	/* Animations */
	@keyframes fade-up {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	/* Responsive (only styles relevant to the article component) */
	@media (max-width: 768px) {
		.grid-article:nth-child(even) {
			padding-left: 0;
			border-left: none;
		}

		.grid-article {
			padding-right: 0;
		}

		.featured-body {
			margin-left: 0;
			padding-left: 1rem;
		}

		.read-link {
			margin-left: 1rem;
		}
	}

	@media (max-width: 480px) {
		.featured-headline {
			padding-left: 1rem;
		}
	}
</style>
