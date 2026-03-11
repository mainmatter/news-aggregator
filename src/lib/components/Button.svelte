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
		gap: var(--s-1);
		font-family: var(--font-body);
		font-size: var(--text-xs);
		font-weight: 500;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		padding: var(--s-1) var(--s-3);
		background: var(--paper);
		color: var(--muted);
		border: var(--s-px) solid var(--rule);
		border-radius: 0;
		cursor: pointer;
		transition:
			color 0.3s ease,
			border-color 0.3s ease;
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
		border: var(--s-px) solid var(--fg);
		letter-spacing: 0.1em;
		padding: var(--s-3) var(--s-4);
	}

	.btn-primary:hover {
		background: var(--accent);
		border-color: var(--accent);
	}

	.btn-secondary {
		flex: 1;
		background: var(--paper);
		color: var(--muted);
		border: var(--s-px) solid var(--rule);
		letter-spacing: 0.1em;
		padding: var(--s-3) var(--s-4);
	}

	.btn-secondary:hover {
		color: var(--fg);
		border-color: var(--fg);
	}
</style>
