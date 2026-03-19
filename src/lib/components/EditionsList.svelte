<script lang="ts">
	import type { EditionSummary } from '$lib/editions.remote';
	import { page } from '$app/state';

	const day_in_ms = 86400000;

	let { editions, max = 15 }: { editions: EditionSummary[]; max?: number } = $props();

	function parse_date(date_str: string) {
		const [y, m, d] = date_str.split('-').map(Number);
		return new Date(Date.UTC(y, m - 1, d));
	}

	function format_date(date: Date) {
		return date.toISOString().slice(0, 10);
	}

	function offset_date(date_str: string, offset: number) {
		return format_date(new Date(parse_date(date_str).getTime() + offset * day_in_ms));
	}

	function get_today_date() {
		return new Date().toISOString().slice(0, 10);
	}

	const today_date = get_today_date();
	let current_date = $derived(page.params.date || today_date);

	let editions_by_date = $derived.by(() => {
		const by_date: Record<string, EditionSummary> = {};

		for (const edition of editions) {
			by_date[edition.edition_date] = edition;
		}

		return by_date;
	});

	let visible_days = $derived.by(() => {
		const visible_date_strs = [];
		const later_slots = Math.min(2, Math.max(max - 1, 0));

		for (let index = later_slots; index > 0; index -= 1) {
			const date_str = offset_date(current_date, index);

			if (date_str <= today_date) {
				visible_date_strs.push(date_str);
			}
		}

		visible_date_strs.push(current_date);

		for (let index = 1; visible_date_strs.length < max; index += 1) {
			visible_date_strs.push(offset_date(current_date, -index));
		}

		return visible_date_strs.map((date_str) => ({
			date_str,
			edition: editions_by_date[date_str]
		}));
	});

	function format_pill_label(date_str: string) {
		const date = parse_date(date_str);
		const weekday = date.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' });
		return `${weekday} ${date.getUTCDate()}`;
	}

	function format_full_date(date_str: string) {
		return parse_date(date_str).toLocaleDateString('en-US', {
			weekday: 'long',
			month: 'long',
			day: 'numeric',
			timeZone: 'UTC'
		});
	}

	function is_today(date_str: string) {
		return date_str === today_date;
	}

	function is_active(date_str: string) {
		const route_date = page.params.date;
		if (!route_date) {
			return is_today(date_str);
		}
		return route_date === date_str;
	}
</script>

<nav class="editions-strip" aria-label="Daily editions">
	<span class="editions-label">Editions</span>

	<ul class="editions-row">
		{#each visible_days as item (item.date_str)}
			{@const active = is_active(item.date_str)}
			{@const today = is_today(item.date_str)}
			<li>
				{#if item.edition}
					<a
						href="/news/{item.date_str}"
						class={['edition-pill', { active }]}
						style:view-transition-name="edition-pill-{item.date_str}"
						aria-current={active ? 'page' : undefined}
						title="{format_full_date(item.date_str)} — {item.edition.article_count} stories"
					>
						{#if today}
							<span class="today-dot" aria-label="Today"></span>
						{/if}
						<span class="pill-text">{format_pill_label(item.date_str)}</span>
					</a>
				{:else}
					<span
						class={['edition-pill', 'disabled', { active }]}
						style:view-transition-name="edition-pill-{item.date_str}"
						aria-current={active ? 'page' : undefined}
						aria-disabled="true"
						title="{format_full_date(item.date_str)} — no edition available"
					>
						{#if today}
							<span class="today-dot" aria-label="Today"></span>
						{/if}
						<span class="pill-text">{format_pill_label(item.date_str)}</span>
					</span>
				{/if}
			</li>
		{/each}
	</ul>

	<a href="/news/archives" class="view-all">View all &rarr;</a>
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
			border-color 0.15s ease,
			opacity 0.15s ease;
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

	.edition-pill.disabled {
		cursor: default;
		opacity: 0.5;
	}

	.edition-pill.disabled:hover {
		color: var(--muted);
		background: transparent;
	}

	.edition-pill.disabled.active {
		color: var(--fg);
		opacity: 1;
	}

	.today-dot {
		display: block;
		width: var(--s-1);
		height: var(--s-1);
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
