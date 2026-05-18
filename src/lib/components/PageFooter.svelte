<script lang="ts">
	let { tagline, subtitle }: { tagline: string; subtitle: string } = $props();
</script>

<footer>
	<p class="tagline">{tagline}</p>
	<p class="subtitle">{subtitle}</p>
</footer>

<style>
	footer {
		padding: var(--s-5) 0 var(--s-6);
		text-align: center;
		animation: fade-up 0.45s var(--ease-out-expo) both;
		animation-delay: 0.15s;
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
		letter-spacing: var(--tracking-1);
	}
</style>
