<script lang="ts">
	import { get_user, login_or_register, sign_in_google } from '$lib/auth.remote';
	import FieldErrors from '$lib/components/FieldErrors.svelte';
	import SectionRule from '$lib/components/SectionRule.svelte';

	await get_user(true);
</script>

<svelte:head>
	<title>Your News — Sign In</title>
</svelte:head>

<div class="login-page">
	<header class="login-header">
		<div class="header-top">
			<span class="header-label">Members Only</span>
			<span class="header-rule"></span>
			<span class="header-label">Est. 2026</span>
		</div>
		<div class="masthead">
			<h1>Your News</h1>
		</div>
		<p class="tagline">All the news that fits your interests</p>
	</header>

	<div class="form-section">
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
				<button class="btn-primary" {...login_or_register.fields.action.as('submit', 'login')}>
					Sign In
				</button>
				<button class="btn-secondary" {...login_or_register.fields.action.as('submit', 'register')}>
					Create Account
				</button>
			</div>
		</form>

		<SectionRule />

		<form {...sign_in_google}>
			<button class="btn-google" type="submit"> Continue with Google </button>
		</form>

		<p class="footer-tagline">Quality journalism, curated for you.</p>
	</div>
</div>

<style>
	.login-page {
		max-width: 480px;
		margin: 0 auto;
		padding: 4rem 1.5rem 3rem;
	}

	.login-header {
		animation: fade-down 0.7s ease-out;
	}

	.header-top {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-bottom: 1.5rem;
	}

	.header-label {
		font-size: 0.72rem;
		font-weight: 500;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--muted);
		white-space: nowrap;
	}

	.header-rule {
		flex: 1;
		height: 1px;
		background: var(--rule);
	}

	.masthead {
		text-align: center;
		padding: 2rem 0 1rem;
	}

	.masthead h1 {
		font-family: var(--font-display);
		font-size: clamp(3rem, 10vw, 5rem);
		font-weight: 300;
		font-style: italic;
		font-variation-settings: 'opsz' 72;
		line-height: 1;
		letter-spacing: -0.03em;
		color: var(--fg);
	}

	.tagline {
		text-align: center;
		font-family: var(--font-display);
		font-size: 1.1rem;
		font-style: italic;
		color: var(--muted);
		margin-bottom: 2.5rem;
	}

	.form-section {
		animation: fade-up 0.6s ease-out 0.3s both;
	}

	.field {
		margin-bottom: 1.25rem;
	}

	.field-label {
		display: block;
		font-size: 0.72rem;
		font-weight: 500;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--muted);
		margin-bottom: 0.4rem;
	}

	.optional {
		text-transform: none;
		letter-spacing: normal;
		font-weight: 400;
	}

	.field input {
		width: 100%;
		padding: 0.75rem;
		background: var(--paper);
		color: var(--fg);
		border: 1px solid var(--rule);
		border-radius: 0;
		font-family: var(--font-body);
		font-size: 0.95rem;
		transition: border-color 0.3s ease;
	}

	.field input::placeholder {
		color: var(--muted);
		opacity: 0.5;
	}

	.field input:focus {
		outline: none;
		border-color: var(--fg);
	}

	.error-message {
		color: var(--accent);
		text-align: center;
		font-size: 0.85rem;
		margin-bottom: 1.25rem;
	}

	.button-row {
		display: flex;
		gap: 0.75rem;
		margin-top: 0.5rem;
	}

	.btn-primary,
	.btn-secondary,
	.btn-google {
		font-family: var(--font-body);
		font-size: 0.72rem;
		font-weight: 500;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		padding: 0.85rem 1rem;
		border-radius: 0;
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.btn-primary {
		flex: 1;
		background: var(--fg);
		color: var(--bg);
		border: 1px solid var(--fg);
	}

	.btn-primary:hover {
		background: var(--accent);
		border-color: var(--accent);
	}

	.btn-secondary {
		flex: 1;
		background: var(--paper);
		color: var(--muted);
		border: 1px solid var(--rule);
	}

	.btn-secondary:hover {
		color: var(--fg);
		border-color: var(--fg);
	}

	.btn-google {
		width: 100%;
		background: var(--paper);
		color: var(--muted);
		border: 1px solid var(--rule);
	}

	.btn-google:hover {
		color: var(--fg);
		border-color: var(--fg);
	}

	.footer-tagline {
		text-align: center;
		font-size: 0.8rem;
		color: var(--muted);
		margin-top: 2rem;
	}

	.loading-state {
		display: flex;
		justify-content: center;
		align-items: center;
		min-height: 60vh;
		color: var(--muted);
		font-family: var(--font-display);
		font-style: italic;
		font-size: 1.1rem;
	}
</style>
