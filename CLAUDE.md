# Auris

Ear-training app for mixing engineers working on rock and metal. Exercise design, sample choice and difficulty tuning target that material (dense distorted guitars, loud drums, compressed mixes). Visual identity: dark monochrome — dark backgrounds, monospace numbers, precise typography, restrained colour, accent colours for status only.

You implement features end-to-end: audio engine, game logic, UI, tests.

## Working style

- Be extremely concise; sacrifice grammar for concision.
- Build exactly what was asked — no extra features, speculative error handling or explanatory comments.
- Use Serena MCP for code retrieval and edits where available (it cannot parse `.svelte`).
- Prefix every shell command with `rtk`, including each command in a `&&` chain: `rtk git add . && rtk git commit -m "msg"`. RTK passes unknown commands through unchanged.

## Quality checks (must pass before any commit)

`pnpm check` · `pnpm lint` · `pnpm test:unit` · `pnpm test:e2e`

Dependencies: minor/patch updates only (`pnpm update`); majors and 0.x minor bumps need an explicit decision.

## Stack notes

SvelteKit 2 + Svelte 5 runes, Tailwind v4 (`@theme` tokens in `src/routes/layout.css`, no tailwind.config), Web Audio API, phosphor-svelte icons, no backend (progress in localStorage), deployed on Vercel.

- **shadcn-svelte** is the preferred component library; components are copied into `src/lib/components/ui/` (`pnpm dlx shadcn-svelte@latest add <component>`). Use an existing one before hand-rolling a primitive.
- The `svelte` MCP server is there for exact Svelte 5 / SvelteKit API lookups; use it sparingly and never call `playground-link` for code in this repo.
- Server-only code lives under `src/lib/server/` and is never imported by client modules.

## Architecture principles

- **Business logic in `.ts`, UI in `.svelte`.** State machines, pure functions, formatting, audio control and math live in `src/lib/*.ts`; pages and components wire them together. Svelte 5 runes only (no `$:`).
- **Small, focused components** — a component renders one thing; target pages under ~150 lines, components under ~100.
- **No duplicate logic** — check `src/lib/` first (`format.ts` owns formatting, `frequency.ts` owns log-scale math); extend existing modules.
- **Composable by default** — components take data and callbacks via props; no internal fetching.

## Reference

- Touching audio, scoring, samples or game pages: read `docs/gotchas.md` (non-obvious facts and decisions) first.
- Adding a game: `src/lib/game/README.md`.
- Remaining work and roadmap: `task_plan.md`.

## Agent skills

### Issue tracker

Issues are GitHub Issues on `aqmebrak/auris` (via the `gh` CLI). See `docs/agents/issue-tracker.md`.

### Triage labels

Default vocabulary: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.
