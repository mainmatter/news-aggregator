<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	type Props = {
		children: Snippet;
		variant?: 'default' | 'ghost' | 'primary' | 'secondary';
	} & HTMLButtonAttributes;

	let { children, variant = 'default', ...rest }: Props = $props();
</script>

<button class={['btn', `btn-${variant}`]} {...rest}>{@render children()}</button>

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

	.btn-primary {
		flex: 1;
		background: var(--fg);
		color: var(--bg);
		border: 1px solid var(--fg);
		letter-spacing: 0.1em;
		padding: 0.85rem 1rem;
	}

	.btn-primary:hover {
		background: var(--accent);
		border-color: var(--accent);
	}

	.btn-secondary {
		flex: 1;
		background: var(--paper);
		color: var(--muted);
		border: 1px solid var(--rule);
		letter-spacing: 0.1em;
		padding: 0.85rem 1rem;
	}

	.btn-secondary:hover {
		color: var(--fg);
		border-color: var(--fg);
	}
</style>
