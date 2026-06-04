<script lang="ts">
	import Mainmatter from '$lib/components/Mainmatter.svelte';
</script>

<footer>
	<p>
		<a href="https://mainmatter.com/svelte" target="_blank">
			<span aria-hidden="true">Built by</span>
			<span class="sr-only">Built by Mainmatter</span>
			<span class="logo" aria-hidden="true">
				<Mainmatter />
			</span>
		</a>
	</p>
</footer>

<style>
	footer {
		display: flex;
		justify-content: center;
		padding: var(--s-6) 0 var(--s-4);
		border-top: var(--s-px) solid var(--rule);
		animation: fade-up 0.45s var(--ease-out-expo) both;
		animation-delay: 0.15s;
	}

	p {
		display: inline-flex;
		align-items: baseline;
		gap: var(--s-2);
		color: var(--muted);
		font-size: var(--text-xs);
		font-weight: 700;
		letter-spacing: var(--tracking-4);
		line-height: 0.85;
		text-transform: uppercase;
	}
	a {
		color: inherit;
		text-decoration: none;
	}

	.logo {
		display: inline-flex;
		color: var(--fg);
		transition: color 0.35s var(--ease-out-expo);
	}

	.logo :global(svg) {
		width: auto;
		height: var(--s-3);
	}

	.sr-only {
		position: absolute;
		width: var(--s-px);
		height: var(--s-px);
		padding: 0;
		margin: calc(-1 * var(--s-px));
		overflow: hidden;
		clip: rect(0 0 0 0);
		white-space: nowrap;
		border: 0;
	}
</style>
