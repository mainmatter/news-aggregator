<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		edition_label,
		date,
		title,
		article_count,
		nav
	}: {
		edition_label: string;
		date: string;
		title: string;
		article_count: number;
		nav: Snippet;
	} = $props();
</script>

<header class="page-header">
	<div class="header-top">
		<span class="edition-label">{edition_label}</span>
		<span class="header-rule"></span>
		<time class="header-date">{date}</time>
	</div>
	<div class="masthead">
		<h1>{title}</h1>
	</div>
	<div class="header-nav">
		<span class="story-count">{article_count} Stories</span>
		{@render nav()}
	</div>
</header>

<style>
	.page-header {
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

	.header-date {
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

	.masthead h1 {
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

	.story-count {
		font-size: 0.75rem;
		font-weight: 400;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--muted);
	}

	@keyframes fade-down {
		from {
			opacity: 0;
			transform: translateY(-20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
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
