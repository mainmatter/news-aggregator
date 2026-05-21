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

	const user_sources = $derived(await get_user_sources());

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
		{#snippet top_center()}{user_sources.length} {user_sources.length === 1 ? 'Source' : 'Sources'}{/snippet}
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
			{...create_user_source.enhance(async ({ form, data, submit }) => {
				const optimistic_entry = {
					user_source_id: crypto.randomUUID(),
					source_id: crypto.randomUUID(),
					canonical_url: data.canonical_url,
					display_name: data.display_name,
					source_kind: 'rss',
					label: data.label ?? null,
					is_active: true,
					created_at: new Date(),
					updated_at: new Date()
				};

				await submit().updates(
					get_user_sources().withOverride((sources) => [...sources, optimistic_entry])
				);

				form.reset();
			})}
		>
			<div class="add-form-fields">
				<div class="field">
					<label class="field-label" for="new-url">Feed URL</label>
					<input
						{...create_user_source.fields.canonical_url.as('url')}
						id="new-url"
						placeholder="https://example.com/feed.xml"
					/>
					<FieldErrors field={create_user_source.fields.canonical_url} />
				</div>

				<div class="field">
					<label class="field-label" for="new-name">Display Name</label>
					<input
						{...create_user_source.fields.display_name.as('text')}
						id="new-name"
						placeholder="My Favorite Blog"
					/>
					<FieldErrors field={create_user_source.fields.display_name} />
				</div>

				<div class="field">
					<label class="field-label" for="new-label"
						>Label <span class="optional">(optional)</span></label
					>
					<input
						{...create_user_source.fields.label.as('text')}
						id="new-label"
						placeholder="Tech, Politics, etc."
					/>
					<FieldErrors field={create_user_source.fields.label} />
				</div>
			</div>

			<div class="add-form-actions">
				<Button variant="primary" type="submit">Add Source</Button>
			</div>
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
							{...edit.enhance(async ({ data, submit }) => {
								try {
									const updated_display_name = data.display_name ?? source.display_name;
									const updated_label = data.label ?? null;
									const updated_url = data.canonical_url ?? source.canonical_url;
									const updated_active = data.is_active ?? false;

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
								<div class="field field-inline">
									<label class="field-label" for="url-{source.user_source_id}">Feed URL</label>
									<input
										{...edit.fields.canonical_url.as('url', source.canonical_url)}
										id="url-{source.user_source_id}"
										placeholder="https://..."
									/>
									<FieldErrors field={edit.fields.canonical_url} />
								</div>

								<div class="field field-inline">
									<label class="field-label" for="name-{source.user_source_id}">Display Name</label>
									<input
										{...edit.fields.display_name.as('text', source.display_name)}
										id="name-{source.user_source_id}"
										placeholder="Source name"
									/>
									<FieldErrors field={edit.fields.display_name} />
								</div>

								<div class="field field-inline">
									<label class="field-label" for="label-{source.user_source_id}"
										>Label (optional)</label
									>
									<input
										{...edit.fields.label.as('text', source.label ?? '')}
										id="label-{source.user_source_id}"
										placeholder="Add a label…"
									/>
									<FieldErrors field={edit.fields.label} />
								</div>
							</div>

							<div class="source-actions">
								<Button bind:this={source_save_buttons[source.user_source_id]} type="submit">
									Save
								</Button>
							</div>
						</form>

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
							<Button variant="ghost" type="submit">Delete</Button>
						</form>
					</li>
				{/each}
			</ul>
		{/if}
	</section>
</main>

<PageFooter
	tagline="Curate your world."
	subtitle="Add, edit, and manage the sources that power your daily edition."
/>

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

	.add-form-actions {
		margin-top: var(--s-4);
		& :global(button) {
			display: block;
			margin-left: auto;
		}
	}

	/* --- Fields --- */
	.field {
		display: flex;
		flex-direction: column;
	}

	.field-label {
		display: block;
		font-size: var(--text-xs);
		font-weight: 500;
		letter-spacing: var(--tracking-5);
		text-transform: uppercase;
		color: var(--muted);
		margin-bottom: var(--s-1);
	}

	.optional {
		text-transform: none;
		letter-spacing: normal;
		font-weight: 400;
	}

	.field input:not([type='hidden']):not([type='checkbox']) {
		width: 100%;
		padding: var(--s-3) 0;
		background: transparent;
		color: var(--fg);
		border: 0;
		border-bottom: var(--s-2px) solid var(--rule-strong);
		border-radius: 0;
		font-family: var(--font-body);
		font-size: var(--text-base);
		transition: border-color 0.2s var(--ease-out-expo);
	}

	.field input::placeholder {
		color: var(--muted);
		opacity: 0.5;
	}

	.field input:focus {
		outline: none;
		border-bottom-color: var(--accent);
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
		font-family: var(--font-body);
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
		justify-content: flex-end;
	}

	.delete-form {
		position: absolute;
		bottom: var(--s-4);
		left: var(--s-4);
	}

	.delete-form :global(.btn-ghost) {
		color: var(--muted);
		font-size: var(--text-xs);
		transition: color 0.2s var(--ease-out-expo);
	}

	.delete-form :global(.btn-ghost:hover) {
		color: var(--accent);
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
