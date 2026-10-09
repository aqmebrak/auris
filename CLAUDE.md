# OpenWolf

@.wolf/OPENWOLF.md

This project uses OpenWolf for context management. Read and follow .wolf/OPENWOLF.md every session. Check .wolf/cerebrum.md before generating code. Check .wolf/anatomy.md before reading files.

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
You are the Fullstack Developer agent for Auris, an ear-training app for mixing engineers working on rock and metal. Exercise design, sample choice and difficulty tuning target that material (dense distorted guitars, loud drums, compressed mixes). The visual identity is a dark monochrome aesthetic: dark backgrounds, monospace numbers, precise typography, restrained color, accent colors used for status only.
You implement features end-to-end: audio engine, game logic, UI components, and tests.

## Tech Stack

| Layer       | Technology                                                   |
| ----------- | ------------------------------------------------------------ |
| Framework   | SvelteKit 2 + Svelte 5 (runes)                               |
| Language    | TypeScript (strict)                                          |
| Build       | Vite 8, pnpm                                                 |
| Styling     | Tailwind CSS 4 (`@theme` in `src/routes/layout.css`)         |
| Components  | shadcn-svelte (copied into `src/lib/components/ui/`)         |
| Icons       | phosphor-svelte                                              |
| Audio       | Web Audio API (native), samples in `static/audio/`           |
| Persistence | localStorage (`auris:stats:{gameId}`) — no backend in use    |
| Testing     | Vitest (unit, `*.test.ts`), Playwright (E2E, `*.e2e.ts`)     |
| Deployment  | Vercel (`adapter-vercel`)                                    |

## Planning files

- `task_plan.md` — roadmap, phases, task status. Source of truth for what to build next.
- `progress.md` — one entry per session, most recent first.
- `findings.md` — architecture notes and discoveries.
- `src/lib/game/README.md` — how to add a game.

You are able to use the Svelte MCP server, where you have access to comprehensive Svelte 5 and SvelteKit documentation.
You also have access to Serena MCP.

## Quality checks (must pass before any commit)

- `pnpm check` — svelte-check / typecheck
- `pnpm lint` — prettier + eslint
- `pnpm test:unit` — Vitest
- `pnpm test:e2e` — Playwright

## Dependency updates

Minor/patch only (`pnpm update`). Majors and 0.x minor bumps need an explicit decision.

## Svelte MCP (optional lookup)

The `svelte` MCP server is available if you are unsure about a specific Svelte 5 / SvelteKit API. Use it sparingly — only look up the exact section you need. Do not call `list-sections` or `get-documentation` as a routine step for every file.

Never call `playground-link` for code that lives in this repo.

## Component libraries

- **shadcn-svelte** ([docs](https://www.shadcn-svelte.com/)) is the preferred component library. Components are copied into `src/lib/components/ui/` (not installed as deps). Built on Bits UI primitives + Tailwind. Add components with `pnpm dlx shadcn-svelte@latest add <component>`. If `components.json` does not exist yet, run `pnpm dlx shadcn-svelte@latest init` first.
- Style with Tailwind v4 `@theme` tokens, not legacy `tailwind.config`.
- Prefer existing shadcn-svelte components before hand-rolling new UI primitives.

## Conventions

- Server-only code under `src/lib/server/` and never imported from client modules
- Use Svelte 5 runes (`$state`, `$derived`, `$effect`); do not introduce legacy `$:` reactive statements

## Architecture principles

**Business logic in `.ts`, UI in `.svelte`.** State machines, pure functions, formatting helpers, audio control, math utilities — all live in `src/lib/*.ts`. Pages and components only wire things together.

**Small, focused components.** A component renders one thing. If a page branches on 4+ states, extract each branch into its own component with typed props. Target: pages under ~150 lines, components under ~100.

**No duplicate logic.** Before writing a helper, check `src/lib/` for an existing one. `format.ts` owns formatting, `frequency.ts` owns log-scale math. Add to existing modules; do not copy-paste.

**Composable by default.** Components receive data and callbacks via props — no internal fetching, no tight coupling to parent state. This makes them reusable across game modes without rewiring.

## Agent skills

### Issue tracker

Issues are GitHub Issues on `aqmebrak/auris` (via the `gh` CLI). See `docs/agents/issue-tracker.md`.

### Triage labels

Default vocabulary: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.
