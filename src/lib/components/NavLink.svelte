<script lang="ts">
	import type { Snippet } from 'svelte';

	let { href, children }: { href: string; children: Snippet } = $props();
</script>

<a {href} class="nav-link">
	{@render children()}
</a>

<style>
	.nav-link {
		font-size: 0.75rem;
		font-weight: 500;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--muted);
		text-decoration: none;
		padding-bottom: 2px;
		border-bottom: 1px solid transparent;
		transition: all 0.3s ease;
	}

	.nav-link:hover {
		color: var(--accent);
		border-bottom-color: var(--accent);
	}
</style>
