---
description: Run the Designer agent on an existing PRD to produce the UI/UX spec
argument-hint: <feature-name>
---

Invoke the `designer` subagent for feature `$ARGUMENTS`.

The subagent must:

1. Read `tasks/prd-$ARGUMENTS.md`
2. Use the Svelte MCP to ground component recommendations
3. Write the design spec to `tasks/design-$ARGUMENTS.md`

If `tasks/prd-$ARGUMENTS.md` does not exist, stop and tell me to run `/prd` first.
