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
			<a class="settings-link" href="/settings" aria-label="Settings">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="15"
					height="15"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="1.5"
					stroke-linecap="round"
					stroke-linejoin="round"
					aria-hidden="true"
				>
					<circle cx="12" cy="12" r="3" />
					<path
						d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 8.92 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.64.18 1.6.77 1.6 2v2c0 1.23-.96 1.82-1.6 2z"
					/>
				</svg>
			</a>
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

	.settings-link {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0;
		color: var(--fg);
		line-height: 1;
		text-decoration: none;
		transition: color 0.2s var(--ease-out-expo);
	}

	.settings-link:hover {
		color: var(--accent);
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
