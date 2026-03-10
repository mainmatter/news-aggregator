<script lang="ts">
	import '@fontsource-variable/fraunces';
	import '@fontsource-variable/outfit';
	import { articles, today } from '$lib/articles';
	import Article from '$lib/components/Article.svelte';
	import FeaturedArticle from '$lib/components/FeaturedArticle.svelte';

	let dark = $state(true);
</script>

<div class="editorial-page" class:dark>
	<div class="red-rule"></div>

	<button class="mode-toggle" onclick={() => (dark = !dark)}>
		{#if dark}
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="15"
				height="15"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="1.5"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<circle cx="12" cy="12" r="5" />
				<line x1="12" y1="1" x2="12" y2="3" />
				<line x1="12" y1="21" x2="12" y2="23" />
				<line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
				<line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
				<line x1="1" y1="12" x2="3" y2="12" />
				<line x1="21" y1="12" x2="23" y2="12" />
				<line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
				<line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
			</svg>
			<span>Light</span>
		{:else}
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="15"
				height="15"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="1.5"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
			</svg>
			<span>Dark</span>
		{/if}
	</button>

	<div class="page-container">
		<header class="header">
			<div class="header-top">
				<span class="edition-label">Daily Edition</span>
				<span class="header-rule"></span>
				<time class="date">{today}</time>
			</div>

			<div class="masthead">
				<h1 class="title">Your News</h1>
			</div>

			<nav class="header-nav">
				<span class="article-count">{articles.length} Stories</span>
				<a href="/sources" class="sources-link">Manage Sources</a>
			</nav>
		</header>

		<div class="section-rule"></div>

		<main class="content">
			{#each articles as article, i (article.id)}
				{#if i === 0}
					<FeaturedArticle {article} index={i} />
				{/if}
			{/each}

			<div class="section-rule"></div>

			<div class="grid">
				{#each articles as article, i (article.id)}
					{#if i > 0}
						<Article {article} index={i} />
					{/if}
				{/each}
			</div>
		</main>

		<footer class="footer">
			<div class="section-rule"></div>
			<p class="footer-tagline">Carefully curated. Elegantly delivered.</p>
			<p class="footer-sub">No algorithms, no noise &mdash; just the stories that matter.</p>
		</footer>
	</div>
</div>

<style>
	/* ===== Base & Custom Properties ===== */
	.editorial-page {
		--bg: #f8f5f0;
		--fg: #1a1a18;
		--accent: #c4453c;
		--muted: #6b6860;
		--paper: #ece7df;
		--rule: #d4cfc6;
		--card-hover: rgba(0, 0, 0, 0.02);
		--font-display: 'Fraunces Variable', 'Georgia', serif;
		--font-body: 'Outfit Variable', 'Helvetica Neue', sans-serif;

		font-family: var(--font-body);
		background: var(--bg);
		color: var(--fg);
		min-height: 100vh;
		position: relative;
		transition:
			background 0.5s ease,
			color 0.5s ease;
	}

	/* Subtle paper texture */
	.editorial-page::before {
		content: '';
		position: fixed;
		inset: 0;
		background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
		pointer-events: none;
		z-index: 0;
	}

	.editorial-page.dark {
		--bg: #1a1a18;
		--fg: #ece7df;
		--accent: #d4605a;
		--muted: #9a948a;
		--paper: #252420;
		--rule: #3a3830;
		--card-hover: rgba(255, 255, 255, 0.03);
	}

	/* ===== Red Rule at Top ===== */
	.red-rule {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		height: 3px;
		background: var(--accent);
		z-index: 100;
	}

	/* ===== Mode Toggle ===== */
	.mode-toggle {
		position: fixed;
		top: 1.25rem;
		right: 1.5rem;
		z-index: 1000;
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		font-family: var(--font-body);
		font-size: 0.72rem;
		font-weight: 500;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		padding: 0.4rem 0.9rem;
		background: var(--paper);
		color: var(--muted);
		border: 1px solid var(--rule);
		border-radius: 0;
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.mode-toggle:hover {
		color: var(--fg);
		border-color: var(--fg);
	}

	/* ===== Page Container ===== */
	.page-container {
		position: relative;
		z-index: 1;
		max-width: 1100px;
		margin: 0 auto;
		padding: 3rem 2.5rem 4rem;
	}

	/* ===== Header ===== */
	.header {
		animation: fade-down 0.7s ease-out;
	}

	.header-top {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-bottom: 1.5rem;
	}

	.edition-label {
		font-size: 0.72rem;
		font-weight: 500;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--muted);
		white-space: nowrap;
	}

	.header-rule {
		flex: 1;
		height: 1px;
		background: var(--rule);
	}

	.date {
		font-size: 0.72rem;
		font-weight: 400;
		letter-spacing: 0.06em;
		color: var(--muted);
		white-space: nowrap;
	}

	.masthead {
		text-align: center;
		padding: 2rem 0 1.75rem;
	}

	.title {
		font-family: var(--font-display);
		font-size: clamp(3.5rem, 10vw, 6.5rem);
		font-weight: 300;
		font-style: italic;
		font-variation-settings: 'opsz' 72;
		line-height: 1;
		letter-spacing: -0.03em;
		color: var(--fg);
	}

	.header-nav {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem 0;
		border-top: 1px solid var(--rule);
		border-bottom: 1px solid var(--rule);
	}

	.article-count {
		font-size: 0.75rem;
		font-weight: 400;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--muted);
	}

	.sources-link {
		font-size: 0.75rem;
		font-weight: 500;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--muted);
		text-decoration: none;
		padding-bottom: 2px;
		border-bottom: 1px solid transparent;
		transition: all 0.3s ease;
	}

	.sources-link:hover {
		color: var(--accent);
		border-bottom-color: var(--accent);
	}

	/* ===== Section Rule ===== */
	.section-rule {
		height: 1px;
		background: var(--rule);
		margin: 2rem 0;
	}

	/* ===== Grid Layout ===== */
	.grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0;
	}

	/* ===== Footer ===== */
	.footer {
		padding-bottom: 2rem;
		text-align: center;
		animation: fade-up 0.6s ease-out both;
		animation-delay: 1s;
	}

	.footer-tagline {
		font-family: var(--font-display);
		font-size: 1.2rem;
		font-weight: 400;
		font-style: italic;
		font-variation-settings: 'opsz' 32;
		color: var(--fg);
		margin-bottom: 0.4rem;
	}

	.footer-sub {
		font-size: 0.78rem;
		color: var(--muted);
		letter-spacing: 0.03em;
	}

	/* ===== Animations ===== */
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

	@keyframes fade-down {
		from {
			opacity: 0;
			transform: translateY(-12px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	/* ===== Responsive ===== */
	@media (max-width: 768px) {
		.page-container {
			padding: 2rem 1.25rem 3rem;
		}

		.grid {
			grid-template-columns: 1fr;
		}
	}

	@media (max-width: 480px) {
		.masthead {
			padding: 1.25rem 0 1.25rem;
		}

		.header-top {
			flex-wrap: wrap;
			gap: 0.5rem;
		}

		.header-rule {
			display: none;
		}
	}
</style>
