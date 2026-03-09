<script lang="ts">
	import '@fontsource-variable/playfair-display';
	import '@fontsource-variable/source-sans-3';
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}
