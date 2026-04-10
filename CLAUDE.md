- In all interactions, be extremely concise and sacrifice grammar for the sake of concision.
- if available use Serena MCP as your semantic code retrieval and editing tools. 

## Golden Rule

**Always prefix commands with `rtk`**. If RTK has a dedicated filter, it uses it. If not, it passes through unchanged. This means RTK is always safe to use.

**Important**: Even in command chains with `&&`, use `rtk`:
```bash
# ❌ Wrong
git add . && git commit -m "msg" && git push

# ✅ Correct
rtk git add . && rtk git commit -m "msg" && rtk git push
```

## Tech Stack

| Layer      | Technology                             |
| ---------- | -------------------------------------- | --- |
| Framework  | SvelteKit 2 + Svelte 5                 |
| Language   | TypeScript (strict mode)               |
| Build      | Vite 7                                 |
| Styling    | Tailwind CSS 4 + PostCSS               |
| Deployment | Vercel (`adapter-vercel`)              |
| Components | Bits UI, Melt UI (headless/accessible) |
| Icons      | Lucide Svelte                          |
| Audio      | Web Audio API (native browser)         |
| Testing    | Vitest (unit), Playwright (E2E)        |
| i18n       | Paraglide                              | --- |

You are able to use the Svelte MCP server, where you have access to comprehensive Svelte 5 and SvelteKit documentation.
You also have access to Serena MCP.

## Quality checks (must pass before any commit)

- `pnpm check` — svelte-check / typecheck
- `pnpm lint` — prettier + eslint
- `pnpm test:e2e` — Playwright

## Multi-agent workflow

This repo uses a four-stage pipeline. Each stage produces an artifact the next stage reads:

1. **PRD** — User runs `/prd <feature>` (skill at [.claude/skills/prd/](.claude/skills/prd/)). Output: `tasks/prd-<feature>.md`. The user fills the Product Owner role directly — there is no PO subagent.
2. **Design** — `/design <feature>` invokes the [designer subagent](.claude/agents/designer.md). Output: `tasks/design-<feature>.md`.
3. **Build** — `/ralphize <feature>` converts the PRD into [scripts/ralph/prd.json](scripts/ralph/prd.json) (ordered story list). Then `/build <feature>` invokes the [fullstack subagent](.claude/agents/fullstack.md), which implements all stories in one context window, running quality checks and committing per story.
4. **QA** — `/qa <feature>` invokes the [qa subagent](.claude/agents/qa.md). Output: `tasks/qa-<feature>.md`. User decides what to fix from the report and may flip stories back to `passes: false` to re-run `/build`.

## Svelte MCP (mandatory for Svelte/SvelteKit work)

When writing or modifying Svelte components, you MUST use the `svelte` MCP server:

1. Call `list-sections` first to discover relevant docs
2. Call `get-documentation` for every section whose `use_cases` matches the task
3. After writing any `.svelte` file, run `svelte-autofixer` and re-fix until clean
4. Never call `playground-link` for code that lives in this repo

## Component libraries

- **shadcn-svelte** ([docs](https://www.shadcn-svelte.com/)) is the preferred component library. Components are copied into `src/lib/components/ui/` (not installed as deps). Built on Bits UI primitives + Tailwind. Add components with `pnpm dlx shadcn-svelte@latest add <component>`. If `components.json` does not exist yet, run `pnpm dlx shadcn-svelte@latest init` first.
- Style with Tailwind v4 `@theme` tokens, not legacy `tailwind.config`.
- Prefer existing shadcn-svelte components before hand-rolling new UI primitives.

## Conventions

- Drizzle schemas live under `src/lib/server/db/`
- Server-only code under `src/lib/server/` and never imported from client modules
- Use Svelte 5 runes (`$state`, `$derived`, `$effect`); do not introduce legacy `$:` reactive statements
