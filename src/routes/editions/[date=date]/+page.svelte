<script lang="ts">
	import { page } from '$app/state';
	import Button from '$lib/components/Button.svelte';
	import FieldErrors from '$lib/components/FieldErrors.svelte';
	import Masthead from '$lib/components/Masthead.svelte';
	import NavLink from '$lib/components/NavLink.svelte';
	import PageFooter from '$lib/components/PageFooter.svelte';
	import SectionRule from '$lib/components/SectionRule.svelte';
	import {
		add_edition_article,
		create_manual_article,
		get_edition_editor,
		remove_edition_article,
		reorder_edition_articles,
		search_editable_articles,
		update_edition_article,
		update_edition_meta,
		type CandidateArticle,
		type EditionArticleRow
	} from '$lib/editions.remote';
	import { get_user_sources } from '$lib/sources.remote';
	import { untrack } from 'svelte';

	const date_param = $derived(page.params.date!);

	const edition = $derived(await get_edition_editor(date_param));

	const formatted_date = $derived(
		new Date(date_param + 'T00:00:00').toLocaleDateString('en-US', {
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		})
	);

	// --- Edition metadata form ---
	const meta_form = $derived.by(() => {
		if (!edition) return null;
		const form = update_edition_meta.for(edition.id);
		untrack(() => {
			form.fields.set({
				edition_id: edition.id,
				title: edition.title ?? undefined,
				summary: edition.summary ?? undefined,
				status: edition.status
			});
		});
		return form;
	});

	// --- Article search ---
	let search_term = $derived(page.url.searchParams.get('q') ?? '');

	const candidates = $derived(
		edition
			? await search_editable_articles({
					edition_id: edition.id,
					search_term: search_term || undefined
				})
			: ([] as CandidateArticle[])
	);

	// --- Sources for manual article ---
	const sources = $derived(await get_user_sources());

	// --- Per-article forms ---
	const article_forms = $derived.by(() => {
		if (!edition) return [];
		const rows: Array<{
			article: EditionArticleRow;
			edit: ReturnType<typeof update_edition_article.for>;
			remove_form: ReturnType<typeof remove_edition_article.for>;
			move_up: ReturnType<typeof reorder_edition_articles.for>;
			move_down: ReturnType<typeof reorder_edition_articles.for>;
		}> = [];
		for (const article of edition.articles) {
			const edit = update_edition_article.for(article.id);
			untrack(() => {
				edit.fields.set({
					edition_article_id: article.id,
					edition_id: edition.id,
					custom_title: article.custom_title ?? undefined,
					custom_summary: article.custom_summary ?? undefined,
					custom_category: article.custom_category ?? undefined,
					section: article.section ?? undefined,
					reason: article.reason ?? undefined
				});
			});
			const remove_form = remove_edition_article.for(article.id);
			const move_up = reorder_edition_articles.for(`${article.id}-up`);
			const move_down = reorder_edition_articles.for(`${article.id}-down`);
			rows.push({ article, edit, remove_form, move_up, move_down });
		}
		return rows;
	});
</script>

<svelte:head>
	<title>{edition ? (edition.title ?? formatted_date) : 'Edition Not Found'} — Editorial</title>
</svelte:head>

<div class="page-container">
	<header class="page-header">
		<Masthead
			top_left="Edition"
			top_right={formatted_date}
			title={edition ? (edition.title ?? 'Untitled Edition') : 'Edition Not Found'}
		/>
		<div class="header-nav">
			<span class="edition-status">
				{#if edition}
					{edition.status === 'published' ? 'Published' : 'Draft'}
					&middot;
					{edition.articles.length}
					{edition.articles.length === 1 ? 'Article' : 'Articles'}
				{:else}
					No Edition
				{/if}
			</span>
			<NavLink href="/editions">&larr; All Editions</NavLink>
		</div>
	</header>

	<SectionRule />

	{#if !edition}
		<main class="content">
			<div class="empty-state">
				<p>No edition found for {formatted_date}.</p>
				<p>
					<NavLink href="/editions">Return to editions</NavLink>
				</p>
			</div>
		</main>
	{:else}
		<main class="content">
			<!-- ═══ 1. Edition Metadata ═══ -->
			<section class="edition-meta">
				<h2 class="section-label">Edition Details</h2>

				{#if meta_form}
					<form
						class="meta-form"
						{...meta_form.enhance(async ({ data, submit }) => {
							await submit().updates(
								get_edition_editor(date_param).withOverride((prev) => {
									if (!prev) return prev;
									return {
										...prev,
										title: data.title ?? prev.title,
										summary: data.summary ?? prev.summary,
										status: data.status ?? prev.status
									};
								})
							);
						})}
					>
						<input {...meta_form.fields.edition_id.as('hidden', edition.id)} />

						<div class="meta-date">
							<span class="field-label">Date</span>
							<span class="date-display">{formatted_date}</span>
						</div>

						<div class="meta-fields">
							<div class="field">
								<label class="field-label" for="meta-title">Title</label>
								<input
									{...meta_form.fields.title.as('text')}
									id="meta-title"
									placeholder="Edition headline"
								/>
								<FieldErrors field={meta_form.fields.title} />
							</div>

							<div class="field">
								<label class="field-label" for="meta-status">Status</label>
								<select {...meta_form.fields.status.as('text')} id="meta-status">
									<option value="draft">Draft</option>
									<option value="published">Published</option>
								</select>
								<FieldErrors field={meta_form.fields.status} />
							</div>
						</div>

						<div class="field field-full">
							<label class="field-label" for="meta-summary">Summary</label>
							<textarea
								{...meta_form.fields.summary.as('text')}
								id="meta-summary"
								rows="3"
								placeholder="A brief description of this edition"
							></textarea>
							<FieldErrors field={meta_form.fields.summary} />
						</div>

						<div class="meta-actions">
							<Button variant="primary" type="submit">Save Details</Button>
						</div>
					</form>
				{/if}
			</section>

			<SectionRule />

			<!-- ═══ 2. Article Search / Add ═══ -->
			<section class="article-search">
				<h2 class="section-label">Add Articles</h2>

				<form class="search-form" method="get">
					<div class="search-field field">
						<label class="field-label" for="search-articles">Search Articles</label>
						<div class="search-input-row">
							<input
								type="text"
								id="search-articles"
								name="q"
								bind:value={search_term}
								placeholder="Search by title, URL, or category"
							/>
							<Button type="submit">Search</Button>
						</div>
					</div>
				</form>

				{#if candidates.length > 0}
					<ul class="candidate-list">
						{#each candidates as candidate (candidate.id)}
							{@const add_form = add_edition_article.for(candidate.id)}
							<li class="candidate-card">
								<div class="candidate-info">
									<h3 class="candidate-title">{candidate.title}</h3>
									<div class="candidate-meta">
										{#if candidate.source_name}
											<span class="candidate-source">{candidate.source_name}</span>
										{/if}
										{#if candidate.category}
											<span class="candidate-category">{candidate.category}</span>
										{/if}
										{#if candidate.published_at}
											<time class="candidate-date">
												{new Date(candidate.published_at).toLocaleDateString('en-US', {
													month: 'short',
													day: 'numeric'
												})}
											</time>
										{/if}
									</div>
									{#if candidate.summary}
										<p class="candidate-summary">{candidate.summary}</p>
									{/if}
								</div>
								<form
									class="candidate-action"
									{...add_form.enhance(async ({ submit }) => {
										await submit().updates(
											get_edition_editor(date_param).withOverride((prev) => {
												if (!prev) return prev;
												return {
													...prev,
													articles: [
														...prev.articles,
														{
															id: crypto.randomUUID(),
															article_id: candidate.id,
															position: prev.articles.length,
															section: null,
															reason: null,
															custom_title: null,
															custom_summary: null,
															custom_category: null,
															canonical_url: candidate.canonical_url,
															title: candidate.title,
															summary: candidate.summary,
															category: candidate.category,
															published_at: candidate.published_at
														}
													]
												};
											}),
											search_editable_articles({
												edition_id: edition.id,
												search_term: search_term || undefined
											})
										);
									})}
								>
									<input {...add_form.fields.edition_id.as('hidden', edition.id)} />
									<input {...add_form.fields.article_id.as('hidden', candidate.id)} />
									<Button type="submit">Add</Button>
								</form>
							</li>
						{/each}
					</ul>
				{:else if search_term}
					<p class="empty-state">No articles found matching "{search_term}".</p>
				{/if}
			</section>

			<SectionRule />

			<!-- ═══ 3. Manual Article Creation ═══ -->
			<details class="manual-article">
				<summary class="collapsible-toggle">
					<h2 class="section-label">Manual Article Form</h2>
					<span class="toggle-indicator"></span>
				</summary>

				<form
					class="manual-form"
					{...create_manual_article.enhance(async ({ form, submit }) => {
						await submit().updates(
							get_edition_editor(date_param).withOverride((prev) => prev),
							search_editable_articles({
								edition_id: edition.id,
								search_term: search_term || undefined
							})
						);
						form.reset();
					})}
				>
					<input {...create_manual_article.fields.edition_id.as('hidden', edition.id)} />

					<div class="manual-fields">
						<div class="field">
							<label class="field-label" for="manual-source">Source</label>
							<select {...create_manual_article.fields.source_id.as('text')} id="manual-source">
								<option value="">Select a source</option>
								{#each sources as src (src.source_id)}
									<option value={src.source_id}>{src.display_name}</option>
								{/each}
							</select>
							<FieldErrors field={create_manual_article.fields.source_id} />
						</div>

						<div class="field">
							<label class="field-label" for="manual-url">URL</label>
							<input
								{...create_manual_article.fields.canonical_url.as('url')}
								id="manual-url"
								placeholder="https://example.com/article"
							/>
							<FieldErrors field={create_manual_article.fields.canonical_url} />
						</div>

						<div class="field">
							<label class="field-label" for="manual-title">Title</label>
							<input
								{...create_manual_article.fields.title.as('text')}
								id="manual-title"
								placeholder="Article title"
							/>
							<FieldErrors field={create_manual_article.fields.title} />
						</div>

						<div class="field">
							<label class="field-label" for="manual-category"
								>Category <span class="optional">(optional)</span></label
							>
							<input
								{...create_manual_article.fields.category.as('text')}
								id="manual-category"
								placeholder="e.g. Technology, Politics"
							/>
							<FieldErrors field={create_manual_article.fields.category} />
						</div>

						<div class="field">
							<label class="field-label" for="manual-published"
								>Published At <span class="optional">(optional)</span></label
							>
							<input
								{...create_manual_article.fields.published_at.as('text')}
								type="datetime-local"
								id="manual-published"
							/>
							<FieldErrors field={create_manual_article.fields.published_at} />
						</div>
					</div>

					<div class="field field-full">
						<label class="field-label" for="manual-summary"
							>Summary <span class="optional">(optional)</span></label
						>
						<textarea
							{...create_manual_article.fields.summary.as('text')}
							id="manual-summary"
							rows="2"
							placeholder="Brief summary"
						></textarea>
						<FieldErrors field={create_manual_article.fields.summary} />
					</div>

					<div class="manual-actions">
						<Button variant="primary" type="submit">Create Article</Button>
					</div>
				</form>
			</details>

			<SectionRule />

			<!-- ═══ 4. Current Articles ═══ -->
			<section class="current-articles">
				<h2 class="section-label">
					Article Lineup
					<span class="article-count">({edition.articles.length})</span>
				</h2>

				{#if edition.articles.length === 0}
					<p class="empty-state">No articles in this edition yet. Search and add articles above.</p>
				{:else}
					<ol class="article-lineup">
						{#each article_forms as { article, edit, remove_form, move_up, move_down } (article.id)}
							<li class="article-card">
								<div class="article-header">
									<div class="article-identity">
										<span class="position-number">{article.position + 1}</span>
										<h3 class="article-title">
											{article.custom_title ?? article.title}
										</h3>
									</div>

									<div class="reorder-buttons">
										<form
											{...move_up.enhance(async ({ submit }) => {
												if (article.position <= 0) return;
												await submit().updates(
													get_edition_editor(date_param).withOverride((prev) => {
														if (!prev) return prev;
														const articles = [...prev.articles];
														const idx = articles.findIndex((a) => a.id === article.id);
														if (idx > 0) {
															const temp = articles[idx - 1];
															articles[idx - 1] = {
																...articles[idx],
																position: articles[idx - 1].position
															};
															articles[idx] = { ...temp, position: articles[idx].position };
															articles.sort((a, b) => a.position - b.position);
														}
														return { ...prev, articles };
													})
												);
											})}
										>
											<input {...move_up.fields.edition_id.as('hidden', edition.id)} />
											<input {...move_up.fields.edition_article_id.as('hidden', article.id)} />
											<input
												{...move_up.fields.new_position.as('number')}
												type="hidden"
												value={article.position - 1}
											/>
											<Button variant="ghost" type="submit" disabled={article.position <= 0}>
												Up
											</Button>
										</form>
										<form
											{...move_down.enhance(async ({ submit }) => {
												if (article.position >= edition.articles.length - 1) return;
												await submit().updates(
													get_edition_editor(date_param).withOverride((prev) => {
														if (!prev) return prev;
														const articles = [...prev.articles];
														const idx = articles.findIndex((a) => a.id === article.id);
														if (idx < articles.length - 1) {
															const temp = articles[idx + 1];
															articles[idx + 1] = {
																...articles[idx],
																position: articles[idx + 1].position
															};
															articles[idx] = { ...temp, position: articles[idx].position };
															articles.sort((a, b) => a.position - b.position);
														}
														return { ...prev, articles };
													})
												);
											})}
										>
											<input {...move_down.fields.edition_id.as('hidden', edition.id)} />
											<input {...move_down.fields.edition_article_id.as('hidden', article.id)} />
											<input
												{...move_down.fields.new_position.as('number')}
												type="hidden"
												value={article.position + 1}
											/>
											<Button
												variant="ghost"
												type="submit"
												disabled={article.position >= edition.articles.length - 1}
											>
												Down
											</Button>
										</form>
									</div>
								</div>

								<div class="article-meta-row">
									{#if article.custom_category ?? article.category}
										<span class="article-category"
											>{article.custom_category ?? article.category}</span
										>
									{/if}
									{#if article.published_at}
										<time class="article-date">
											{new Date(article.published_at).toLocaleDateString('en-US', {
												month: 'short',
												day: 'numeric',
												year: 'numeric'
											})}
										</time>
									{/if}
									{#if article.section}
										<span class="article-section">{article.section}</span>
									{/if}
								</div>

								{#if article.custom_summary ?? article.summary}
									<p class="article-summary">
										{article.custom_summary ?? article.summary}
									</p>
								{/if}

								<details class="article-overrides">
									<summary class="collapsible-toggle">
										<span class="toggle-text">Edit Overrides</span>
										<span class="toggle-indicator"></span>
									</summary>

									<form
										class="article-edit-form"
										{...edit.enhance(async ({ data, submit }) => {
											await submit().updates(
												get_edition_editor(date_param).withOverride((prev) => {
													if (!prev) return prev;
													return {
														...prev,
														articles: prev.articles.map((a) =>
															a.id === article.id
																? {
																		...a,
																		custom_title: data.custom_title ?? a.custom_title,
																		custom_summary: data.custom_summary ?? a.custom_summary,
																		custom_category: data.custom_category ?? a.custom_category,
																		section: data.section ?? a.section,
																		reason: data.reason ?? a.reason
																	}
																: a
														)
													};
												})
											);
										})}
									>
										<input {...edit.fields.edition_article_id.as('hidden', article.id)} />
										<input {...edit.fields.edition_id.as('hidden', edition.id)} />

										<div class="edit-fields">
											<div class="field">
												<label class="field-label" for="ct-{article.id}">Title</label>
												<input
													{...edit.fields.custom_title.as('text')}
													id="ct-{article.id}"
													placeholder={article.title ?? 'Title'}
												/>
												<FieldErrors field={edit.fields.custom_title} />
											</div>

											<div class="field">
												<label class="field-label" for="cc-{article.id}">Category</label>
												<input
													{...edit.fields.custom_category.as('text')}
													id="cc-{article.id}"
													placeholder={article.category ?? 'Category'}
												/>
												<FieldErrors field={edit.fields.custom_category} />
											</div>

											<div class="field">
												<label class="field-label" for="sec-{article.id}">Section</label>
												<input
													{...edit.fields.section.as('text')}
													id="sec-{article.id}"
													placeholder="e.g. Front Page, Opinion"
												/>
												<FieldErrors field={edit.fields.section} />
											</div>

											<div class="field">
												<label class="field-label" for="rsn-{article.id}">Reason</label>
												<input
													{...edit.fields.reason.as('text')}
													id="rsn-{article.id}"
													placeholder="Why this article?"
												/>
												<FieldErrors field={edit.fields.reason} />
											</div>
										</div>

										<div class="field field-full">
											<label class="field-label" for="cs-{article.id}">Summary</label>
											<textarea
												{...edit.fields.custom_summary.as('text')}
												id="cs-{article.id}"
												rows="2"
												placeholder={article.summary ?? 'Summary'}
											></textarea>
											<FieldErrors field={edit.fields.custom_summary} />
										</div>

										<div class="edit-actions">
											<Button type="submit">Save Overrides</Button>
										</div>
									</form>
								</details>

								<form
									class="remove-form"
									{...remove_form.enhance(async ({ submit }) => {
										await submit().updates(
											get_edition_editor(date_param).withOverride((prev) => {
												if (!prev) return prev;
												return {
													...prev,
													articles: prev.articles
														.filter((a) => a.id !== article.id)
														.map((a, i) => ({ ...a, position: i }))
												};
											}),
											search_editable_articles({
												edition_id: edition.id,
												search_term: search_term || undefined
											})
										);
									})}
								>
									<input {...remove_form.fields.edition_article_id.as('hidden', article.id)} />
									<input {...remove_form.fields.edition_id.as('hidden', edition.id)} />
									<Button variant="ghost" type="submit">Remove</Button>
								</form>
							</li>
						{/each}
					</ol>
				{/if}
			</section>
		</main>
	{/if}

	<SectionRule />

	<PageFooter
		tagline="Shape the narrative."
		subtitle="Curate, order, and refine the articles that define this edition."
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

	.edition-status {
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

	/* --- Section headings --- */
	.section-label {
		font-family: var(--font-display);
		font-size: var(--text-lg);
		font-weight: 400;
		font-style: italic;
		font-variation-settings: 'opsz' 32;
		color: var(--fg);
		margin-bottom: var(--s-4);
	}

	.article-count {
		font-family: var(--font-body);
		font-size: var(--text-sm);
		font-style: normal;
		color: var(--muted);
		letter-spacing: var(--tracking-3);
	}

	/* --- Fields (shared) --- */
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

	.field input:not([type='hidden']):not([type='checkbox']),
	.field textarea,
	.field select {
		width: 100%;
		padding: var(--s-3);
		background: var(--paper);
		color: var(--fg);
		border: var(--s-px) solid var(--rule);
		border-radius: 0;
		font-family: var(--font-body);
		font-size: var(--text-base);
		transition: border-color 0.3s ease;
	}

	.field textarea {
		resize: vertical;
	}

	.field select {
		appearance: none;
		cursor: pointer;
	}

	.field input::placeholder,
	.field textarea::placeholder {
		color: var(--muted);
		opacity: 0.5;
	}

	.field input:focus,
	.field textarea:focus,
	.field select:focus {
		outline: none;
		border-color: var(--fg);
	}

	.empty-state {
		font-family: var(--font-body);
		font-size: var(--text-base);
		color: var(--muted);
		font-style: italic;
		padding: var(--s-5) 0;
		text-align: center;
	}

	/* --- 1. Edition Meta --- */
	.edition-meta {
		padding: var(--s-5) 0;
	}

	.meta-date {
		display: flex;
		align-items: baseline;
		gap: var(--s-3);
		margin-bottom: var(--s-4);
	}

	.date-display {
		font-family: var(--font-display);
		font-size: var(--text-md);
		font-weight: 400;
		font-variation-settings: 'opsz' 24;
		color: var(--fg);
	}

	.meta-fields {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: var(--s-4);
	}

	.field-full {
		margin-top: var(--s-4);
	}

	.meta-actions {
		margin-top: var(--s-4);
		& :global(button) {
			display: block;
			margin-left: auto;
		}
	}

	/* --- 2. Article Search --- */
	.article-search {
		padding: var(--s-5) 0;
	}

	.search-form {
		margin-bottom: var(--s-4);
	}

	.search-input-row {
		display: flex;
		gap: var(--s-2);
	}

	.search-input-row input {
		flex: 1;
	}

	.candidate-list {
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: var(--s-3);
	}

	.candidate-card {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: var(--s-4);
		background: var(--paper);
		border: var(--s-px) solid var(--rule);
		padding: var(--s-4);
		transition: border-color 0.2s ease;
	}

	.candidate-card:hover {
		border-color: var(--fg);
	}

	.candidate-info {
		min-width: 0;
		flex: 1;
	}

	.candidate-title {
		font-family: var(--font-display);
		font-size: var(--text-md);
		font-weight: 500;
		font-variation-settings: 'opsz' 24;
		line-height: 1.3;
	}

	.candidate-meta {
		display: flex;
		flex-wrap: wrap;
		gap: var(--s-2);
		margin-top: var(--s-1);
	}

	.candidate-source,
	.candidate-category,
	.candidate-date {
		font-size: var(--text-xs);
		font-weight: 400;
		letter-spacing: var(--tracking-3);
		text-transform: uppercase;
		color: var(--muted);
	}

	.candidate-summary {
		font-size: var(--text-sm);
		color: var(--muted);
		margin-top: var(--s-2);
		line-height: 1.5;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.candidate-action {
		flex-shrink: 0;
		align-self: center;
	}

	/* --- 3. Manual Article --- */
	.manual-article {
		padding: var(--s-5) 0;
	}

	.collapsible-toggle {
		display: flex;
		justify-content: space-between;
		align-items: center;
		width: 100%;
		cursor: pointer;
		padding: 0;
		color: var(--fg);
		list-style: none;
	}

	.collapsible-toggle::-webkit-details-marker {
		display: none;
	}

	.collapsible-toggle .section-label {
		margin-bottom: 0;
	}

	.toggle-indicator {
		font-family: var(--font-display);
		font-size: var(--text-xl);
		color: var(--muted);
		line-height: 1;
	}

	.toggle-indicator::before {
		content: '+';
	}

	.manual-article[open] .toggle-indicator::before {
		content: '\2212';
	}

	.manual-form {
		margin-top: var(--s-4);
	}

	.manual-fields {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: var(--s-4);
	}

	.manual-actions {
		margin-top: var(--s-4);
		& :global(button) {
			display: block;
			margin-left: auto;
		}
	}

	/* --- 4. Current Articles --- */
	.current-articles {
		padding: var(--s-5) 0;
	}

	.article-lineup {
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: var(--s-4);
	}

	.article-card {
		background: var(--paper);
		border: var(--s-px) solid var(--rule);
		padding: var(--s-4);
		transition: border-color 0.2s ease;
		position: relative;
	}

	.article-card:hover {
		border-color: var(--fg);
	}

	/* --- Article header (like source-header) --- */
	.article-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: var(--s-3);
	}

	.article-identity {
		display: flex;
		align-items: baseline;
		gap: var(--s-2);
		min-width: 0;
	}

	.position-number {
		font-family: var(--font-display);
		font-size: var(--text-md);
		font-weight: 300;
		font-variation-settings: 'opsz' 24;
		color: var(--muted);
		line-height: 1;
		flex-shrink: 0;
	}

	.article-title {
		font-family: var(--font-display);
		font-size: var(--text-md);
		font-weight: 500;
		font-variation-settings: 'opsz' 24;
		line-height: 1.3;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.reorder-buttons {
		display: flex;
		gap: var(--s-1);
		flex-shrink: 0;
	}

	.reorder-buttons :global(.btn-ghost) {
		font-size: var(--text-xs);
		color: var(--muted);
		transition: color 0.2s ease;
	}

	.reorder-buttons :global(.btn-ghost:hover) {
		color: var(--fg);
	}

	.reorder-buttons :global(.btn-ghost:disabled) {
		opacity: 0.3;
		cursor: default;
	}

	/* --- Article metadata & summary --- */
	.article-meta-row {
		display: flex;
		flex-wrap: wrap;
		gap: var(--s-2);
		margin-top: var(--s-1);
	}

	.article-category,
	.article-date,
	.article-section {
		font-size: var(--text-xs);
		font-weight: 400;
		letter-spacing: var(--tracking-3);
		text-transform: uppercase;
		color: var(--muted);
	}

	.article-summary {
		font-size: var(--text-sm);
		color: var(--muted);
		margin-top: var(--s-2);
		line-height: 1.5;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	/* --- Article overrides (collapsible edit form) --- */
	.article-overrides {
		margin-top: var(--s-4);
		border-top: var(--s-px) solid var(--rule);
		padding-top: var(--s-3);
	}

	.article-overrides .collapsible-toggle {
		font-size: var(--text-xs);
		letter-spacing: var(--tracking-4);
		text-transform: uppercase;
	}

	.toggle-text {
		font-size: var(--text-xs);
		font-weight: 500;
		letter-spacing: var(--tracking-4);
		text-transform: uppercase;
		color: var(--muted);
	}

	.article-overrides .toggle-indicator {
		font-size: var(--text-md);
	}

	.article-overrides[open] .toggle-indicator::before {
		content: '\2212';
	}

	.article-edit-form {
		display: flex;
		flex-direction: column;
		gap: var(--s-4);
		margin-top: var(--s-4);
	}

	.edit-fields {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: var(--s-4);
	}

	.edit-actions {
		display: flex;
		gap: var(--s-2);
		justify-content: flex-end;
		margin-top: var(--s-3);
	}

	.remove-form {
		margin-top: var(--s-3);
	}

	.remove-form :global(.btn-ghost) {
		color: var(--muted);
		font-size: var(--text-xs);
		transition: color 0.2s ease;
	}

	.remove-form :global(.btn-ghost:hover) {
		color: var(--accent);
	}

	/* --- Responsive --- */
	@media (max-width: 640px) {
		.meta-fields {
			grid-template-columns: 1fr;
		}

		.manual-fields {
			grid-template-columns: 1fr;
		}

		.edit-fields {
			grid-template-columns: 1fr;
		}

		.article-header {
			flex-direction: column;
			gap: var(--s-2);
		}

		.reorder-buttons {
			align-self: flex-end;
		}

		.candidate-card {
			flex-direction: column;
			gap: var(--s-3);
		}

		.candidate-action {
			align-self: flex-end;
		}

		.header-nav {
			flex-direction: column;
			gap: var(--s-2);
			align-items: flex-start;
		}
	}
</style>
