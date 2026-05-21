<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		top_left,
		top_center,
		top_right,
		title,
		children
	}: {
		top_left: Snippet;
		top_center?: Snippet;
		top_right: Snippet;
		title: Snippet;
		children?: Snippet;
	} = $props();
</script>

<header>
	<div class="header-top">
		<span class="header-label">{@render top_left()}</span>
		<span class="header-rule"></span>
		{#if top_center}
			<span class="header-label header-label-center">{@render top_center()}</span>
		{/if}
		<span class="header-rule"></span>
		<span class="header-label">{@render top_right()}</span>
	</div>
	<div class="masthead">
		<h1>{@render title()}</h1>
	</div>
	{#if children}
		<div class="header-nav">
			{@render children()}
		</div>
	{/if}
</header>

<style>
	.header-top {
		position: relative;
		display: flex;
		align-items: center;
		gap: var(--s-3);
		margin-bottom: var(--s-4);
	}

	.header-label {
		position: relative;
		z-index: 1;
		background: var(--bg);
		font-size: var(--text-xs);
		font-weight: 700;
		letter-spacing: var(--tracking-5);
		text-transform: uppercase;
		color: var(--fg);
		white-space: nowrap;
	}

	.header-label-center {
		position: absolute;
		left: 50%;
		transform: translateX(-50%);
		padding-inline: var(--s-3);
	}

	.header-nav {
		border-block: var(--s-px) solid var(--rule);
		padding: var(--s-3) 0;
	}

	.header-rule {
		flex: 1;
		height: var(--s-px);
		background: var(--rule);
		min-width: var(--s-6);
	}

	.masthead {
		padding: clamp(var(--s-5), 5vw, var(--s-8)) 0 var(--s-3);
	}

	.masthead h1 {
		font-family: var(--font-display);
		font-size: var(--text-fluid-7xl);
		font-weight: 800;
		line-height: 0.88;
		letter-spacing: -0.06em;
		color: var(--fg);
		text-wrap: balance;
	}

	@media (max-width: 640px) {
		.masthead h1 {
			font-size: clamp(var(--text-5xl), 18vw, var(--text-7xl));
		}
	}
</style>
