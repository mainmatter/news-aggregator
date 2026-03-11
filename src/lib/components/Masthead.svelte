<script lang="ts">
	let {
		top_left,
		top_right,
		title
	}: {
		top_left: string;
		top_right: string;
		title: string;
	} = $props();
</script>

<div class="header-top">
	<span class="header-label">{top_left}</span>
	<span class="header-rule"></span>
	<span class="header-label">{top_right}</span>
</div>
<div class="masthead">
	<h1>{title}</h1>
</div>

<style>
	.header-top {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-bottom: 1.5rem;
	}

	.header-label {
		font-size: 0.72rem;
		font-weight: 500;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--muted);
		white-space: nowrap;
	}

	.header-rule {
		flex: 1;
		height: 1px;
		background: var(--rule);
	}

	.masthead {
		text-align: center;
		padding: 2rem 0 1.75rem;
	}

	.masthead h1 {
		font-family: var(--font-display);
		font-size: clamp(3.5rem, 10vw, 6.5rem);
		font-weight: 300;
		font-style: italic;
		font-variation-settings: 'opsz' 72;
		line-height: 1;
		letter-spacing: -0.03em;
		color: var(--fg);
	}

	@media (max-width: 480px) {
		.masthead {
			padding: 1.25rem 0 1.25rem;
		}

		.header-top {
			flex-wrap: wrap;
			gap: 0.5rem;
		}

		.header-rule {
			display: none;
		}
	}
</style>
