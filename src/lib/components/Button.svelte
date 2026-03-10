<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	type Props = {
		onclick: () => void;
		children: Snippet;
		variant?: 'default' | 'ghost';
	} & Omit<HTMLButtonAttributes, 'onclick'>;

	let { onclick, children, variant = 'default', ...rest }: Props = $props();
</script>

<button {onclick} class={['btn', `btn-${variant}`]} {...rest}>{@render children()}</button>

<style>
	button {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		font-family: var(--font-body);
		font-size: 0.72rem;
		font-weight: 500;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		padding: 0.4rem 0.9rem;
		background: var(--paper);
		color: var(--muted);
		border: 1px solid var(--rule);
		border-radius: 0;
		cursor: pointer;
		transition: all 0.3s ease;
	}

	button:hover {
		color: var(--fg);
		border-color: var(--fg);
	}

	.btn-ghost {
		background: none;
		border: none;
		padding: 0;
	}
</style>
