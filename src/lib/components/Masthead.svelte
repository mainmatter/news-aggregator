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
		flex-wrap: wrap;
		align-items: center;
		gap: clamp(var(--s-2), 2vw, var(--s-4));
		margin-bottom: var(--s-5);
	}

	.header-label {
		font-size: var(--text-xs);
		font-weight: 500;
		letter-spacing: var(--tracking-7);
		text-transform: uppercase;
		color: var(--muted);
		white-space: nowrap;
	}

	.header-rule {
		flex: 1;
		height: var(--s-px);
		background: var(--rule);
		min-width: var(--s-6);
	}

	.masthead {
		text-align: center;
		padding: clamp(var(--s-4), 4vw, var(--s-6)) 0;
	}

	.masthead h1 {
		font-family: var(--font-display);
		font-size: var(--text-fluid-7xl);
		font-weight: 300;
		font-style: italic;
		font-variation-settings: 'opsz' 72;
		line-height: 1;
		letter-spacing: -0.03em;
		color: var(--fg);
	}
</style>
