<script lang="ts">
	let { tagline, subtitle }: { tagline: string; subtitle: string } = $props();
</script>

<footer>
	<p class="tagline">{tagline}</p>
	<p class="subtitle">{subtitle}</p>
</footer>

<style>
	footer {
		padding-bottom: 2rem;
		text-align: center;
		animation: fade-up 0.6s ease-out both;
		animation-delay: 1s;
	}

	.tagline {
		font-family: var(--font-display);
		font-size: 1.2rem;
		font-weight: 400;
		font-style: italic;
		font-variation-settings: 'opsz' 32;
		color: var(--fg);
		margin-bottom: 0.4rem;
	}

	.subtitle {
		font-size: 0.78rem;
		color: var(--muted);
		letter-spacing: 0.03em;
	}
</style>
