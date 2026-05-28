<script lang="ts">
	import '@fontsource-variable/source-sans-3';
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { setupViewTransition } from 'sveltekit-view-transition';

	setupViewTransition();

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}
