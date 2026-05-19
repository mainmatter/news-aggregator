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
		font-weight: 750;
		letter-spacing: var(--tracking-4);
		text-transform: uppercase;
		color: var(--fg);
		text-decoration: none;
		padding-bottom: var(--s-1);
		background: linear-gradient(var(--accent), var(--accent)) 0 100% / 0 var(--s-2px) no-repeat;
		transition:
			color 0.2s var(--ease-out-expo),
			background-size 0.2s var(--ease-out-expo),
			transform 0.2s var(--ease-out-expo);
	}

	.nav-link:hover {
		color: var(--accent);
		background-size: 100% var(--s-2px);
		transform: translateX(var(--s-1));
	}
</style>
