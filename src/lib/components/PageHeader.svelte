<script lang="ts">
	import type { Snippet } from 'svelte';
	import Masthead from './Masthead.svelte';

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
	<Masthead top_left={edition_label} top_right={date} {title} />
	<div class="header-nav">
		<span class="story-count">{article_count} Stories</span>
		{@render nav()}
	</div>
</header>

<style>
	.page-header {
		animation: fade-down 0.55s var(--ease-out-expo);
	}

	.header-nav {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: var(--s-4);
		padding: var(--s-4) 0;
		border-top: var(--s-2px) solid var(--fg);
		border-bottom: var(--s-px) solid var(--rule-strong);
	}

	.story-count {
		font-size: var(--text-sm);
		font-weight: 750;
		letter-spacing: var(--tracking-5);
		text-transform: uppercase;
		color: var(--fg);
	}

	@media (max-width: 640px) {
		.header-nav {
			align-items: flex-start;
			flex-direction: column;
			gap: var(--s-2);
		}
	}
</style>
