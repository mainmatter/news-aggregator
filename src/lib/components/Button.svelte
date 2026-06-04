<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	type FeedbackStatus = 'success' | 'error';
	type FeedbackState = 'idle' | FeedbackStatus;
	const MIN_LOADING_MS = 300;

	type Props = {
		children: Snippet;
		loading?: boolean;
		variant?: 'default' | 'ghost' | 'primary' | 'secondary';
	} & HTMLButtonAttributes;

	let { children, loading = false, variant = 'default', onclick, ...rest }: Props = $props();

	let feedback_state: FeedbackState = $state('idle');
	let feedback_timeout_id: ReturnType<typeof setTimeout> | undefined;

	function clear_feedback_timeout() {
		if (feedback_timeout_id !== undefined) {
			clearTimeout(feedback_timeout_id);
			feedback_timeout_id = undefined;
		}
	}

	export function show_feedback(status: FeedbackStatus, duration_ms = 1200) {
		clear_feedback_timeout();
		feedback_state = status;

		feedback_timeout_id = setTimeout(() => {
			feedback_state = 'idle';
			feedback_timeout_id = undefined;
		}, duration_ms);
	}

	$effect(() => clear_feedback_timeout);

	let start: number;
	async function delayed(loading: boolean) {
		if (loading) {
			start = Date.now();
			return Promise.resolve(loading);
		}
		return new Promise((r) =>
			setTimeout(r, Date.now() - start < MIN_LOADING_MS ? MIN_LOADING_MS : 0, loading)
		);
	}

	const delayed_loading = $derived(await delayed(loading));
</script>

<button
	class={['btn', `btn-${variant}`]}
	data-feedback={feedback_state}
	aria-disabled={delayed_loading ? 'true' : undefined}
	aria-busy={delayed_loading ? 'true' : undefined}
	onclick={(e) => {
		if (delayed_loading) {
			e.preventDefault();
			e.stopPropagation();
			return;
		}
		onclick?.(e);
	}}
	{...rest}
>
	<span class="btn-content">
		{@render children()}
	</span>
	{#if delayed_loading}
		<span class="loading-overlay" aria-hidden="true">
			<span class="loading-spinner"></span>
		</span>
	{/if}
</button>

<style>
	@property --feedback-angle {
		syntax: '<angle>';
		inherits: false;
		initial-value: 0deg;
	}

	@property --feedback-color {
		syntax: '<color>';
		inherits: false;
		initial-value: transparent;
	}

	button {
		--btn-bg: transparent;
		--btn-color: var(--fg);
		--btn-border-color: var(--fg);
		--btn-hover-bg: var(--btn-bg);
		--btn-hover-color: var(--accent);
		--btn-hover-border-color: var(--accent);
		--feedback-color: var(--btn-border-color);
		--feedback-angle: 0deg;
		--c: var(--feedback-color);

		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: var(--s-1);
		position: relative;
		font-family: var(--font-display);
		font-size: var(--text-xs);
		font-weight: 750;
		letter-spacing: var(--tracking-4);
		text-transform: uppercase;
		padding: var(--s-2) var(--s-4);
		background: var(--btn-bg);
		color: var(--btn-color);
		border: var(--s-px) solid var(--btn-border-color);
		border-radius: 0;
		cursor: pointer;
		overflow: hidden;
		transition:
			--feedback-angle 0.5s var(--ease-out-expo),
			--feedback-color 0.5s var(--ease-out-expo),
			background 0.2s var(--ease-out-expo),
			color 0.2s var(--ease-out-expo),
			border-color 0.2s var(--ease-out-expo),
			transform 0.2s var(--ease-out-expo);
	}

	.btn-content {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: inherit;
	}

	.loading-overlay {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--btn-color);
		pointer-events: none;
	}

	.loading-spinner {
		width: var(--s-4);
		aspect-ratio: 1;
		border: var(--s-2px) solid color-mix(in oklch, currentColor 28%, transparent);
		border-top-color: currentColor;
		border-radius: 50%;
		animation: btn-spin 0.8s linear infinite;
	}

	@keyframes btn-spin {
		to {
			transform: rotate(360deg);
		}
	}

	button:focus-visible {
		outline-offset: var(--s-2px);
	}

	button:hover {
		--btn-bg: var(--btn-hover-bg);
		--btn-color: var(--btn-hover-color);
		--btn-border-color: var(--btn-hover-border-color);
		transform: translateY(calc(-1 * var(--s-px)));
	}

	.btn-ghost {
		--btn-bg: transparent;
		--btn-color: var(--fg);
		--btn-border-color: transparent;
		--btn-hover-bg: transparent;
		--btn-hover-color: var(--accent);
		--btn-hover-border-color: transparent;
		padding: 0;
	}

	.btn-primary {
		--btn-bg: var(--accent);
		--btn-color: var(--accent-contrast);
		--btn-border-color: var(--accent);
		--btn-hover-bg: var(--fg);
		--btn-hover-color: var(--bg);
		--btn-hover-border-color: var(--fg);
		flex: 1;
		letter-spacing: var(--tracking-5);
		padding: var(--s-3) var(--s-4);
	}

	.btn-secondary {
		--btn-bg: transparent;
		--btn-color: var(--fg);
		--btn-border-color: var(--fg);
		--btn-hover-bg: var(--support-soft);
		--btn-hover-color: var(--accent);
		--btn-hover-border-color: var(--accent);
		flex: 1;
		letter-spacing: var(--tracking-5);
		padding: var(--s-3) var(--s-4);
	}

	button[data-feedback='success'] {
		--feedback-color: var(--status-success);
		--feedback-angle: 360deg;
		color: var(--status-success);
		border-color: var(--status-success);
	}

	button[data-feedback='error'] {
		--feedback-color: var(--status-error);
		--feedback-angle: 360deg;
		color: var(--status-error);
		border-color: var(--status-error);
	}

	[aria-disabled='true'] {
		cursor: not-allowed;
		opacity: 0.6;
		.btn-content {
			opacity: 0;
		}
	}
</style>
