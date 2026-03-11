<script lang="ts">
	import type { RemoteFormField } from '@sveltejs/kit';

	interface Props {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		field: RemoteFormField<any>;
	}

	let { field }: Props = $props();

	let issues = $derived(field.issues() ?? []);
</script>

{#if issues.length > 0}
	{#each issues as issue, i (i)}
		<p class="field-error">{issue.message}</p>
	{/each}
{/if}

<style>
	.field-error {
		color: var(--accent);
		font-size: var(--text-sm);
		margin: var(--s-1) 0 0;
	}
</style>
