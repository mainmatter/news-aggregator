# DayRelay

> [!NOTE]
> DayRelay was written and is maintained by [Mainmatter](https://mainmatter.com) and contributors.
> We offer consulting, training, and team augmentation for Svelte – check out our [website](https://mainmatter.com/svelte-consulting/) to learn more!

DayRelay is a personalized news aggregation app for collecting, organizing, and reading updates from the sources you choose. It generates focused daily editions, keeps source-level run history, and gives each user control over the feeds and prompts that shape their digest.

Visit [dayrelay.ai](https://dayrelay.ai) to learn more.

## About the Project

This project was created for a YouTube series about agentic engineering with Svelte. The series uses DayRelay as a practical example of building a real application with modern SvelteKit, AI-assisted development, durable workflows, sandboxed execution, and production-oriented engineering practices.

Watch the playlist: [Agentic Engineering with Svelte](#).

WHile DayRelay was built almost completely using AI, it was not Vibe Coded. We've reviewed the code thoroughly and set-up all the systems to keep the agent in check.

## Architecture

DayRelay is a SvelteKit application backed by a SQLite-compatible database through Drizzle ORM.

- The UI is built with Svelte 5 and SvelteKit.
- Authenticated app pages live under `src/routes/(authed)`, including news, editions, sources, source run history, and settings.
- Server interactions use SvelteKit remote functions.
- Authentication is handled by Better Auth, with email/password and Google sign-in support.
- The durable generation workflow lives in `src/workflows/generate_daily_edition`. It fans out active sources, launches sandboxed source runners, waits for webhook results, records per-source success or failure, and persists the final edition.
- Source runners execute in sandbox backends under `src/workflows/generate_daily_edition/sandbox`, with support for local Docker and Vercel Sandbox execution.
- Observability is wired through Sentry on both client and server paths.
- Tests cover components, server behavior, workflows, and end-to-end flows with Vitest and Playwright.

## Copyright

Copyright &copy; 2026 Mainmatter GmbH (https://mainmatter.com).
