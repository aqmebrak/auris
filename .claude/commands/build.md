---
description: Build a feature using the fullstack developer subagent (single API call, replaces ralph.sh)
argument-hint: <feature-name>
---

Invoke the `fullstack` subagent for feature `$ARGUMENTS`.

If `tasks/prd-$ARGUMENTS.md` does not exist, stop and tell the user to run `/prd $ARGUMENTS` first.
If `tasks/design-$ARGUMENTS.md` does not exist, stop and tell the user to run `/design $ARGUMENTS` first.

The subagent must:

1. Read `tasks/prd-$ARGUMENTS.md` and `tasks/design-$ARGUMENTS.md`
2. Read `scripts/ralph/prd.json` for the ordered story list (skip stories where `passes: true`)
3. Read existing `src/` structure before writing anything
4. Implement each story in priority order — one story at a time
5. After each story: run `pnpm check` and `pnpm lint`, fix all errors, commit with `feat: [US-XXX] - <title>`, mark `passes: true` in `scripts/ralph/prd.json`
6. After all stories pass: run `pnpm test:e2e` and report results
