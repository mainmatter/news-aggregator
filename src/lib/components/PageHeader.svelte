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
		animation: fade-down 0.7s ease-out;
	}

	.header-nav {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--s-3) 0;
		border-top: var(--s-px) solid var(--rule);
		border-bottom: var(--s-px) solid var(--rule);
	}

	.story-count {
		font-size: var(--text-sm);
		font-weight: 400;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--muted);
	}
</style>
