<script lang="ts">
	import { get_user, login_or_register, sign_in_google } from '$lib/auth.remote';
	import Button from '$lib/components/Button.svelte';
	import FieldErrors from '$lib/components/FieldErrors.svelte';
	import Masthead from '$lib/components/Masthead.svelte';
	import SectionRule from '$lib/components/SectionRule.svelte';

	await get_user(true);
</script>

<svelte:head>
	<title>Your News — Sign In</title>
</svelte:head>

<div class="login-page">
	<header class="login-header">
		<Masthead top_left="Members Only" top_right="Est. 2026" title="Your News" />
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

	.footer-tagline {
		text-align: center;
		font-size: 0.8rem;
		color: var(--muted);
		margin-top: 2rem;
	}

	form :global(.google) {
		width: 100%;
		padding: 0.85rem 1rem;
		letter-spacing: 0.1em;
		justify-content: center;
	}
</style>
