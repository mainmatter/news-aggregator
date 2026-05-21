<script lang="ts">
	import { resolve } from '$app/paths';
	import Button from '$lib/components/Button.svelte';
	import FieldErrors from '$lib/components/FieldErrors.svelte';
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
	<Masthead top_left="Settings" top_center="Preferences" top_right="Manage" title="Settings">
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
			<div class="field">
				<label class="field-label" for="article-selection-guidance">
					Article selection guidance
				</label>
				<p class="settings-copy">
					Specify what you would like to see in your daily edition. Tell the AI what you are
					interested in. This affects article choice only, not summary tone/formatting.
				</p>
				<textarea
					{...settings_form.fields.article_selection_prompt.as(
						'text',
						user_settings.article_selection_prompt ?? ''
					)}
					id="article-selection-guidance"
					placeholder="Prefer investigations, local accountability reporting, and labor coverage..."
				></textarea>
				<FieldErrors field={settings_form.fields.article_selection_prompt} />
			</div>

			<div class="settings-actions">
				<Button bind:this={settings_save_button} type="submit">Save</Button>
			</div>
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

	.settings-copy {
		font-size: var(--text-sm);
		color: var(--muted);
		margin-bottom: var(--s-3);
	}

	.settings-actions {
		margin-top: var(--s-4);

		& :global(button) {
			display: block;
			margin-left: auto;
		}
	}

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

	.field textarea {
		width: 100%;
		min-height: calc(var(--s-10) * 2);
		padding: var(--s-3) 0;
		background: transparent;
		color: var(--fg);
		border: 0;
		border-bottom: var(--s-2px) solid var(--rule-strong);
		border-radius: 0;
		font-family: var(--font-body);
		font-size: var(--text-base);
		resize: vertical;
		transition: border-color 0.2s var(--ease-out-expo);
	}

	.field textarea::placeholder {
		color: var(--muted);
		opacity: 0.5;
	}

	.field textarea:focus {
		outline: none;
		border-bottom-color: var(--accent);
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
