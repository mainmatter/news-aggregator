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
		gap: var(--s-3);
		margin-bottom: var(--s-4);
	}

	.header-label {
		font-size: var(--text-xs);
		font-weight: 700;
		letter-spacing: var(--tracking-5);
		text-transform: uppercase;
		color: var(--fg);
		white-space: nowrap;
	}

	.header-rule {
		flex: 1;
		height: var(--s-px);
		background: var(--rule);
		min-width: var(--s-6);
	}

	.masthead {
		padding: clamp(var(--s-5), 5vw, var(--s-8)) 0 var(--s-3);
	}

	.masthead h1 {
		font-family: var(--font-display);
		font-size: var(--text-fluid-7xl);
		font-weight: 800;
		line-height: 0.88;
		letter-spacing: -0.06em;
		color: var(--fg);
		max-width: 9ch;
		text-wrap: balance;
	}

	@media (max-width: 640px) {
		.masthead h1 {
			font-size: clamp(var(--text-5xl), 18vw, var(--text-7xl));
		}
	}
</style>
