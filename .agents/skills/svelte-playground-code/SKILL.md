---
name: svelte-playground-code
description: A skill to run whenever the user asks you to fetch some code from a svelte playground link. It will instruct on how to fetch it.
---

If you receive a link that looks like this

https://svelte.dev/playground/{id}?version={version}

you can fetch the content of the playground by fetching

https://svelte.dev/playground/api/{id}.json

If there is an hash in the link it might mean that the user has changed the code before sending the link please ask the user to save the playground so that you can fetch the latest version of the code.
