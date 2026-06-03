<script lang="ts">
	import { get_user } from '$lib/auth.remote';
	import Masthead from '$lib/components/Masthead.svelte';
	import NavLink from '$lib/components/NavLink.svelte';
	import PageFooter from '$lib/components/PageFooter.svelte';
	import { get_editions, type EditionSummary } from '$lib/editions.remote';

	await get_user();

	const editions = await get_editions();

	type MonthGroup = {
		label: string;
		editions: EditionSummary[];
	};

	let grouped = $derived.by(() => {
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		const groups = new Map<string, EditionSummary[]>();

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

<Masthead>
	{#snippet top_left()}Archives{/snippet}
	{#snippet top_center()}{editions.length} Editions{/snippet}
	{#snippet top_right()}All Editions{/snippet}
	{#snippet title()}Past Editions{/snippet}

	<NavLink href="/news">&larr; Back to Today</NavLink>
</Masthead>

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

<PageFooter />

<style>
	.content {
		margin-top: var(--s-5);
		animation: fade-up 0.5s var(--ease-out-expo) both;
		animation-delay: 0.2s;
	}

	.month-group {
		animation: fade-up 0.45s var(--ease-out-expo) both;
		animation-delay: calc(0.3s + var(--gi) * 0.08s);
	}

	.month-label {
		font-family: var(--font-display);
		font-size: var(--text-lg);
		font-weight: 850;
		letter-spacing: -0.02em;
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
		animation: fade-up 0.35s var(--ease-out-expo) both;
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
		transition:
			background 0.2s var(--ease-out-expo),
			color 0.2s var(--ease-out-expo);
	}

	.edition-link:hover {
		background: var(--support-soft);
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
		font-size: var(--text-2xl);
		font-weight: 850;
		line-height: 1;
		min-width: 2ch;
		text-align: right;
	}

	.edition-weekday {
		font-family: var(--font-display);
		font-size: var(--text-sm);
		font-weight: 400;
		letter-spacing: var(--tracking-2);
		color: var(--muted);
	}

	.today-indicator {
		font-family: var(--font-display);
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
		font-weight: 850;
		letter-spacing: -0.02em;
		line-height: 1.3;
	}

	.edition-summary {
		font-family: var(--font-display);
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
		font-family: var(--font-display);
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
		transition:
			color 0.2s var(--ease-out-expo),
			transform 0.2s var(--ease-out-expo);
	}

	.edition-link:hover .edition-arrow {
		color: var(--accent);
		transform: translateX(var(--s-1));
	}

	.edition-link:hover .edition-title {
		color: var(--accent);
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
