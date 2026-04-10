---
description: Run the QA agent on a feature Ralph has finished building
argument-hint: <feature-name>
---

Invoke the `qa` subagent for feature `$ARGUMENTS`.

The subagent must:

1. Read `tasks/prd-$ARGUMENTS.md` and `tasks/design-$ARGUMENTS.md`
2. Read `scripts/ralph/prd.json` and `scripts/ralph/progress.txt`
3. Review the implemented code under `src/`
4. Run `pnpm check`, `pnpm lint`, `pnpm test:e2e`
5. Write the report to `tasks/qa-$ARGUMENTS.md`
