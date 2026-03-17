<script lang="ts">
	import '@fontsource-variable/fraunces';
	import '@fontsource-variable/outfit';
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

<div class="red-rule"></div>

<div class="mode-toggle-wrapper">
	<ModeToggle />
</div>

{@render children()}

<style>
	.red-rule {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		height: var(--s-1);
		background: var(--accent);
		z-index: 100;
	}

	.mode-toggle-wrapper {
		position: fixed;
		top: var(--s-4);
		right: var(--s-5);
		z-index: 1000;
	}
</style>
