<script lang="ts">
	import { resolve } from '$app/paths';
	import Button from '$lib/components/Button.svelte';
	import FieldErrors from '$lib/components/FieldErrors.svelte';
	import FormActions from '$lib/components/FormActions.svelte';
	import FormField from '$lib/components/FormField.svelte';
	import Masthead from '$lib/components/Masthead.svelte';
	import NavLink from '$lib/components/NavLink.svelte';
	import PageFooter from '$lib/components/PageFooter.svelte';
	import SectionRule from '$lib/components/SectionRule.svelte';
	import { get_user_settings, update_user_settings } from '$lib/settings.remote';

	const user_settings = $derived(await get_user_settings());
	const settings_form = update_user_settings;
	let settings_save_button: Button | undefined = $state();
</script>

<svelte:head>
	<title>Settings — Editorial</title>
</svelte:head>

<header class="page-header">
	<Masthead>
		{#snippet top_left()}Settings{/snippet}
		{#snippet top_center()}Preferences{/snippet}
		{#snippet top_right()}Manage{/snippet}
		{#snippet title()}Settings{/snippet}

		<NavLink href="/news">&larr; Back to News</NavLink>
	</Masthead>
</header>

<main class="content">
	<section class="settings">
		<h2 class="section-label">Article Selection</h2>

		<form
			class="settings-form"
			{...settings_form.enhance(async ({ data, submit }) => {
				try {
					const article_selection_prompt = data.article_selection_prompt?.trim() || null;

					await submit().updates(
						get_user_settings().withOverride((settings) => ({
							...settings,
							article_selection_prompt
						}))
					);

					settings_save_button?.show_feedback('success');
				} catch (error) {
					settings_save_button?.show_feedback('error');
					throw error;
				}
			})}
		>
			<FormField
				label="Article selection guidance"
				for="article-selection-guidance"
				description="Specify what you would like to see in your daily edition. Tell the AI what you are interested in. This affects article choice only, not summary tone/formatting."
			>
				<textarea
					{...settings_form.fields.article_selection_prompt.as(
						'text',
						user_settings.article_selection_prompt ?? ''
					)}
					id="article-selection-guidance"
					placeholder="Prefer investigations, local accountability reporting, and labor coverage..."
				></textarea>
				<FieldErrors field={settings_form.fields.article_selection_prompt} />
			</FormField>

			<FormActions>
				<Button bind:this={settings_save_button} type="submit">Save</Button>
			</FormActions>
		</form>
	</section>

	<SectionRule />

	<section class="settings-links" aria-labelledby="management-links">
		<h2 class="section-label" id="management-links">Management</h2>
		<div class="link-grid">
			<a class="settings-link" href={resolve('/sources')}>
				<span class="link-label">Sources</span>
				<span class="link-copy">Add, edit, and manage feed sources.</span>
			</a>
			<a class="settings-link" href={resolve('/editions')}>
				<span class="link-label">Editions</span>
				<span class="link-copy">Create, organize, and publish daily editions.</span>
			</a>
		</div>
	</section>
</main>

<PageFooter
	tagline="Tune the relay."
	subtitle="Set editorial preferences and manage the data behind your editions."
/>

<style>
	.page-header {
		animation: fade-down 0.55s var(--ease-out-expo);
	}

	.content {
		animation: fade-up 0.5s var(--ease-out-expo) both;
		animation-delay: 0.2s;
	}

	.section-label {
		font-family: var(--font-display);
		font-size: var(--text-lg);
		font-weight: 850;
		letter-spacing: -0.02em;
		color: var(--fg);
		margin-bottom: var(--s-4);
	}

	.settings,
	.settings-links {
		padding: var(--s-5) 0;
	}

	#article-selection-guidance {
		min-height: calc(var(--s-10) * 2);
	}

	.link-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: var(--s-4);
	}

	.settings-link {
		display: flex;
		flex-direction: column;
		gap: var(--s-2);
		padding: var(--s-5);
		background: var(--paper-raised);
		border: var(--s-2px) solid var(--rule);
		color: var(--fg);
		text-decoration: none;
		transition:
			border-color 0.2s var(--ease-out-expo),
			background 0.2s var(--ease-out-expo),
			transform 0.2s var(--ease-out-expo);
	}

	.settings-link:hover {
		background: var(--paper);
		border-color: var(--rule-strong);
		transform: translateY(calc(-1 * var(--s-1)));
	}

	.link-label {
		font-family: var(--font-display);
		font-size: var(--text-lg);
		font-weight: 850;
		letter-spacing: -0.02em;
	}

	.link-copy {
		font-size: var(--text-sm);
		color: var(--muted);
	}

	@media (max-width: 640px) {
		.link-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
