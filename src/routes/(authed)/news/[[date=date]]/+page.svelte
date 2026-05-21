<script lang="ts">
	import EditorialDesign from '$lib/EditorialDesign.svelte';
	import { get_user_sources } from '$lib/sources.remote';

	function get_default_edition_date() {
		return new Date().toISOString().slice(0, 10);
	}

	let { params } = $props();

	const sources = $derived(await get_user_sources());
	const selected_date = $derived(params.date || get_default_edition_date());
	const has_available_sources = $derived(sources.some((source) => source.is_active === true));
</script>

<svelte:head>
	<title>Your News — Editorial</title>
</svelte:head>

<EditorialDesign date={selected_date} {has_available_sources} />
