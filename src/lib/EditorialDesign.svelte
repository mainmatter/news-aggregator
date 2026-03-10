<script lang="ts">
	import { articles, today } from '$lib/articles';
	import Article from '$lib/components/Article.svelte';
	import FeaturedArticle from '$lib/components/FeaturedArticle.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import PageFooter from '$lib/components/PageFooter.svelte';
	import SectionRule from '$lib/components/SectionRule.svelte';
	import ModeToggle from '$lib/components/ModeToggle.svelte';
	import NavLink from '$lib/components/NavLink.svelte';
</script>

<div class="red-rule"></div>

<div class="mode-toggle-wrapper">
	<ModeToggle />
</div>

<div class="page-container">
	<PageHeader
		edition_label="Daily Edition"
		date={today}
		title="Your News"
		article_count={articles.length}
	>
		{#snippet nav()}
			<NavLink href="/sources">Manage Sources</NavLink>
		{/snippet}
	</PageHeader>

	<SectionRule />

	<main class="content">
		{#each articles as article, i (article.id)}
			{#if i === 0}
				<FeaturedArticle {article} index={i} />
			{/if}
		{/each}

		<SectionRule />

		<div class="grid">
			{#each articles as article, i (article.id)}
				{#if i > 0}
					<Article {article} index={i} />
				{/if}
			{/each}
		</div>
	</main>

	<PageFooter
		tagline="Carefully curated. Elegantly delivered."
		subtitle="No algorithms, no noise — just the stories that matter."
	/>
</div>

<style>
	.red-rule {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		height: 3px;
		background: var(--accent);
		z-index: 100;
	}

	.mode-toggle-wrapper {
		position: fixed;
		top: 1.25rem;
		right: 1.5rem;
		z-index: 1000;
	}

	.page-container {
		position: relative;
		z-index: 1;
		max-width: 1100px;
		margin: 0 auto;
		padding: 3rem 2.5rem 4rem;
	}

	.grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0;
	}

	@media (max-width: 768px) {
		.page-container {
			padding: 2rem 1.25rem 3rem;
		}

		.grid {
			grid-template-columns: 1fr;
		}
	}
</style>
