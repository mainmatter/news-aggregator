<script lang="ts">
	import { get_user } from '$lib/auth.remote';
	import { get_daily_editions, type DailyEditionSummary } from '$lib/editions.remote';
	import Masthead from '$lib/components/Masthead.svelte';
	import NavLink from '$lib/components/NavLink.svelte';
	import SectionRule from '$lib/components/SectionRule.svelte';
	import PageFooter from '$lib/components/PageFooter.svelte';
	import { SvelteMap } from 'svelte/reactivity';

	await get_user();

	const editions = await get_daily_editions();

	type MonthGroup = {
		label: string;
		editions: DailyEditionSummary[];
	};

	let grouped = $derived.by(() => {
		const groups = new SvelteMap<string, DailyEditionSummary[]>();

		for (const edition of editions) {
			const [y, m] = edition.edition_date.split('-').map(Number);
			const key = `${y}-${String(m).padStart(2, '0')}`;
			const existing = groups.get(key);
			if (existing) {
				existing.push(edition);
			} else {
				groups.set(key, [edition]);
			}
		}

		const result: MonthGroup[] = [];
		for (const [key, items] of groups) {
			const [y, m] = key.split('-').map(Number);
			const label = new Date(y, m - 1, 1).toLocaleDateString('en-US', {
				month: 'long',
				year: 'numeric'
			});
			result.push({ label, editions: items });
		}

		return result;
	});

	function format_edition_date(date_str: string) {
		const [y, m, d] = date_str.split('-').map(Number);
		const date = new Date(y, m - 1, d);
		return {
			weekday: date.toLocaleDateString('en-US', { weekday: 'long' }),
			day: d,
			full: date.toLocaleDateString('en-US', {
				weekday: 'long',
				month: 'long',
				day: 'numeric',
				year: 'numeric'
			})
		};
	}

	function is_today(date_str: string) {
		return date_str === new Date().toISOString().slice(0, 10);
	}
</script>

<svelte:head>
	<title>Archives — Editorial</title>
</svelte:head>

<svelte:boundary>
	<div class="page-container">
		<header class="page-header">
			<Masthead top_left="Archives" top_right="All Editions" title="Past Editions" />
			<div class="header-nav">
				<span class="edition-total">{editions.length} Editions</span>
				<NavLink href="/news">&larr; Back to Today</NavLink>
			</div>
		</header>

		<SectionRule />

		<main class="content">
			{#each grouped as group, gi (group.label)}
				{#if gi > 0}
					<div class="month-divider"></div>
				{/if}

				<section class="month-group" style:--gi={gi}>
					<h2 class="month-label">{group.label}</h2>

					<ul class="edition-list">
						{#each group.editions as edition, ei (edition.id)}
							{@const date_info = format_edition_date(edition.edition_date)}
							{@const today = is_today(edition.edition_date)}
							<li class="edition-row" style:--ei={ei}>
								<a href="/news/{edition.edition_date}" class="edition-link">
									<span class="edition-day-col">
										<span class="edition-day-number">{date_info.day}</span>
										<span class="edition-weekday">{date_info.weekday}</span>
										{#if today}
											<span class="today-indicator">Today</span>
										{/if}
									</span>

									<span class="edition-detail-col">
										{#if edition.title}
											<span class="edition-title">{edition.title}</span>
										{/if}
										{#if edition.summary}
											<span class="edition-summary">{edition.summary}</span>
										{/if}
									</span>

									<span class="edition-meta-col">
										<span class="edition-stories">{edition.article_count} stories</span>
										<span class="edition-arrow">&rarr;</span>
									</span>
								</a>
							</li>
						{/each}
					</ul>
				</section>
			{/each}
		</main>

		<SectionRule />

		<PageFooter
			tagline="Every edition, preserved."
			subtitle="Browse through your curated news history."
		/>
	</div>

	{#snippet failed()}
		<div class="loading-state">
			<p>Loading&hellip;</p>
		</div>
	{/snippet}
</svelte:boundary>

<style>
	.page-container {
		position: relative;
		z-index: 1;
		max-width: var(--page-max-width);
		margin: 0 auto;
		padding: clamp(var(--s-6), 5vw, var(--s-8)) clamp(var(--s-4), 4vw, var(--s-6))
			clamp(var(--s-8), 6vw, var(--s-10));
	}

	.page-header {
		animation: fade-down 0.7s ease-out;
	}

	.header-nav {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--s-3) 0;
		border-top: var(--s-px) solid var(--rule);
		border-bottom: var(--s-px) solid var(--rule);
	}

	.edition-total {
		font-size: var(--text-sm);
		font-weight: 400;
		letter-spacing: var(--tracking-4);
		text-transform: uppercase;
		color: var(--muted);
	}

	.content {
		animation: fade-up 0.6s ease-out both;
		animation-delay: 0.2s;
	}

	.month-group {
		animation: fade-up 0.5s ease-out both;
		animation-delay: calc(0.3s + var(--gi) * 0.08s);
	}

	.month-label {
		font-family: var(--font-display);
		font-size: var(--text-lg);
		font-weight: 400;
		font-style: italic;
		font-variation-settings: 'opsz' 32;
		color: var(--fg);
		margin-bottom: var(--s-3);
	}

	.month-divider {
		height: var(--s-px);
		background: var(--rule);
		margin: var(--s-5) 0;
	}

	.edition-list {
		list-style: none;
	}

	.edition-row {
		animation: fade-up 0.4s ease-out both;
		animation-delay: calc(0.4s + var(--gi) * 0.08s + var(--ei) * 0.04s);
	}

	.edition-row + .edition-row {
		border-top: var(--s-px) solid var(--rule);
	}

	.edition-link {
		display: flex;
		align-items: center;
		gap: var(--s-4);
		padding: var(--s-3) var(--s-2);
		text-decoration: none;
		color: var(--fg);
		border-radius: var(--s-2px);
		transition:
			background 0.2s ease,
			color 0.2s ease;
	}

	.edition-link:hover {
		background: var(--card-hover);
	}

	.edition-day-col {
		display: flex;
		align-items: baseline;
		gap: var(--s-2);
		flex-shrink: 0;
		min-width: 10rem;
	}

	.edition-day-number {
		font-family: var(--font-display);
		font-size: 1.6rem;
		font-weight: 300;
		font-style: italic;
		font-variation-settings: 'opsz' 48;
		line-height: 1;
		min-width: 2ch;
		text-align: right;
	}

	.edition-weekday {
		font-family: var(--font-body);
		font-size: var(--text-sm);
		font-weight: 400;
		letter-spacing: var(--tracking-2);
		color: var(--muted);
	}

	.today-indicator {
		font-family: var(--font-body);
		font-size: var(--text-xs);
		font-weight: 600;
		letter-spacing: var(--tracking-5);
		text-transform: uppercase;
		color: var(--accent);
	}

	.edition-detail-col {
		display: flex;
		flex-direction: column;
		gap: var(--s-2px);
		flex: 1;
		min-width: 0;
	}

	.edition-title {
		font-family: var(--font-display);
		font-size: var(--text-base);
		font-weight: 500;
		font-variation-settings: 'opsz' 24;
		line-height: 1.3;
	}

	.edition-summary {
		font-family: var(--font-body);
		font-size: var(--text-sm);
		font-weight: 400;
		color: var(--muted);
		line-height: 1.4;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.edition-meta-col {
		display: flex;
		align-items: center;
		gap: var(--s-3);
		flex-shrink: 0;
	}

	.edition-stories {
		font-family: var(--font-body);
		font-size: var(--text-xs);
		font-weight: 400;
		letter-spacing: var(--tracking-3);
		text-transform: uppercase;
		color: var(--muted);
		white-space: nowrap;
	}

	.edition-arrow {
		font-size: var(--text-sm);
		color: var(--muted);
		transition: color 0.2s ease;
	}

	.edition-link:hover .edition-arrow {
		color: var(--accent);
	}

	.edition-link:hover .edition-title {
		color: var(--accent);
	}

	.loading-state {
		display: flex;
		justify-content: center;
		align-items: center;
		min-height: 60vh;
		color: var(--muted);
		font-family: var(--font-display);
		font-style: italic;
		font-size: var(--text-md);
	}

	/* Mobile: stack the columns */
	@media (max-width: 640px) {
		.edition-link {
			flex-wrap: wrap;
			gap: var(--s-2);
		}

		.edition-day-col {
			min-width: auto;
		}

		.edition-detail-col {
			flex-basis: 100%;
			order: 3;
		}

		.edition-meta-col {
			margin-left: auto;
		}

		.edition-summary {
			white-space: normal;
			display: -webkit-box;
			line-clamp: 2;
			-webkit-line-clamp: 2;
			-webkit-box-orient: vertical;
		}
	}
</style>
