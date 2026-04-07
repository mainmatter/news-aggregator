<script lang="ts">
	import { get_editions } from '$lib/editions.remote';
	import EditorialDesign from '$lib/EditorialDesign.svelte';
	import EditionsList from '$lib/components/EditionsList.svelte';

	function get_default_edition_date() {
		return new Date().toISOString().slice(0, 10);
	}

	let { params } = $props();

	const editions = $derived(await get_editions());
	const selected_date = $derived(params.date || get_default_edition_date());
</script>

<svelte:head>
	<title>Your News — Editorial</title>
</svelte:head>

<div class="page-wrapper">
	<EditionsList {editions} />
</div>
<EditorialDesign date={selected_date} />

<style>
	.page-wrapper {
		position: relative;
		z-index: 1;
		max-width: var(--page-max-width);
		margin: 0 auto;
		padding: var(--s-5) clamp(var(--s-4), 4vw, var(--s-6)) 0;
	}
</style>
