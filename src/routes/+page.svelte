<script lang="ts">
	import Article from '$lib/components/Article.svelte';
	import FeaturedArticle from '$lib/components/FeaturedArticle.svelte';
	import EditorialDesign from '$lib/EditorialDesign.svelte';

	const featured_article = {
		id: 1,
		title: 'Global Climate Summit Reaches Historic Agreement on Emissions Targets',
		source: 'Reuters',
		published_at: '2026-03-09',
		summary:
			"Delegates from 194 nations finalized a binding accord that commits the world's largest economies to halving carbon output by 2035, marking the most ambitious climate pact since the Paris Agreement. The deal includes a $400 billion green-transition fund for developing nations and strict penalties for non-compliance, signaling a dramatic shift in international climate policy.",
		url: 'https://example.com/climate-summit',
		category: 'Climate'
	};
</script>

<svelte:head>
	<title>Your News — Editorial</title>
</svelte:head>

<EditorialDesign></EditorialDesign>

<section style="max-width: 960px; margin: 3rem auto; padding: 0 1.5rem;">
	<FeaturedArticle article={featured_article} index={0} />

	<Article article={featured_article} index={1} />
</section>
