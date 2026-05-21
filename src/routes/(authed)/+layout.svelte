<script lang="ts">
	import ModeToggle from '$lib/components/ModeToggle.svelte';
	import { sign_out } from '$lib/auth.remote';

	let { children } = $props();
</script>

<header class="authed-nav">
	<div class="authed-nav-inner" aria-label="Global navigation">
		<a class="brand" href="/news">Day Relay</a>
		<div class="nav-actions">
			<ModeToggle variant="text" />
			<span class="separator" aria-hidden="true">|</span>
			<form {...sign_out}>
				<button class="sign-out-btn" type="submit">Sign out</button>
			</form>
		</div>
	</div>
</header>

<div class="page-container">
	{@render children()}
</div>

<style>
	.authed-nav {
		position: sticky;
		top: 0;
		z-index: 1000;
		border-bottom: var(--s-px) solid var(--rule);
		background: color-mix(in oklch, var(--bg) 92%, transparent);
		backdrop-filter: blur(var(--s-3));
	}

	.authed-nav-inner {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--s-4);
		max-width: var(--page-max-width);
		margin: 0 auto;
		padding: var(--s-3) clamp(var(--s-4), 4vw, var(--s-6));
	}

	.brand {
		font-family: var(--font-display);
		font-size: var(--text-lg);
		font-weight: 850;
		line-height: 1;
		letter-spacing: -0.03em;
		color: var(--fg);
		text-decoration: none;
	}

	.nav-actions {
		display: flex;
		align-items: center;
		gap: var(--s-2);
		font-size: var(--text-base);
	}

	.separator {
		color: var(--muted);
	}

	.sign-out-btn {
		font-family: var(--font-body);
		font-size: var(--text-base);
		font-weight: 500;
		line-height: 1.6;
		padding: 0;
		background: transparent;
		color: var(--fg);
		border: 0;
		cursor: pointer;
		transition: color 0.2s var(--ease-out-expo);
	}

	.sign-out-btn:hover {
		color: var(--accent);
	}

	.page-container {
		position: relative;
		z-index: 1;
		max-width: var(--page-max-width);
		margin: 0 auto;
		padding: clamp(var(--s-4), 3vw, var(--s-6)) clamp(var(--s-4), 4vw, var(--s-6))
			clamp(var(--s-6), 5vw, var(--s-8));
	}

	@media (max-width: 34rem) {
		.authed-nav-inner {
			align-items: flex-start;
			flex-direction: column;
		}
	}
</style>
