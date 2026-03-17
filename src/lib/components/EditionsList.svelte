<script lang="ts">
	import type { DailyEditionSummary } from '$lib/editions.remote';
	import { page } from '$app/state';

	let { editions, max = 10 }: { editions: DailyEditionSummary[]; max?: number } = $props();

	let visible_editions = $derived(editions.slice(0, max));
	let has_more = $derived(editions.length > max);

	function format_pill_label(date_str: string) {
		const [y, m, d] = date_str.split('-').map(Number);
		const date = new Date(y, m - 1, d);
		const weekday = date.toLocaleDateString('en-US', { weekday: 'short' });
		return `${weekday} ${d}`;
	}

	function format_full_date(date_str: string) {
		const [y, m, d] = date_str.split('-').map(Number);
		return new Date(y, m - 1, d).toLocaleDateString('en-US', {
			weekday: 'long',
			month: 'long',
			day: 'numeric'
		});
	}

	function is_today(date_str: string) {
		return date_str === new Date().toISOString().slice(0, 10);
	}

	function is_active(date_str: string) {
		const current_date = page.params.date;
		if (!current_date) {
			return is_today(date_str);
		}
		return current_date === date_str;
	}
</script>

<nav class="editions-strip" aria-label="Daily editions">
	<span class="editions-label">Editions</span>

	<ul class="editions-row">
		{#each visible_editions as edition (edition.id)}
			{@const active = is_active(edition.edition_date)}
			{@const today = is_today(edition.edition_date)}
			<li>
				<a
					href="/news/{edition.edition_date}"
					class={['edition-pill', { active }]}
					aria-current={active ? 'page' : undefined}
					title="{format_full_date(edition.edition_date)} — {edition.article_count} stories"
				>
					{#if today}
						<span class="today-dot" aria-label="Today"></span>
					{/if}
					<span class="pill-text">{format_pill_label(edition.edition_date)}</span>
				</a>
			</li>
		{/each}
	</ul>

	{#if has_more}
		<a href="/news/archives" class="view-all">View all &rarr;</a>
	{/if}
</nav>

<style>
	.editions-strip {
		display: flex;
		align-items: center;
		gap: var(--s-3);
		border-top: var(--s-px) solid var(--rule);
		border-bottom: var(--s-px) solid var(--rule);
		padding: var(--s-2) 0;
	}

	.editions-label {
		font-family: var(--font-body);
		font-size: var(--text-xs);
		font-weight: 600;
		letter-spacing: var(--tracking-6);
		text-transform: uppercase;
		color: var(--muted);
		flex-shrink: 0;
		user-select: none;
	}

	.editions-row {
		list-style: none;
		display: flex;
		align-items: center;
		gap: var(--s-1);
		overflow-x: auto;
		scrollbar-width: none;
		flex: 1;
		min-width: 0;
	}

	.editions-row::-webkit-scrollbar {
		display: none;
	}

	li {
		flex-shrink: 0;
	}

	.edition-pill {
		position: relative;
		display: flex;
		align-items: center;
		gap: var(--s-1);
		padding: var(--s-1) var(--s-2);
		font-family: var(--font-body);
		font-size: var(--text-sm);
		font-weight: 450;
		letter-spacing: var(--tracking-1);
		color: var(--muted);
		text-decoration: none;
		white-space: nowrap;
		transition:
			color 0.15s ease,
			background 0.15s ease,
			border-color 0.15s ease;
	}

	.edition-pill:hover {
		color: var(--fg);
		background: var(--card-hover);
	}

	.edition-pill.active {
		color: var(--fg);
		font-weight: 550;
		background: var(--accent-soft);

		&::before {
			view-transition-name: active-pill-underline;
			content: '';
			position: absolute;
			bottom: 0;
			left: 0;
			right: 0;
			height: var(--s-2px);
			background: var(--accent);
		}
	}

	.today-dot {
		display: block;
		width: 5px;
		height: 5px;
		border-radius: 50%;
		background: var(--accent);
		flex-shrink: 0;
	}

	.pill-text {
		line-height: 1;
	}

	.view-all {
		font-family: var(--font-body);
		font-size: var(--text-xs);
		font-weight: 500;
		color: var(--muted);
		text-decoration: none;
		white-space: nowrap;
		flex-shrink: 0;
		letter-spacing: var(--tracking-1);
		transition: color 0.15s ease;
	}

	.view-all:hover {
		color: var(--accent);
	}
</style>
