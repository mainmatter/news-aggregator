<script lang="ts">
	import { get_user } from '$lib/auth.remote';
	import EditorialDesign from '$lib/EditorialDesign.svelte';

	await get_user();
</script>

<svelte:head>
	<title>Your News — Editorial</title>
</svelte:head>

<svelte:boundary>
	<EditorialDesign />

	{#snippet failed()}
		<div class="loading-state">
			<p>Loading…</p>
		</div>
	{/snippet}
</svelte:boundary>

<style>
	.loading-state {
		display: flex;
		justify-content: center;
		align-items: center;
		min-height: 60vh;
		color: var(--muted);
		font-family: var(--font-display);
		font-style: italic;
		font-size: 1.1rem;
	}
</style>
