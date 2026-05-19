<script lang="ts">
	import '@fontsource-variable/source-sans-3';
	import '@fontsource-variable/dm-sans';
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import ModeToggle from '$lib/components/ModeToggle.svelte';
	import { setupViewTransition } from 'sveltekit-view-transition';

	setupViewTransition();

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="brand-strip"></div>

<div class="mode-toggle-wrapper">
	<ModeToggle />
</div>

{@render children()}

<style>
	.brand-strip {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		height: var(--s-2px);
		background: linear-gradient(
			90deg,
			var(--fg) 0 22%,
			var(--accent) 22% 74%,
			var(--support) 74% 100%
		);
		z-index: 100;
	}

	.mode-toggle-wrapper {
		position: fixed;
		top: var(--s-4);
		right: var(--s-5);
		z-index: 1000;
	}
</style>
