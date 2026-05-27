<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();
</script>

<div class="form-actions">
	{@render children()}
</div>

<style>
	.form-actions {
		margin-top: var(--s-4);
	}

	.form-actions :global(button) {
		display: block;
		margin-left: auto;
	}
</style>
