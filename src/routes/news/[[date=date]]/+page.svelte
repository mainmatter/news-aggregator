<script lang="ts">
	import { get_user } from '$lib/auth.remote';
	import { get_daily_editions } from '$lib/editions.remote';
	import EditorialDesign from '$lib/EditorialDesign.svelte';
	import EditionsList from '$lib/components/EditionsList.svelte';
	import { page } from '$app/state';

	await get_user();

	const editions = await get_daily_editions();
</script>

<svelte:head>
	<title>Your News — Editorial</title>
</svelte:head>

<div class="page-wrapper">
	<EditionsList {editions} />
</div>
<EditorialDesign date={page.params.date} />

<style>
	.page-wrapper {
		position: relative;
		z-index: 1;
		max-width: var(--page-max-width);
		margin: 0 auto;
		padding: var(--s-5) clamp(var(--s-4), 4vw, var(--s-6)) 0;
	}
</style>
