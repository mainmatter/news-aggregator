<script lang="ts">
	let { category, items }: { category: string; items: string[] } = $props();
	const visible_items = $derived(items.filter(Boolean));
</script>

<div class="article-meta">
	<span class="category">{category}</span>
	{#each visible_items as item (item)}
		<span class="dot">·</span>
		<span>{item}</span>
	{/each}
</div>

<style>
	.article-meta {
		display: flex;
		align-items: center;
		gap: var(--s-2);
		font-size: var(--text-xs);
		font-weight: 700;
		letter-spacing: var(--tracking-5);
		text-transform: uppercase;
		color: var(--muted);
		flex-wrap: wrap;
	}

	.category {
		font-weight: 800;
		color: var(--accent);
	}

	.dot {
		color: var(--rule-strong);
		font-weight: 400;
	}
</style>
