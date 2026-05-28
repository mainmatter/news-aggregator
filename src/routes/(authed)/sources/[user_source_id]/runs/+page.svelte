<script lang="ts">
	import { page } from '$app/state';
	import Masthead from '$lib/components/Masthead.svelte';
	import NavLink from '$lib/components/NavLink.svelte';
	import PageFooter from '$lib/components/PageFooter.svelte';
	import { get_source_run_history } from '$lib/sources.remote';

	let { params } = $props();

	const user_source_id = $derived(params.user_source_id);
	const page_param = $derived(Number(page.url.searchParams.get('page') ?? '1'));

	const history = $derived(await get_source_run_history({ user_source_id, page: page_param }));

	function format_status(status: string) {
		switch (status) {
			case 'success':
				return 'Succeeded';
			case 'error':
				return 'Failed';
			case 'skipped':
				return 'Skipped';
			case 'running':
				return 'Running';
			case 'queued':
				return 'Queued';
			default:
				return status;
		}
	}

	function format_timestamp(value: Date | null) {
		if (!value) return '—';
		return value.toLocaleString();
	}

	function prev_href(current_page: number) {
		const url = new URL(page.url);
		url.searchParams.set('page', String(Math.max(1, current_page - 1)));
		return url.pathname + url.search;
	}

	function next_href(current_page: number, total_pages: number) {
		const url = new URL(page.url);
		url.searchParams.set('page', String(Math.min(total_pages, current_page + 1)));
		return url.pathname + url.search;
	}
</script>

<svelte:head>
	<title>Source Runs — Editorial</title>
</svelte:head>

{#if !history}
	<header class="page-header">
		<Masthead>
			{#snippet top_left()}Sources{/snippet}
			{#snippet top_center()}Not found{/snippet}
			{#snippet top_right()}Runs{/snippet}
			{#snippet title()}Source not found{/snippet}

			<NavLink href="/sources">&larr; Back to Sources</NavLink>
		</Masthead>
	</header>
	<main class="content">
		<p class="empty-state">We couldn't find that source. It may have been deleted.</p>
	</main>
{:else}
	<header class="page-header">
		<Masthead>
			{#snippet top_left()}Source Runs{/snippet}
			{#snippet top_center()}
				{history.total_count}
				{history.total_count === 1 ? 'Run' : 'Runs'}
			{/snippet}
			{#snippet top_right()}History{/snippet}
			{#snippet title()}{history.source.display_name}{/snippet}

			<NavLink href="/sources">&larr; Back to Sources</NavLink>
		</Masthead>
	</header>

	<main class="content">
		{#if history.rows.length === 0}
			<p class="empty-state">No runs yet for this source.</p>
		{:else}
			<ul class="runs">
				{#each history.rows as row (row.id)}
					<li class="run-row">
						<div class="run-meta">
							<span class="run-date">{row.edition_date}</span>
							<span class="run-status" data-status={row.status}>{format_status(row.status)}</span>
							<span class="run-count">
								{row.selected_article_count}
								{row.selected_article_count === 1 ? 'article' : 'articles'}
							</span>
							<span class="run-time">
								{format_timestamp(row.finished_at ?? row.started_at)}
							</span>
						</div>

						{#if row.source_display_name_snapshot && row.source_display_name_snapshot !== history.source.display_name}
							<div class="run-snapshot-name">As: {row.source_display_name_snapshot}</div>
						{/if}

						<div class="run-snapshot-url">{row.source_canonical_url_snapshot}</div>

						{#if row.reason}
							<p class="run-reason">{row.reason}</p>
						{/if}

						{#if row.error_message}
							<details class="run-error">
								<summary>Technical error details</summary>
								<pre>{row.error_message}</pre>
							</details>
						{/if}
					</li>
				{/each}
			</ul>

			<nav class="pagination">
				{#if history.page <= 1}
					<span class="pagination-link disabled" aria-disabled="true">Previous</span>
				{:else}
					<a class="pagination-link" href={prev_href(history.page)}>Previous</a>
				{/if}
				<span class="pagination-info">Page {history.page} of {history.total_pages}</span>
				{#if history.page >= history.total_pages}
					<span class="pagination-link disabled" aria-disabled="true">Next</span>
				{:else}
					<a class="pagination-link" href={next_href(history.page, history.total_pages)}>Next</a>
				{/if}
			</nav>
		{/if}
	</main>

	<PageFooter
		tagline="Trace the trail."
		subtitle="Every run from this source, kept on the record."
	/>
{/if}

<style>
	.page-header {
		animation: fade-down 0.55s var(--ease-out-expo);
	}

	.content {
		animation: fade-up 0.5s var(--ease-out-expo) both;
		animation-delay: 0.2s;
		padding: var(--s-5) 0;
	}

	.empty-state {
		font-family: var(--font-display);
		font-size: var(--text-base);
		color: var(--muted);
		font-weight: 650;
		padding: var(--s-5) 0;
	}

	.runs {
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: var(--s-4);
		padding: 0;
		margin: 0;
	}

	.run-row {
		background: var(--paper-raised);
		border: var(--s-px) solid var(--rule);
		padding: var(--s-4) var(--s-5);
		display: flex;
		flex-direction: column;
		gap: var(--s-2);
	}

	.run-meta {
		display: flex;
		flex-wrap: wrap;
		gap: var(--s-3);
		align-items: baseline;
		font-size: var(--text-sm);
	}

	.run-date {
		font-family: var(--font-display);
		font-weight: 700;
		font-size: var(--text-md);
		color: var(--fg);
	}

	.run-status {
		text-transform: uppercase;
		letter-spacing: var(--tracking-3);
		font-weight: 650;
		font-size: var(--text-xs);
		color: var(--muted);
	}

	.run-status[data-status='success'] {
		color: var(--status-success);
	}

	.run-status[data-status='error'] {
		color: var(--status-error);
	}

	.run-status[data-status='running'],
	.run-status[data-status='queued'] {
		color: var(--status-warning);
	}

	.run-count,
	.run-time {
		color: var(--muted);
		font-size: var(--text-xs);
		letter-spacing: var(--tracking-2);
	}

	.run-snapshot-name {
		font-size: var(--text-xs);
		color: var(--muted);
		letter-spacing: var(--tracking-2);
	}

	.run-snapshot-url {
		font-size: var(--text-xs);
		color: var(--muted);
		word-break: break-all;
		font-family: var(--font-display);
	}

	.run-reason {
		font-size: var(--text-sm);
		color: var(--fg);
		line-height: 1.55;
		margin: 0;
	}

	.run-error {
		margin-top: var(--s-2);
		font-size: var(--text-xs);
		color: var(--muted);
	}

	.run-error > summary {
		cursor: pointer;
		text-transform: uppercase;
		letter-spacing: var(--tracking-3);
		font-weight: 650;
		color: var(--status-error);
	}

	.run-error pre {
		margin-top: var(--s-2);
		padding: var(--s-3);
		background: var(--paper);
		border: var(--s-px) solid var(--rule);
		font-size: var(--text-xs);
		white-space: pre-wrap;
		word-break: break-word;
	}

	.pagination {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: var(--s-3);
		margin-top: var(--s-6);
		padding-top: var(--s-4);
		border-top: var(--s-px) solid var(--rule);
	}

	.pagination-link {
		background: transparent;
		border: var(--s-px) solid var(--rule-strong);
		padding: var(--s-2) var(--s-4);
		display: inline-block;
		font-family: var(--font-display);
		font-size: var(--text-xs);
		font-weight: 650;
		letter-spacing: var(--tracking-3);
		text-transform: uppercase;
		cursor: pointer;
		color: var(--fg);
		text-decoration: none;
		transition:
			background 0.2s var(--ease-out-expo),
			color 0.2s var(--ease-out-expo);
	}

	.pagination-link:hover:not(.disabled) {
		background: var(--fg);
		color: var(--bg);
	}

	.pagination-link.disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.pagination-info {
		font-size: var(--text-xs);
		color: var(--muted);
		letter-spacing: var(--tracking-3);
		text-transform: uppercase;
		font-weight: 650;
	}
</style>
