<script lang="ts">
	import {
		get_user_sources,
		create_user_source,
		update_user_source,
		delete_user_source
	} from '$lib/sources.remote';
	import Masthead from '$lib/components/Masthead.svelte';
	import NavLink from '$lib/components/NavLink.svelte';
	import SectionRule from '$lib/components/SectionRule.svelte';
	import PageFooter from '$lib/components/PageFooter.svelte';
	import FieldErrors from '$lib/components/FieldErrors.svelte';
	import Button from '$lib/components/Button.svelte';
	import FormActions from '$lib/components/FormActions.svelte';
	import FormField from '$lib/components/FormField.svelte';

	const user_sources = $derived(await get_user_sources());

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

	let source_save_buttons: Record<string, Button | undefined> = {};

	const forms = $derived.by(() => {
		const forms: Array<{
			source: (typeof user_sources)[number];
			edit: ReturnType<typeof update_user_source.for>;
			remove: ReturnType<typeof delete_user_source.for>;
		}> = [];
		for (const source of user_sources) {
			const edit = update_user_source.for(source.user_source_id);
			const remove = delete_user_source.for(source.user_source_id);
			forms.push({ source, edit, remove });
		}
		return forms;
	});
</script>

<svelte:head>
	<title>Sources — Editorial</title>
</svelte:head>

<header class="page-header">
	<Masthead>
		{#snippet top_left()}Sources{/snippet}
		{#snippet top_center()}{user_sources.length}
			{user_sources.length === 1 ? 'Source' : 'Sources'}{/snippet}
		{#snippet top_right()}Manage Feeds{/snippet}
		{#snippet title()}Your Sources{/snippet}

		<NavLink href="/settings">&larr; Back to Settings</NavLink>
	</Masthead>
</header>

<main class="content">
	<section class="add-source">
		<h2 class="section-label">Add a Source</h2>

		<form
			class="add-form"
			{...create_user_source.enhance(async ({ element, submit }) => {
				const optimistic_entry = {
					user_source_id: crypto.randomUUID(),
					source_id: crypto.randomUUID(),
					canonical_url: create_user_source.fields.canonical_url.value()!,
					display_name: create_user_source.fields.display_name.value()!,
					source_kind: 'rss',
					label: create_user_source.fields.label.value() ?? null,
					is_active: true,
					created_at: new Date(),
					updated_at: new Date(),
					recent_runs: []
				};

				await submit().updates(
					get_user_sources().withOverride((sources) => [...sources, optimistic_entry])
				);

				element.reset();
			})}
		>
			<div class="add-form-fields">
				<FormField label="Feed URL" for="new-url">
					<input
						{...create_user_source.fields.canonical_url.as('url')}
						id="new-url"
						placeholder="https://example.com/feed.xml"
					/>
					<FieldErrors field={create_user_source.fields.canonical_url} />
				</FormField>

				<FormField label="Display Name" for="new-name">
					<input
						{...create_user_source.fields.display_name.as('text')}
						id="new-name"
						placeholder="My Favorite Blog"
					/>
					<FieldErrors field={create_user_source.fields.display_name} />
				</FormField>

				<FormField label="Label" for="new-label" optional>
					<input
						{...create_user_source.fields.label.as('text')}
						id="new-label"
						placeholder="Tech, Politics, etc."
					/>
					<FieldErrors field={create_user_source.fields.label} />
				</FormField>
			</div>

			<FormActions>
				<Button variant="primary" type="submit" loading={!!create_user_source.pending}
					>Add Source</Button
				>
			</FormActions>
		</form>
	</section>

	<SectionRule />

	<section class="source-list">
		<h2 class="section-label">Your Sources</h2>

		{#if user_sources.length === 0}
			<p class="empty-state">No sources yet. Add one above to get started.</p>
		{:else}
			<ul class="sources">
				{#each forms as { edit, remove, source } (source.user_source_id)}
					<li class="source-card">
						<form
							class="source-edit-form"
							id="edit-{source.user_source_id}"
							{...edit.enhance(async ({ submit }) => {
								try {
									const updated_display_name =
										edit.fields.display_name.value() ?? source.display_name;
									const updated_label = edit.fields.label.value() ?? null;
									const updated_url = edit.fields.canonical_url.value() ?? source.canonical_url;
									const updated_active = edit.fields.is_active.value() ?? false;

									await submit().updates(
										get_user_sources().withOverride((sources) =>
											sources.map((s) =>
												s.user_source_id === source.user_source_id
													? {
															...s,
															display_name: updated_display_name,
															label: updated_label,
															canonical_url: updated_url,
															is_active: updated_active
														}
													: s
											)
										)
									);
									source_save_buttons[source.user_source_id]?.show_feedback('success');
								} catch (error) {
									source_save_buttons[source.user_source_id]?.show_feedback('error');
									throw error;
								}
							})}
						>
							<input {...edit.fields.user_source_id.as('hidden', source.user_source_id)} />

							<div class="source-header">
								<div class="source-identity">
									<h3 class="source-name">{source.display_name}</h3>
									<span class="source-kind">{source.source_kind}</span>
								</div>

								<label class="active-toggle">
									<input
										{...source.is_active
											? edit.fields.is_active.as('checkbox', true)
											: edit.fields.is_active.as('checkbox', false)}
									/>
									<span class="toggle-label">Active</span>
								</label>
							</div>

							<div class="source-fields">
								<FormField label="Feed URL" for="url-{source.user_source_id}">
									<input
										{...edit.fields.canonical_url.as('url', source.canonical_url)}
										id="url-{source.user_source_id}"
										placeholder="https://..."
									/>
									<FieldErrors field={edit.fields.canonical_url} />
								</FormField>

								<FormField label="Display Name" for="name-{source.user_source_id}">
									<input
										{...edit.fields.display_name.as('text', source.display_name)}
										id="name-{source.user_source_id}"
										placeholder="Source name"
									/>
									<FieldErrors field={edit.fields.display_name} />
								</FormField>

								<FormField label="Label" for="label-{source.user_source_id}" optional>
									<input
										{...edit.fields.label.as('text', source.label ?? '')}
										id="label-{source.user_source_id}"
										placeholder="Add a label…"
									/>
									<FieldErrors field={edit.fields.label} />
								</FormField>
							</div>
						</form>

						<div class="source-actions">
							<form
								class="delete-form"
								{...remove.enhance(async ({ submit }) => {
									await submit().updates(
										get_user_sources().withOverride((sources) =>
											sources.filter((s) => s.user_source_id !== source.user_source_id)
										)
									);
								})}
							>
								<input {...remove.fields.user_source_id.as('hidden', source.user_source_id)} />
								<Button variant="ghost" type="submit" loading={!!remove.pending}>Delete</Button>
							</form>
							<Button
								bind:this={source_save_buttons[source.user_source_id]}
								type="submit"
								form="edit-{source.user_source_id}"
								loading={!!edit.pending}
							>
								Save
							</Button>
						</div>

						<details class="generation-history">
							<summary>Generation History</summary>
							<div class="history-body">
								{#if source.recent_runs && source.recent_runs.length > 0}
									<ul class="history-list">
										{#each source.recent_runs as run (run.id)}
											<li class="history-row">
												<div class="history-meta">
													<span class="history-date">{run.edition_date}</span>
													<span class="history-status" data-status={run.status}
														>{format_status(run.status)}</span
													>
													<span class="history-count">
														{run.selected_article_count}
														{run.selected_article_count === 1 ? 'article' : 'articles'}
													</span>
												</div>
												{#if run.reason}
													<p class="history-reason">{run.reason}</p>
												{/if}
											</li>
										{/each}
									</ul>
								{:else}
									<p class="history-empty">No runs yet.</p>
								{/if}
								<a class="view-all" href="/sources/{source.user_source_id}/runs"
									>View all runs &rarr;</a
								>
							</div>
						</details>
					</li>
				{/each}
			</ul>
		{/if}
	</section>
</main>

<PageFooter />

<style>
	.page-header {
		animation: fade-down 0.55s var(--ease-out-expo);
	}

	.header-nav {
		display: flex;
		justify-content: flex-end;
		align-items: center;
		padding: var(--s-4) 0;
		border-top: var(--s-2px) solid var(--fg);
		border-bottom: var(--s-px) solid var(--rule-strong);
	}

	.content {
		animation: fade-up 0.5s var(--ease-out-expo) both;
		animation-delay: 0.2s;
	}

	/* --- Section headings --- */
	.section-label {
		font-family: var(--font-display);
		font-size: var(--text-lg);
		font-weight: 850;
		letter-spacing: -0.02em;
		color: var(--fg);
		margin-bottom: var(--s-4);
	}

	/* --- Add source form --- */
	.add-source {
		padding: var(--s-5) 0;
	}

	.add-form-fields {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: var(--s-4);
	}

	/* --- Source list --- */
	.source-list {
		padding: var(--s-5) 0;
	}

	.sources {
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: var(--s-4);
	}

	.empty-state {
		font-family: var(--font-display);
		font-size: var(--text-base);
		color: var(--muted);
		font-weight: 650;
		padding: var(--s-5) 0;
	}

	/* --- Source card --- */
	.source-card {
		background: var(--paper-raised);
		border: var(--s-2px) solid var(--rule);
		padding: var(--s-5);
		transition:
			border-color 0.2s var(--ease-out-expo),
			background 0.2s var(--ease-out-expo);
		position: relative;
	}

	.source-card:hover {
		border-color: var(--fg);
	}

	.source-edit-form {
		display: flex;
		flex-direction: column;
		gap: var(--s-4);
	}

	.source-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: var(--s-3);
	}

	.source-identity {
		display: flex;
		align-items: baseline;
		gap: var(--s-2);
		min-width: 0;
	}

	.source-name {
		font-family: var(--font-display);
		font-size: var(--text-lg);
		font-weight: 850;
		letter-spacing: -0.02em;
		line-height: 1.3;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.source-kind {
		font-size: var(--text-xs);
		font-weight: 400;
		letter-spacing: var(--tracking-3);
		text-transform: uppercase;
		color: var(--muted);
		flex-shrink: 0;
	}

	/* --- Active toggle --- */
	.active-toggle {
		display: flex;
		align-items: center;
		gap: var(--s-2);
		cursor: pointer;
		flex-shrink: 0;
	}

	.active-toggle input[type='checkbox'] {
		accent-color: var(--accent);
		width: var(--s-4);
		height: var(--s-4);
		cursor: pointer;
	}

	.toggle-label {
		font-size: var(--text-xs);
		font-weight: 500;
		letter-spacing: var(--tracking-3);
		text-transform: uppercase;
		color: var(--muted);
	}

	/* --- Source fields (inline edit) --- */
	.source-fields {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: var(--s-4);
	}

	/* --- Source actions --- */
	.source-actions {
		display: flex;
		gap: var(--s-2);
		margin-top: var(--s-3);
		justify-content: space-between;
		align-items: center;
	}

	.delete-form {
		display: flex;
	}

	.delete-form :global(.btn-ghost) {
		color: var(--muted);
		font-size: var(--text-xs);
		transition: color 0.2s var(--ease-out-expo);
	}

	.delete-form :global(.btn-ghost:hover) {
		color: var(--accent);
	}

	/* --- Generation history --- */
	.generation-history {
		margin-top: var(--s-5);
		padding-top: var(--s-4);
		border-top: var(--s-px) solid var(--rule);
	}

	.generation-history > summary {
		cursor: pointer;
		font-family: var(--font-display);
		font-size: var(--text-xs);
		font-weight: 650;
		letter-spacing: var(--tracking-3);
		text-transform: uppercase;
		color: var(--muted);
		list-style: none;
		display: flex;
		align-items: center;
		gap: var(--s-2);
		transition: color 0.2s var(--ease-out-expo);
	}

	.generation-history > summary::-webkit-details-marker {
		display: none;
	}

	.generation-history > summary::before {
		content: '+';
		font-size: var(--text-base);
		line-height: 1;
		display: inline-block;
		width: var(--s-3);
	}

	.generation-history[open] > summary::before {
		content: '−';
	}

	.generation-history > summary:hover {
		color: var(--fg);
	}

	.history-body {
		margin-top: var(--s-3);
		display: flex;
		flex-direction: column;
		gap: var(--s-3);
	}

	.history-list {
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: var(--s-2);
		margin: 0;
		padding: 0;
	}

	.history-row {
		padding: var(--s-2) 0;
		border-bottom: var(--s-px) dashed var(--rule);
	}

	.history-row:last-child {
		border-bottom: none;
	}

	.history-meta {
		display: flex;
		gap: var(--s-3);
		align-items: baseline;
		flex-wrap: wrap;
		font-size: var(--text-xs);
		letter-spacing: var(--tracking-2);
	}

	.history-date {
		font-family: var(--font-display);
		font-weight: 650;
		color: var(--fg);
	}

	.history-status {
		text-transform: uppercase;
		letter-spacing: var(--tracking-3);
		font-weight: 650;
		color: var(--muted);
	}

	.history-status[data-status='success'] {
		color: var(--status-success);
	}

	.history-status[data-status='error'] {
		color: var(--status-error);
	}

	.history-status[data-status='running'],
	.history-status[data-status='queued'] {
		color: var(--status-warning);
	}

	.history-count {
		color: var(--muted);
	}

	.history-reason {
		margin-top: var(--s-1);
		font-size: var(--text-sm);
		color: var(--fg);
		line-height: 1.5;
	}

	.history-empty {
		font-size: var(--text-sm);
		color: var(--muted);
		font-style: italic;
	}

	.view-all {
		align-self: flex-start;
		font-size: var(--text-xs);
		font-weight: 650;
		letter-spacing: var(--tracking-3);
		text-transform: uppercase;
		color: var(--accent);
		text-decoration: none;
		transition: color 0.2s var(--ease-out-expo);
	}

	.view-all:hover {
		color: var(--fg);
	}

	/* --- Responsive --- */
	@media (max-width: 640px) {
		.source-fields {
			grid-template-columns: 1fr;
		}

		.source-header {
			flex-direction: column;
			gap: var(--s-2);
		}

		.add-form-fields {
			grid-template-columns: 1fr;
		}
	}
</style>
