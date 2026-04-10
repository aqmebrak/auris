# PRD: Dashboard — Auris Home Screen

## Introduction

The dashboard is the main entry point of Auris, an ear-training app for sound engineers. It gives users a single-screen overview of their progress and a launchpad to the training games. For this initial version, there is no authentication — data is stored in localStorage. The UI is minimalist and monochrome, consistent with a DAW aesthetic.

## Goals

- Provide a clear, distraction-free landing screen when the user opens the app
- Display the user's overall stats (score, sessions played) using localStorage data, with graceful empty states when no data exists
- Expose a grid of game cards so the user can navigate to any training mode
- Establish the visual identity and layout shell that future features will extend

## User Stories

### US-001: App shell and top bar

**Description:** As a user, I want a consistent top bar with the app name so I know I'm in Auris and can navigate from any page.

**Acceptance Criteria:**

- [ ] Top bar renders on every route via the root layout (`src/routes/+layout.svelte`)
- [ ] Top bar displays the "Auris" wordmark (text, monochrome)
- [ ] No user account UI — no login button or avatar
- [ ] Top bar is fixed-height (e.g. 48px), dark background, subtle bottom border
- [ ] `pnpm check` passes
- [ ] `pnpm lint` passes
- [ ] Verify in browser

### US-002: Dashboard route and page scaffold

**Description:** As a user, I want a dedicated home page at `/` so I have a starting point when I open the app.

**Acceptance Criteria:**

- [ ] `src/routes/+page.svelte` exists and renders without errors
- [ ] Page title is "Auris" (set via `<svelte:head>`)
- [ ] Page uses a single-column centered layout with a max-width container
- [ ] Background is dark (matches DAW aesthetic)
- [ ] `pnpm check` passes
- [ ] `pnpm lint` passes
- [ ] Verify in browser

### US-003: Stats summary panel (empty state)

**Description:** As a user, I want to see my training stats at a glance so I can track my progress over time.

**Acceptance Criteria:**

- [ ] A stats section appears near the top of the dashboard
- [ ] Displays at minimum: "Sessions played", "Best score", "Last played"
- [ ] All values read from localStorage key `auris:stats` (shape: `{ sessionsPlayed: number, bestScore: number, lastPlayed: string | null }`)
- [ ] When no localStorage data exists, all values display as `—` (em dash), not `0` or `null`
- [ ] Stats labels are uppercase small-caps or monospace, monochrome
- [ ] `pnpm check` passes
- [ ] `pnpm lint` passes
- [ ] Verify in browser

### US-004: Game card grid

**Description:** As a user, I want to see the available training games in a card grid so I can choose what to practice.

**Acceptance Criteria:**

- [ ] A grid of game cards renders below the stats panel
- [ ] Cards are defined as a static array in the page component (no DB call needed)
- [ ] Initial game list:
  - "EQ Matching" — Match the EQ curve by ear
  - "Frequency ID" — Identify the boosted frequency band
  - "Dynamics" — Recognize compression characteristics
- [ ] Each card shows: game title, one-line description, a "Play" button (disabled, labeled "Coming Soon" with a `disabled` state)
- [ ] Cards use a monochrome style: dark background, light border, no color accents
- [ ] Grid is responsive: 1 column on mobile, 2–3 columns on wider screens
- [ ] `pnpm check` passes
- [ ] `pnpm lint` passes
- [ ] Verify in browser

### US-005: LocalStorage stats helper

**Description:** As a developer, I need a typed helper to read and write the stats object so every game can update the same data structure.

**Acceptance Criteria:**

- [ ] File `src/lib/stats.ts` exports:
  - `type AurisStats = { sessionsPlayed: number; bestScore: number; lastPlayed: string | null }`
  - `function getStats(): AurisStats` — reads from localStorage, returns defaults if missing
  - `function saveStats(stats: AurisStats): void` — writes to localStorage
- [ ] Helper is client-only (uses `localStorage`); it must not be imported from server modules
- [ ] Unit test file `src/lib/stats.test.ts` covers: empty state returns defaults, saved value is round-tripped correctly
- [ ] `pnpm check` passes
- [ ] `pnpm lint` passes

## Functional Requirements

- FR-1: The root layout (`+layout.svelte`) must render a persistent top bar on every route.
- FR-2: The home route (`/`) must render a stats summary section and a game card grid.
- FR-3: Stats must be read from `localStorage` under the key `auris:stats`. Missing or malformed data must fall back to the default empty state without throwing.
- FR-4: Game cards must be defined as a static data array — no API or DB call.
- FR-5: All game "Play" buttons must be visually disabled and labeled "Coming Soon" until a game route is implemented.
- FR-6: The `AurisStats` type and localStorage helpers must live in `src/lib/stats.ts` and be importable by future game routes.
- FR-7: The UI must be monochrome (black/white/grays only). No color accents.

## Non-Goals

- No user authentication or account creation
- No server-side data persistence (Drizzle/Neon not used in this feature)
- No actual game implementations — cards link nowhere
- No notifications, badges, or streaks
- No dark/light mode toggle — dark only
- No animations or transitions beyond basic browser defaults

## Design Considerations

- Visual language: DAW aesthetic — dark backgrounds (`#0a0a0a` range), light text, thin borders, monospace numbers for stats
- Stats values should feel like a hardware meter readout: fixed-width, aligned
- Game cards should feel like rack units or plugin slots: rectangular, uniform height, restrained
- shadcn-svelte components to consider: `Card`, `Button` (with `disabled` variant)
- Tailwind CSS 4 `@theme` tokens must be used for colors — no hardcoded hex in components

## Technical Considerations

- Framework: SvelteKit 2 + Svelte 5 (use runes: `$state`, `$derived`, `$effect`)
- `localStorage` is browser-only — wrap reads in `if (typeof window !== 'undefined')` or use `$effect` to avoid SSR errors
- shadcn-svelte components are copied into `src/lib/components/ui/` — check what's already there before adding via CLI
- All Svelte component work must go through the Svelte MCP (`list-sections` → `get-documentation` → `svelte-autofixer`)

## Success Metrics

- Dashboard renders with no console errors on first load (fresh localStorage)
- Stats section shows `—` for all fields when localStorage is empty
- All game cards render with disabled "Coming Soon" buttons
- `pnpm check`, `pnpm lint`, `pnpm test:e2e` all pass

## Open Questions

- Should we add a `lastPlayed` game name to the stats (e.g. "Last played: EQ Matching")? Deferred — revisit when first game is built.
- Will the app eventually require auth? If yes, the localStorage data migration strategy needs to be decided before any game ships data.
