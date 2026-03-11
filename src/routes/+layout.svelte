<script lang="ts">
	import '@fontsource-variable/fraunces';
	import '@fontsource-variable/outfit';
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import ModeToggle from '$lib/components/ModeToggle.svelte';

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
		height: 3px;
		background: var(--accent);
		z-index: 100;
	}

	.mode-toggle-wrapper {
		position: fixed;
		top: 1.25rem;
		right: 1.5rem;
		z-index: 1000;
	}
</style>
