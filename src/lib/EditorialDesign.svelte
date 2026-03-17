<script lang="ts">
	import { articles } from '$lib/articles';
	import Article from '$lib/components/Article.svelte';
	import FeaturedArticle from '$lib/components/FeaturedArticle.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import PageFooter from '$lib/components/PageFooter.svelte';
	import SectionRule from '$lib/components/SectionRule.svelte';
	import NavLink from '$lib/components/NavLink.svelte';
	import { sign_out } from '$lib/auth.remote';

	let { date }: { date?: string | undefined } = $props();

	const date_options: Intl.DateTimeFormatOptions = {
		weekday: 'long',
		year: 'numeric',
		month: 'long',
		day: 'numeric'
	};

	let display_date = $derived.by(() => {
		if (date) {
			// Parse YYYY-MM-DD without timezone shift
			const [y, m, d] = date.split('-').map(Number);
			return new Date(y, m - 1, d).toLocaleDateString('en-US', date_options);
		}
		return new Date().toLocaleDateString('en-US', date_options);
	});
</script>

<div class="page-container">
	<PageHeader
		edition_label="Daily Edition"
		date={display_date}
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
		max-width: var(--page-max-width);
		margin: 0 auto;
		padding: clamp(var(--s-6), 5vw, var(--s-8)) clamp(var(--s-4), 4vw, var(--s-6))
			clamp(var(--s-8), 6vw, var(--s-10));
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 22rem), 1fr));
		gap: 0;
	}

	.sign-out-form {
		display: inline;
	}

	.sign-out-btn {
		font-family: var(--font-body);
		font-size: var(--text-xs);
		font-weight: 500;
		letter-spacing: var(--tracking-5);
		text-transform: uppercase;
		color: var(--muted);
		background: none;
		border: none;
		cursor: pointer;
		padding: 0;
		transition: color 0.3s ease;
	}

	.sign-out-btn:hover {
		color: var(--accent);
		text-decoration: underline;
		text-underline-offset: 0.2em;
	}
</style>
