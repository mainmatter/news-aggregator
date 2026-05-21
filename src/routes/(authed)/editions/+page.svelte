<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import FieldErrors from '$lib/components/FieldErrors.svelte';
	import Masthead from '$lib/components/Masthead.svelte';
	import NavLink from '$lib/components/NavLink.svelte';
	import PageFooter from '$lib/components/PageFooter.svelte';
	import SectionRule from '$lib/components/SectionRule.svelte';
	import { create_edition, delete_edition, get_editions } from '$lib/editions.remote';

	const editions = $derived(await get_editions());

	function format_date(date_str: string) {
		const [year, month, day] = date_str.split('-').map(Number);
		const date = new Date(year, month - 1, day);
		return date.toLocaleDateString('en-US', {
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	function get_today() {
		const now = new Date();
		const year = now.getFullYear();
		const month = String(now.getMonth() + 1).padStart(2, '0');
		const day = String(now.getDate()).padStart(2, '0');
		return `${year}-${month}-${day}`;
	}

	function get_status_class(status: string) {
		switch (status) {
			case 'published':
				return 'status-published';
			case 'generating':
				return 'status-generating';
			case 'failed':
				return 'status-failed';
			default:
				return 'status-draft';
		}
	}

	function format_status(status: string) {
		switch (status) {
			case 'generating':
				return 'Generating';
			case 'failed':
				return 'Failed';
			case 'published':
				return 'Published';
			default:
				return 'Draft';
		}
	}

	function format_generated_at(value: Date | string | null) {
		if (!value) {
			return null;
		}

		const generated_at = value instanceof Date ? value : new Date(value);

		if (Number.isNaN(generated_at.getTime())) {
			return null;
		}

		return generated_at.toLocaleString('en-US', {
			month: 'short',
			day: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		});
	}
</script>

<svelte:head>
	<title>Editions — Editorial</title>
</svelte:head>

<Masthead
	top_left="Editions"
	top_center={`${editions.length} ${editions.length === 1 ? 'Edition' : 'Editions'}`}
	top_right="Manage"
	title="Your Editions"
>
	<NavLink href="/news">&larr; Back to News</NavLink>
</Masthead>

<main class="content">
	<section class="edition-list">
		<h2 class="section-label">Existing Editions</h2>

		{#if editions.length === 0}
			<p class="empty-state">No editions yet. Use the form below to create your first one.</p>
		{:else}
			<ul class="editions">
				{#each editions as edition (edition.id)}
					{@const delete_form = delete_edition.for(edition.id)}
					<li class="edition-card">
						<div class="edition-header">
							<div class="edition-identity">
								<h3 class="edition-date">{format_date(edition.edition_date)}</h3>
								<span class={['status-badge', get_status_class(edition.status)]}>
									{format_status(edition.status)}
								</span>
							</div>

							<div class="edition-actions">
								<form
									class="delete-form"
									{...delete_form.enhance(async ({ submit }) => {
										if (
											!confirm(
												`Delete the edition for ${format_date(edition.edition_date)}? This cannot be undone.`
											)
										) {
											return;
										}

										await submit().updates(
											get_editions().withOverride((current) =>
												current.filter((candidate) => candidate.id !== edition.id)
											)
										);
									})}
								>
									<input {...delete_form.fields.edition_id.as('hidden', edition.id)} />
									<Button
										variant="ghost"
										type="submit"
										class="delete-button"
										aria-label={`Delete edition for ${format_date(edition.edition_date)}`}
									>
										Delete
									</Button>
									{#each delete_form.fields.allIssues() as issue, index (index)}
										<p class="delete-error" role="alert">{issue.message}</p>
									{/each}
								</form>
								<NavLink href="/editions/{edition.edition_date}">Edit &rarr;</NavLink>
							</div>
						</div>

						{#if edition.title}
							<p class="edition-title">{edition.title}</p>
						{/if}

						{#if edition.summary}
							<p class="edition-summary">{edition.summary}</p>
						{/if}

						<div class="edition-meta">
							<span class="article-count">
								{edition.article_count}
								{edition.article_count === 1 ? 'Article' : 'Articles'}
							</span>
							{#if format_generated_at(edition.generated_at)}
								<span class="generated-at">
									Generated {format_generated_at(edition.generated_at)}
								</span>
							{/if}
						</div>
					</li>
				{/each}
			</ul>
		{/if}
	</section>

	<SectionRule />

	<section class="add-edition">
		<h2 class="section-label">Create an Edition</h2>

		<form
			class="add-form"
			{...create_edition.enhance(async ({ form, data, submit }) => {
				const optimistic_entry = {
					id: crypto.randomUUID(),
					edition_date: data.edition_date,
					status: data.status ?? 'draft',
					title: data.title ?? null,
					summary: data.summary ?? null,
					article_count: 0,
					generated_at: null,
					created_at: new Date(),
					updated_at: new Date()
				};

				await submit().updates(
					get_editions().withOverride((current) => [optimistic_entry, ...current])
				);

				form.reset();
			})}
		>
			<div class="add-form-fields">
				<div class="field">
					<label class="field-label" for="new-date">Edition Date</label>
					<input
						{...create_edition.fields.edition_date.as('date')}
						id="new-date"
						value={get_today()}
					/>
					<FieldErrors field={create_edition.fields.edition_date} />
				</div>

				<div class="field">
					<label class="field-label" for="new-title"
						>Title <span class="optional">(optional)</span></label
					>
					<input
						{...create_edition.fields.title.as('text')}
						id="new-title"
						placeholder="Morning Briefing"
					/>
					<FieldErrors field={create_edition.fields.title} />
				</div>

				<div class="field">
					<label class="field-label" for="new-status">Status</label>
					<select {...create_edition.fields.status.as('select')} id="new-status">
						<option value="draft">Draft</option>
						<option value="published">Published</option>
					</select>
					<FieldErrors field={create_edition.fields.status} />
				</div>
			</div>

			<div class="field field-full">
				<label class="field-label" for="new-summary"
					>Summary <span class="optional">(optional)</span></label
				>
				<textarea
					{...create_edition.fields.summary.as('text')}
					id="new-summary"
					placeholder="A brief overview of today's edition..."
					rows="3"
				></textarea>
				<FieldErrors field={create_edition.fields.summary} />
			</div>

			<div class="add-form-actions">
				<Button variant="primary" type="submit">Create Edition</Button>
			</div>
		</form>
	</section>
</main>

<PageFooter
	tagline="Shape the narrative."
	subtitle="Create, organize, and publish your daily editions."
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

	/* --- Create edition form --- */
	.add-edition {
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

	.field-full {
		margin-top: var(--s-4);
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

	.field input:not([type='hidden']),
	.field select,
	.field textarea {
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

	.field textarea {
		resize: vertical;
	}

	.field input::placeholder,
	.field textarea::placeholder {
		color: var(--muted);
		opacity: 0.5;
	}

	.field input:focus,
	.field select:focus,
	.field textarea:focus {
		outline: none;
		border-bottom-color: var(--accent);
	}

	/* --- Edition list --- */
	.edition-list {
		padding: var(--s-5) 0;
	}

	.editions {
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

	/* --- Edition card --- */
	.edition-card {
		background: var(--paper-raised);
		border: var(--s-2px) solid var(--rule);
		padding: var(--s-5);
		transition:
			border-color 0.2s var(--ease-out-expo),
			background 0.2s var(--ease-out-expo);
	}

	.edition-card:hover {
		background: var(--paper);
		border-color: var(--rule-strong);
	}

	.edition-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: var(--s-3);
	}

	.edition-actions {
		display: flex;
		align-items: center;
		gap: var(--s-3);
		flex-shrink: 0;
		flex-wrap: wrap;
	}

	.edition-identity {
		display: flex;
		align-items: baseline;
		gap: var(--s-2);
		min-width: 0;
		flex-wrap: wrap;
	}

	.edition-date {
		font-family: var(--font-display);
		font-size: var(--text-md);
		font-weight: 850;
		letter-spacing: -0.02em;
		line-height: 1.3;
	}

	/* --- Status badges --- */
	.status-badge {
		font-size: var(--text-xs);
		font-weight: 500;
		letter-spacing: var(--tracking-3);
		text-transform: uppercase;
		padding: var(--s-1) var(--s-2);
		line-height: 1;
		flex-shrink: 0;
	}

	.status-draft {
		color: var(--muted);
		border: var(--s-px) solid var(--rule-strong);
	}

	.status-published {
		color: var(--accent);
		border: var(--s-px) solid var(--accent);
	}

	.status-generating {
		color: var(--fg);
		border: var(--s-px) solid var(--fg);
		background: var(--accent-wash);
	}

	.status-failed {
		color: var(--accent);
		border: var(--s-px) solid var(--status-error);
		background: var(--accent-wash);
	}

	.delete-form {
		display: flex;
		align-items: center;
		gap: var(--s-1);
	}

	.delete-form :global(.delete-button) {
		color: var(--muted);
		transition: color 0.2s var(--ease-out-expo);
	}

	.delete-form :global(.delete-button:hover) {
		color: var(--accent);
	}

	.delete-form :global(.delete-button:disabled) {
		opacity: 0.4;
		cursor: default;
		color: var(--muted);
	}

	.delete-error {
		color: var(--accent);
		font-size: var(--text-sm);
	}

	/* --- Edition details --- */
	.edition-title {
		font-family: var(--font-display);
		font-size: var(--text-base);
		font-weight: 750;
		color: var(--fg);
		margin-top: var(--s-2);
	}

	.edition-summary {
		font-family: var(--font-body);
		font-size: var(--text-sm);
		color: var(--muted);
		margin-top: var(--s-1);
		line-height: 1.5;
	}

	.edition-meta {
		margin-top: var(--s-3);
		padding-top: var(--s-3);
		border-top: var(--s-px) solid var(--rule);
	}

	.article-count {
		font-size: var(--text-xs);
		font-weight: 400;
		letter-spacing: var(--tracking-4);
		text-transform: uppercase;
		color: var(--muted);
	}

	.generated-at {
		font-size: var(--text-xs);
		color: var(--muted);
	}

	/* --- Responsive --- */
	@media (max-width: 640px) {
		.add-form-fields {
			grid-template-columns: 1fr;
		}

		.edition-header {
			flex-direction: column;
			gap: var(--s-2);
		}
	}
</style>
