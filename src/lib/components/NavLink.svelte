<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAnchorAttributes } from 'svelte/elements';

	type Props = {
		href: string;
		children: Snippet;
	} & Omit<HTMLAnchorAttributes, 'href'>;

	let { href, children, ...rest }: Props = $props();
</script>

<a {href} class={['nav-link', rest.class]} {...rest}>
	{@render children()}
</a>

<style>
	.nav-link {
		font-size: var(--text-sm);
		font-weight: 500;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--muted);
		text-decoration: none;
		padding-bottom: var(--s-2px);
		border-bottom: var(--s-px) solid transparent;
		transition:
			color 0.3s ease,
			border-bottom-color 0.3s ease;
	}

	.nav-link:hover {
		color: var(--accent);
		border-bottom-color: var(--accent);
	}
</style>
