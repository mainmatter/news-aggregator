<script lang="ts">
	import { get_user, login_or_register, sign_in_google } from '$lib/auth.remote';
	import Button from '$lib/components/Button.svelte';
	import FieldErrors from '$lib/components/FieldErrors.svelte';
	import SectionRule from '$lib/components/SectionRule.svelte';

	await get_user(true);
</script>

<svelte:head>
	<title>Your News — Sign In</title>
</svelte:head>

<div class="login-page">
	<section class="intro-panel">
		<header class="login-header">
			<h1>Your News</h1>
			<p class="tagline">A focused daily digest from the sources you choose.</p>
		</header>
	</section>

	<div class="form-section">
		<p class="form-kicker">Sign in or register</p>
		<form {...login_or_register}>
			<div class="field">
				<label class="field-label" for="email">Email Address</label>
				<input
					{...login_or_register.fields.email.as('email')}
					id="email"
					placeholder="reader@example.com"
				/>
				<FieldErrors field={login_or_register.fields.email} />
			</div>

			<div class="field">
				<label class="field-label" for="password">Password</label>
				<input
					{...login_or_register.fields._password.as('password')}
					id="password"
					placeholder="••••••••"
				/>
				<FieldErrors field={login_or_register.fields._password} />
			</div>

			<div class="field">
				<label class="field-label" for="name"
					>Name <span class="optional">(for registration)</span></label
				>
				<input {...login_or_register.fields.name.as('text')} id="name" placeholder="Jane Doe" />
				<FieldErrors field={login_or_register.fields.name} />
			</div>

			{#if login_or_register.result?.error}
				<p class="error-message">{login_or_register.result.error}</p>
			{/if}

			<div class="button-row">
				<Button variant="primary" {...login_or_register.fields.action.as('submit', 'login')}>
					Sign In
				</Button>
				<Button variant="secondary" {...login_or_register.fields.action.as('submit', 'register')}>
					Create Account
				</Button>
			</div>
		</form>

		<SectionRule />

		<form {...sign_in_google}>
			<Button class="google" type="submit">Continue with Google</Button>
		</form>

		<p class="footer-tagline">Reading first. Controls second.</p>
	</div>
</div>

<style>
	h1 {
		font-family: var(--font-display);
		font-size: var(--text-fluid-7xl);
		font-weight: 800;
		line-height: 0.88;
		letter-spacing: -0.06em;
		color: var(--bg);
		text-wrap: balance;
	}
	.login-page {
		display: grid;
		grid-template-columns: minmax(0, 1.15fr) minmax(22rem, 0.85fr);
		gap: clamp(var(--s-6), 8vw, var(--s-12));
		align-items: center;
		max-width: var(--page-max-width);
		min-height: 100vh;
		margin: 0 auto;
		padding: clamp(var(--s-8), 8vw, var(--s-12)) clamp(var(--s-4), 5vw, var(--s-8));
	}

	.intro-panel {
		align-self: stretch;
		display: grid;
		align-items: center;
		background: var(--ink-panel);
		color: var(--ink-panel-fg);
		padding: clamp(var(--s-5), 6vw, var(--s-10));
	}

	.intro-panel :global(.masthead h1),
	.intro-panel :global(.header-label) {
		color: var(--ink-panel-fg);
	}

	.intro-panel :global(.header-rule) {
		background: color-mix(in oklch, var(--ink-panel-fg) 35%, transparent);
	}

	.login-header {
		animation: fade-down 0.55s var(--ease-out-expo);
	}

	.tagline {
		max-width: 34ch;
		font-size: var(--text-xl);
		font-weight: 650;
		line-height: 1.25;
		color: color-mix(in oklch, var(--ink-panel-fg) 78%, transparent);
	}

	.form-section {
		padding: var(--s-6) 0;
		animation: fade-up 0.5s var(--ease-out-expo) 0.2s both;
	}

	.form-kicker {
		margin-bottom: var(--s-5);
		font-size: var(--text-xs);
		font-weight: 800;
		letter-spacing: var(--tracking-6);
		text-transform: uppercase;
		color: var(--accent);
	}

	.field {
		margin-bottom: var(--s-4);
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

	.optional {
		text-transform: none;
		letter-spacing: normal;
		font-weight: 400;
	}

	.field input {
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

	.field input::placeholder {
		color: var(--muted);
		opacity: 0.5;
	}

	.field input:focus {
		outline: none;
		border-bottom-color: var(--accent);
	}

	.error-message {
		color: var(--status-error);
		font-size: var(--text-sm);
		margin-bottom: var(--s-4);
	}

	.button-row {
		display: flex;
		gap: var(--s-3);
		margin-top: var(--s-2);
	}

	.footer-tagline {
		font-size: var(--text-sm);
		color: var(--muted);
		margin-top: var(--s-6);
	}

	@media (max-width: 840px) {
		.login-page {
			grid-template-columns: 1fr;
			align-items: start;
			min-height: auto;
		}

		.intro-panel {
			min-height: 60vh;
		}
	}

	form :global(.google) {
		width: 100%;
		padding: var(--s-3) var(--s-4);
		letter-spacing: var(--tracking-5);
		justify-content: center;
	}
</style>
