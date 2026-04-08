## When editing css files and styles

Whenever you are editing CSS/styles in a svelte component use the `design-system-tokens` skill to know how to properly use this project design system.

## Login Credentials

When using the chrome MCP to visit the website you will need to be authenticated. Every authenticated route will redirect back to `/` in case you are not authenticated.

You can login with email `test@test.com` and password `Passw0rd!` if you can't login with these credentials feel free to register with them and then login.

## Creating drizzle migrations

While working if a migration needs to be created you should use `pnpm db:generate` and `pnpm db:migrate` rather than handcrafting a migration file from scratch.

## Using the chrome MCP

When using the Chrome MCP to validate your work don't launch a new dev server...the dev server is likely already running on http://localhost:5173...if it's not just ask the developer to run it.
