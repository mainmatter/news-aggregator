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
		--btn-bg: var(--paper);
		--btn-color: var(--muted);
		--btn-border-color: var(--rule);
		--btn-hover-bg: var(--btn-bg);
		--btn-hover-color: var(--fg);
		--btn-hover-border-color: var(--fg);
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
		font-weight: 500;
		letter-spacing: var(--tracking-3);
		text-transform: uppercase;
		padding: var(--s-1) var(--s-3);
		background:
			linear-gradient(var(--btn-bg, var(--paper))) padding-box,
			conic-gradient(var(--c) var(--feedback-angle), var(--btn-border-color) 0deg) border-box;
		color: var(--btn-color);
		border: var(--s-px) solid transparent;
		border-radius: 0;
		cursor: pointer;
		transition:
			--feedback-angle 0.5s,
			--feedback-color 0.5s,
			background 0.3s ease,
			color 0.3s ease;
	}

	button:hover {
		--btn-bg: var(--btn-hover-bg);
		--btn-color: var(--btn-hover-color);
	}

	.btn-ghost {
		--btn-bg: transparent;
		--btn-color: var(--muted);
		--btn-border-color: transparent;
		--btn-hover-bg: transparent;
		--btn-hover-color: var(--fg);
		--btn-hover-border-color: transparent;
		padding: 0;
	}

	.btn-primary {
		--btn-bg: var(--fg);
		--btn-color: var(--bg);
		--btn-border-color: var(--fg);
		--btn-hover-bg: var(--accent);
		--btn-hover-color: var(--bg);
		--btn-hover-border-color: var(--accent);
		flex: 1;
		letter-spacing: var(--tracking-5);
		padding: var(--s-3) var(--s-4);
	}

	.btn-secondary {
		--btn-bg: var(--paper);
		--btn-color: var(--muted);
		--btn-border-color: var(--rule);
		--btn-hover-bg: var(--paper);
		--btn-hover-color: var(--fg);
		--btn-hover-border-color: var(--fg);
		flex: 1;
		letter-spacing: var(--tracking-5);
		padding: var(--s-3) var(--s-4);
	}

	button[data-feedback='success'] {
		--feedback-color: var(--status-success);
		--feedback-angle: 360deg;
		color: var(--status-success);
	}

	button[data-feedback='error'] {
		--feedback-color: var(--status-error);
		--feedback-angle: 360deg;
		color: var(--status-error);
	}
</style>
