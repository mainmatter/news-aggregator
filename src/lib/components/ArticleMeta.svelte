<script lang="ts">
	let { category, items }: { category: string; items: string[] } = $props();
</script>

<div class="article-meta">
	<span class="category">{category}</span>
	{#each items as item (item)}
		<span class="dot">·</span>
		<span>{item}</span>
	{/each}
</div>

<style>
	.article-meta {
		display: flex;
		align-items: center;
		gap: var(--s-1);
		font-size: var(--text-xs);
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--muted);
	}

	.category {
		font-weight: 600;
		color: var(--accent);
	}

	.dot {
		color: var(--rule);
	}
</style>
