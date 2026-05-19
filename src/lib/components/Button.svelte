<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	type FeedbackStatus = 'success' | 'error';
	type FeedbackState = 'idle' | FeedbackStatus;

	type Props = {
		children: Snippet;
		variant?: 'default' | 'ghost' | 'primary' | 'secondary';
	} & HTMLButtonAttributes;

	let { children, variant = 'default', ...rest }: Props = $props();

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
</script>

<button class={['btn', `btn-${variant}`]} data-feedback={feedback_state} {...rest}>
	{@render children()}
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
		font-family: var(--font-body);
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
		transition:
			--feedback-angle 0.5s var(--ease-out-expo),
			--feedback-color 0.5s var(--ease-out-expo),
			background 0.2s var(--ease-out-expo),
			color 0.2s var(--ease-out-expo),
			border-color 0.2s var(--ease-out-expo),
			transform 0.2s var(--ease-out-expo);
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
</style>
