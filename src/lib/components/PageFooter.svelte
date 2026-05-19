<script lang="ts">
	let { tagline, subtitle }: { tagline: string; subtitle: string } = $props();
</script>

<footer>
	<p class="tagline">{tagline}</p>
	<p class="subtitle">{subtitle}</p>
</footer>

<style>
	footer {
		padding: var(--s-6) 0;
		border-top: var(--s-2px) solid var(--fg);
		animation: fade-up 0.45s var(--ease-out-expo) both;
		animation-delay: 0.15s;
	}

	.tagline {
		font-family: var(--font-display);
		font-size: var(--text-xl);
		font-weight: 800;
		letter-spacing: -0.02em;
		color: var(--fg);
		margin-bottom: var(--s-2);
	}

	.subtitle {
		font-size: var(--text-sm);
		color: var(--muted);
		max-width: var(--measure);
	}
</style>
