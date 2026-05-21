<script lang="ts">
	import ModeToggle from '$lib/components/ModeToggle.svelte';
	import { sign_out } from '$lib/auth.remote';

	let { children } = $props();
</script>

<header class="authed-nav">
	<div class="authed-nav-inner" aria-label="Global navigation">
		<a class="brand" href="/news">Day Relay</a>
		<div class="nav-actions">
			<ModeToggle />
			<a class="settings-link" href="/settings" aria-label="Settings">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					width="20"
					viewBox="0 0 24 24"
					stroke-width="1.5"
					stroke="currentColor"
					aria-hidden="true"
					data-slot="icon"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"
					/>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
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
