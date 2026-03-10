<script lang="ts">
	import '@fontsource-variable/fraunces';
	import '@fontsource-variable/outfit';
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}
