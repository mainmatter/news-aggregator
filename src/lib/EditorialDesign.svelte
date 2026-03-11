<script lang="ts">
	import { articles, today } from '$lib/articles';
	import Article from '$lib/components/Article.svelte';
	import FeaturedArticle from '$lib/components/FeaturedArticle.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import PageFooter from '$lib/components/PageFooter.svelte';
	import SectionRule from '$lib/components/SectionRule.svelte';
	import NavLink from '$lib/components/NavLink.svelte';
	import { sign_out } from '$lib/auth.remote';
</script>

<div class="page-container">
	<PageHeader
		edition_label="Daily Edition"
		date={today}
		title="Your News"
		article_count={articles.length}
	>
		{#snippet nav()}
			<NavLink href="/sources">Manage Sources</NavLink>
			<form {...sign_out} class="sign-out-form">
				<button class="sign-out-btn" type="submit">Sign Out</button>
			</form>
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

	.sign-out-form {
		display: inline;
	}

	.sign-out-btn {
		font-family: var(--font-body);
		font-size: 0.72rem;
		font-weight: 500;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--muted);
		background: none;
		border: none;
		cursor: pointer;
		padding: 0;
		transition: all 0.3s ease;
	}

	.sign-out-btn:hover {
		color: var(--accent);
		text-decoration: underline;
		text-underline-offset: 0.2em;
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
