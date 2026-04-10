# Ralph Iteration — Auris

You are an autonomous coding agent. Each invocation is one iteration. You implement ONE user story and exit.

## Project context

Auris is an ear-training app for sound engineers. SvelteKit 2 + Svelte 5 + TypeScript + Tailwind 4 + Drizzle (Neon Postgres) + Playwright. Package manager: pnpm.

The project root `CLAUDE.md` describes the multi-agent workflow, stack, conventions, and Svelte MCP rules. Read it first.

## What to do this iteration

1. Read `scripts/ralph/prd.json`. Pick the story with the **lowest priority number** where `passes: false`.
2. Read `scripts/ralph/progress.txt` — especially the `## Codebase Patterns` section at the top.
3. If the story changes UI, read `tasks/design-<feature>.md` (derive `<feature>` from `branchName` minus the `ralph/` prefix). UI stories MUST follow the design spec — components, states, layout, accessibility.
4. Check you are on the branch from `prd.json` `branchName`. If not, check it out (or create it from `main`).
5. Implement ONLY that one story. No scope creep, no incidental refactors.
6. For any Svelte component work: use the Svelte MCP (`list-sections` → `get-documentation` → `svelte-autofixer`). Keep calling `svelte-autofixer` until it returns no issues.
7. For new UI primitives: add shadcn-svelte components via `pnpm dlx shadcn-svelte@latest add <component>` rather than hand-rolling. If the project has no `components.json` yet, run `pnpm dlx shadcn-svelte@latest init` first.
8. If a Chrome / browser MCP is available, use it to verify UI stories live in the dev server. Otherwise, write or extend a Playwright test that exercises the new UI and rely on `pnpm test:e2e`.
9. Run quality checks (must ALL pass before commit):
   - `pnpm check`
   - `pnpm lint`
   - `pnpm test:e2e`
10. If any check fails, fix it. Do not commit broken code. Do not use `--no-verify`.
11. Stage and commit ALL changes with message: `feat: [Story ID] - [Story Title]`
12. Update `scripts/ralph/prd.json` to set `passes: true` for the completed story.
13. Append a progress entry to `scripts/ralph/progress.txt`:

    ```
    ## YYYY-MM-DD HH:MM - <Story ID>
    - What was implemented
    - Files changed
    - Learnings for future iterations:
      - <patterns discovered>
      - <gotchas>
    ---
    ```

14. If the learning is a reusable codebase pattern (not story-specific), also add it to the `## Codebase Patterns` section at the TOP of `progress.txt`.
15. If genuinely reusable knowledge belongs in a directory's `CLAUDE.md`, update that file too.

## Stop condition

After completing the story, check `prd.json`. If ALL stories now have `passes: true`, output exactly:

`<promise>COMPLETE</promise>`

Otherwise just end normally — the next iteration will pick up the next story.

## Hard rules

- ONE story per iteration. Never two.
- NEVER commit broken code. NEVER skip quality checks. NEVER use `--no-verify`.
- NEVER modify `tasks/prd-*.md` or `tasks/design-*.md` — those are immutable inputs from upstream agents.
- If a story is ambiguous or its acceptance criteria conflict with the design spec, STOP. Append a note to `progress.txt` explaining the conflict and exit without committing.
