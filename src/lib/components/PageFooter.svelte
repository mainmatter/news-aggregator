<script lang="ts">
	let { tagline, subtitle }: { tagline: string; subtitle: string } = $props();
</script>

<footer>
	<p class="tagline">{tagline}</p>
	<p class="subtitle">{subtitle}</p>
</footer>

<style>
	footer {
		padding-bottom: var(--s-6);
		text-align: center;
		animation: fade-up 0.6s ease-out both;
		animation-delay: 1s;
	}

	.tagline {
		font-family: var(--font-display);
		font-size: var(--text-lg);
		font-weight: 400;
		font-style: italic;
		font-variation-settings: 'opsz' 32;
		color: var(--fg);
		margin-bottom: var(--s-1);
	}

	.subtitle {
		font-size: var(--text-sm);
		color: var(--muted);
		letter-spacing: 0.03em;
	}
</style>
