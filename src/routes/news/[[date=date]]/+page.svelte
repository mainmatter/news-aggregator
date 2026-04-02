<script lang="ts">
	import {
		get_edition_editor,
		get_editions,
		start_daily_edition_generation,
		type EditionEditor,
		type EditionSummary
	} from '$lib/editions.remote';
	import EditorialDesign from '$lib/EditorialDesign.svelte';
	import EditionsList from '$lib/components/EditionsList.svelte';

	function get_default_edition_date() {
		return new Date().toISOString().slice(0, 10);
	}

	let { params } = $props();

	const editions = $derived(await get_editions());
	const selected_date = $derived(params.date || get_default_edition_date());
	const selected_edition = $derived(await get_edition_editor(selected_date));

	const show_generation_cta = $derived(
		!selected_edition ||
			(selected_edition.status !== 'generating' && selected_edition.articles.length === 0)
	);

	function upsert_generating_edition(
		current: EditionSummary[],
		edition_date: string,
		edition: EditionEditor | null
	) {
		const optimistic_entry: EditionSummary = {
			id: edition?.id ?? crypto.randomUUID(),
			edition_date,
			status: 'generating',
			title: edition?.title ?? null,
			summary: edition?.summary ?? null,
			article_count: 0,
			generated_at: edition?.generated_at ?? null,
			created_at: new Date(),
			updated_at: new Date()
		};

		const next = current.some((item) => item.edition_date === edition_date)
			? current.map((item) =>
					item.edition_date === edition_date ? { ...item, ...optimistic_entry } : item
				)
			: [...current, optimistic_entry];

		return next.toSorted((a, b) => b.edition_date.localeCompare(a.edition_date));
	}

	function get_generation_panel_copy(edition: EditionEditor | null) {
		if (!edition) {
			return {
				title: "Generate today's edition",
				body: 'Create a fresh daily edition from your saved sources and move it into the editorial workflow.'
			};
		}

		if (edition.status === 'failed') {
			return {
				title: 'Try this edition again',
				body: "The last generation attempt did not complete. Start a new pass to refill this edition with today's stories."
			};
		}

		return {
			title: 'Generate this edition',
			body: "This edition is still empty. Start generation to collect and draft the day's stories."
		};
	}
</script>

<svelte:head>
	<title>Your News — Editorial</title>
</svelte:head>

<div class="page-wrapper">
	<EditionsList {editions} />

	{#if show_generation_cta}
		{@const panel_copy = get_generation_panel_copy(selected_edition)}
		<section class="generation-panel" aria-label="Daily edition generation">
			<div class="generation-copy">
				<p class="generation-eyebrow">Daily Edition</p>
				<h2>{panel_copy.title}</h2>
				<p>{panel_copy.body}</p>
			</div>

			<form
				class="generation-form"
				{...start_daily_edition_generation.enhance(async ({ data, submit }) => {
					const edition_date = data.edition_date;
					const current_edition = selected_edition;

					await submit().updates(
						get_editions().withOverride((current) =>
							upsert_generating_edition(current, edition_date, current_edition)
						),
						get_edition_editor(edition_date).withOverride((current) => ({
							id: current?.id ?? current_edition?.id ?? crypto.randomUUID(),
							edition_date,
							status: 'generating',
							title: current?.title ?? current_edition?.title ?? null,
							summary: current?.summary ?? current_edition?.summary ?? null,
							generated_at: current?.generated_at ?? current_edition?.generated_at ?? null,
							articles: []
						}))
					);
				})}
			>
				<input
					{...start_daily_edition_generation.fields.edition_date.as('hidden', selected_date)}
				/>
				<button type="submit" class="generation-button">Start generation</button>
			</form>
		</section>
	{/if}
</div>
<EditorialDesign date={selected_date} />

<style>
	.page-wrapper {
		position: relative;
		z-index: 1;
		max-width: var(--page-max-width);
		margin: 0 auto;
		padding: var(--s-5) clamp(var(--s-4), 4vw, var(--s-6)) 0;
	}

	.generation-panel {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: var(--s-4);
		margin-top: var(--s-4);
		padding: var(--s-4);
		border: var(--s-px) solid var(--rule);
		background: var(--paper);
	}

	.generation-copy {
		display: grid;
		gap: var(--s-2);
		max-width: 42rem;
	}

	.generation-eyebrow {
		font-size: var(--text-xs);
		font-weight: 500;
		letter-spacing: var(--tracking-5);
		text-transform: uppercase;
		color: var(--muted);
	}

	.generation-copy h2 {
		font-family: var(--font-display);
		font-size: var(--text-xl);
		font-weight: 400;
		line-height: 1.2;
	}

	.generation-copy p {
		font-size: var(--text-base);
		color: var(--muted);
	}

	.generation-form {
		flex-shrink: 0;
	}

	.generation-button {
		padding: var(--s-3) var(--s-4);
		border: var(--s-px) solid var(--accent);
		background: var(--accent);
		color: var(--bg);
		font-family: var(--font-body);
		font-size: var(--text-xs);
		font-weight: 600;
		letter-spacing: var(--tracking-5);
		text-transform: uppercase;
		cursor: pointer;
		transition:
			background 0.2s ease,
			color 0.2s ease,
			border-color 0.2s ease;
	}

	.generation-button:hover {
		background: transparent;
		color: var(--accent);
	}

	@media (max-width: 640px) {
		.generation-panel {
			flex-direction: column;
			align-items: flex-start;
		}

		.generation-form {
			width: 100%;
		}

		.generation-button {
			width: 100%;
		}
	}
</style>
