---
name: design-system-tokens
description: Use this skill when editing styles in this repo. It explains the shared design tokens in `src/routes/layout.css` and directs agents to replace hard-coded magic numbers with design-system values before introducing new ones.
---

This repository already has a shared editorial design system in `src/routes/layout.css`. When you touch styles, treat that file as the source of truth.

## What To Read First

- Read `src/routes/layout.css` before making any styling change.
- Learn the existing token families and reuse them everywhere possible.
- Inspect the files you plan to edit plus nearby components to understand current conventions before changing values.

## Available Tokens

Read the file to find out about the available tokens.

## Core Rule

When you find a magic number that matches the design system, replace it with the corresponding token instead of leaving a raw literal in place.

Examples:

- Replace raw spacing like `16px`, `1rem`, `0.5rem`, `2rem`, `1px` with the matching `--s-*` token.
- Replace raw text sizes like `0.75rem` or `1.2rem` with the matching `--text-*` token.
- Replace hard-coded shared colors and font families with the existing color and font tokens.

## How To Explore For Magic Numbers

Search the relevant codebase areas before editing:

- Check `*.svelte` style blocks and `*.css` files for raw `px`, `rem`, `em`, hex colors, `rgb(...)`, `rgba(...)`, and hard-coded font family names.
- Prioritize repeated values and values that clearly map to existing tokens.
- Review nearby files for existing token usage so your edits follow the local pattern.

## When Not To Force A Token

Do not replace values blindly.

- Keep values that are structural or semantic rather than design-token candidates, such as `%`, viewport units, `fr`, `auto`, `minmax(...)`, or one-off transforms that do not correspond to the token scale.
- Keep responsive `clamp(...)` expressions when they encode layout behavior, but swap any inner literals to tokens if the tokenized version is clearer and equivalent.

## If A Needed Token Does Not Exist

If a repeated or important design value does not have a good token yet:

- Add the new token in `src/routes/layout.css` instead of introducing another raw magic number in a component.
- Follow the existing naming scheme and scale.
- Prefer extending the system only for values that are clearly reusable, not for every one-off measurement. But prefer existing tokens over one-off literals to make the design feel coherent instead of having a lot of unique values.

## Expected Workflow

1. Read `src/routes/layout.css`.
2. Explore the target files and nearby components for raw style literals.
3. Replace matching magic numbers with existing design tokens.
4. If necessary, add a missing reusable token to `src/routes/layout.css`, then use it.
5. Keep the final result visually equivalent unless the task explicitly asks for a redesign.

The goal is consistency, reuse, and a tighter design system.
