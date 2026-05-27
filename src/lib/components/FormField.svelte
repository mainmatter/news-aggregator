<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
		label: string;
		for?: string;
		optional?: boolean;
		label_note?: string;
		description?: string;
		errors?: Snippet;
		full?: boolean;
	}

	let {
		children,
		label,
		for: control_id,
		optional = false,
		label_note,
		description,
		errors,
		full = false
	}: Props = $props();
</script>

<div class={['form-field', full && 'form-field-full']}>
	<label class="form-field-label" for={control_id}>
		{label}
		{#if optional || label_note}
			<span class="form-field-optional">{label_note ?? '(optional)'}</span>
		{/if}
	</label>

	{#if description}
		<p class="form-field-description">{description}</p>
	{/if}

	{@render children()}
	{@render errors?.()}
</div>

<style>
	.form-field {
		display: flex;
		flex-direction: column;
	}

	.form-field-full {
		margin-top: var(--s-4);
	}

	.form-field-label {
		display: block;
		font-size: var(--text-xs);
		font-weight: 500;
		letter-spacing: var(--tracking-5);
		text-transform: uppercase;
		color: var(--muted);
		margin-bottom: var(--s-1);
	}

	.form-field-optional {
		text-transform: none;
		letter-spacing: normal;
		font-weight: 400;
	}

	.form-field-description {
		font-size: var(--text-sm);
		color: var(--muted);
		margin-bottom: var(--s-3);
	}

	.form-field :global(input:not([type='hidden']):not([type='checkbox'])),
	.form-field :global(select),
	.form-field :global(textarea) {
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

	.form-field :global(textarea) {
		resize: vertical;
	}

	.form-field :global(select) {
		appearance: none;
		cursor: pointer;
	}

	.form-field :global(input::placeholder),
	.form-field :global(textarea::placeholder) {
		color: var(--muted);
		opacity: 0.5;
	}

	.form-field :global(input:focus),
	.form-field :global(select:focus),
	.form-field :global(textarea:focus) {
		outline: none;
		border-bottom-color: var(--accent);
	}
</style>
