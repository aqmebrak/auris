# Design Spec: Dashboard — Auris Home Screen

---

## 1. Visual Language

### Color Palette

All colors reference the CSS custom properties defined in `src/routes/layout.css` via Tailwind v4 `@theme inline` tokens. The app is **dark-only** — no light mode toggle. The `.dark` class is always active at the `<html>` element.

| Token                     | CSS Variable           | OKLCH Value          | Usage                                  |
| ------------------------- | ---------------------- | -------------------- | -------------------------------------- |
| `bg-background`           | `--background`         | `oklch(0.145 0 0)`   | Page and root background               |
| `bg-card`                 | `--card`               | `oklch(0.205 0 0)`   | Game card and stats panel backgrounds  |
| `text-foreground`         | `--foreground`         | `oklch(0.985 0 0)`   | Primary body text                      |
| `text-muted-foreground`   | `--muted-foreground`   | `oklch(0.708 0 0)`   | Labels, secondary text, stat headings  |
| `border-border`           | `--border`             | `oklch(1 0 0 / 10%)` | All borders — cards, top bar, dividers |
| `bg-muted`                | `--muted`              | `oklch(0.269 0 0)`   | Hover states, disabled backgrounds     |
| `text-primary`            | `--primary`            | `oklch(0.922 0 0)`   | Active button foreground               |
| `bg-primary`              | `--primary`            | `oklch(0.922 0 0)`   | Primary button fill                    |
| `text-primary-foreground` | `--primary-foreground` | `oklch(0.205 0 0)`   | Text on primary buttons                |
| `ring`                    | `--ring`               | `oklch(0.556 0 0)`   | Focus rings                            |

No color accents. Monochrome only. Do not introduce any hue-bearing color.

### Typography

The global base font is `JetBrains Mono Variable` (imported via `@fontsource-variable/jetbrains-mono`), applied to `html` with `font-mono` in the base layer. This means **all text is monospace by default** — lean into this for the DAW aesthetic, do not override to a sans-serif.

| Role             | Classes                                                               | Notes                                    |
| ---------------- | --------------------------------------------------------------------- | ---------------------------------------- |
| App wordmark     | `text-sm font-semibold tracking-widest uppercase`                     | "AURIS" in all-caps                      |
| Section heading  | `text-xs font-medium tracking-widest uppercase text-muted-foreground` | e.g. "TRAINING MODULES", "STATS"         |
| Stat value       | `text-2xl font-semibold tabular-nums`                                 | Numbers displayed in fixed-width columns |
| Stat label       | `text-xs tracking-widest uppercase text-muted-foreground`             | e.g. "SESSIONS PLAYED"                   |
| Card title       | `text-sm font-semibold`                                               | Game name                                |
| Card description | `text-xs text-muted-foreground leading-relaxed`                       | One-liner description                    |
| Button label     | `text-xs font-medium tracking-wide uppercase`                         | For "COMING SOON" disabled state         |

### Spacing Scale

Use Tailwind's default scale. Prefer multiples of 4px (i.e., `p-4`, `gap-4`, `py-3`, etc.). Key breakpoints for the layout:

- Top bar height: `h-12` (48px)
- Page content max-width: `max-w-3xl` (centred)
- Section vertical gap: `gap-8` between major sections
- Card grid gap: `gap-4`
- Card internal padding: `p-5`
- Stats panel internal padding: `p-5`

### Borders and Radius

- All card and panel borders: `border border-border` (1px, `oklch(1 0 0 / 10%)`)
- Top bar bottom border: `border-b border-border`
- Radius: `rounded-lg` (`var(--radius-lg)` = `0.625rem`) on cards and panels
- Radius: `rounded-md` on buttons
- No drop shadows. DAW UIs are flat and border-defined.

---

## 2. Layout

### Overall Page Structure

```
┌──────────────────────────────────────────────────────────┐
│  TOP BAR (h-12, sticky, bg-background, border-b)        │
│  [AURIS wordmark]                                        │
└──────────────────────────────────────────────────────────┘
│                                                          │
│  PAGE CONTENT (max-w-3xl, mx-auto, px-4, py-8)          │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │  STATS PANEL                                       │  │
│  │  bg-card, border, rounded-lg, p-5                 │  │
│  │                                                    │  │
│  │  SESSIONS PLAYED   BEST SCORE   LAST PLAYED        │  │
│  │       —                —            —              │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  SECTION HEADING: TRAINING MODULES                       │
│                                                          │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐     │
│  │  GAME CARD   │ │  GAME CARD   │ │  GAME CARD   │     │
│  │              │ │              │ │              │     │
│  │  EQ Matching │ │ Frequency ID │ │  Dynamics    │     │
│  │  description │ │  description │ │  description │     │
│  │              │ │              │ │              │     │
│  │ [COMING SOON]│ │ [COMING SOON]│ │ [COMING SOON]│     │
│  └──────────────┘ └──────────────┘ └──────────────┘     │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### Regions

| Region          | Element                        | Purpose                                                                         |
| --------------- | ------------------------------ | ------------------------------------------------------------------------------- |
| Top bar         | `<header>` in `+layout.svelte` | Persistent across all routes; renders "AURIS" wordmark                          |
| Page wrapper    | `<main>` in `+page.svelte`     | Scrollable content area below the fixed header                                  |
| Stats panel     | `<section>`                    | Reads and displays localStorage stats; single-row on desktop, stacked on mobile |
| Section heading | `<h2>`                         | Separates stats from game grid; uppercase monospace label                       |
| Game card grid  | `<section>` > `<ul>`           | Three cards in a responsive grid                                                |

### Responsive Behaviour

| Breakpoint                        | Stats layout                                   | Card grid columns |
| --------------------------------- | ---------------------------------------------- | ----------------- |
| Mobile (`< sm`, `< 640px`)        | Stats stacked vertically, each stat full-width | 1 column          |
| Tablet (`sm` to `lg`, 640–1024px) | Stats in a single horizontal row               | 2 columns         |
| Desktop (`>= lg`, `>= 1024px`)    | Stats in a single horizontal row               | 3 columns         |

Stats panel on mobile: each stat block stacks with a `border-b border-border` separator. On `sm+`, use `grid grid-cols-3 divide-x divide-border`.

Page content horizontal padding: `px-4` on mobile, `px-6 sm:px-8` on wider viewports. Max-width container `max-w-3xl mx-auto` applies on all breakpoints.

Top bar: `sticky top-0 z-10` so it remains visible on scroll.

---

## 3. Components

### shadcn-svelte Components to Add

Run once if `components.json` does not yet exist:

```
pnpm dlx shadcn-svelte@latest init
```

Then add:

```
pnpm dlx shadcn-svelte@latest add card button
```

These are copied into `src/lib/components/ui/card/` and `src/lib/components/ui/button/`.

#### `Card` (from shadcn-svelte)

Used for each game card. Subcomponents used:

- `Card.Root` — outer container; `size="default"`; add class `flex flex-col justify-between h-full`
- `Card.Header` — wraps title and description
- `Card.Title` — game name; override class to `text-sm font-semibold`
- `Card.Description` — one-line description; already styled with `text-muted-foreground`
- `Card.Footer` — contains the "Coming Soon" button; add class `pt-0`

Do not use `Card.Content` or `Card.Action` for this feature.

#### `Button` (from shadcn-svelte)

Used for the "Play" CTA on each card.

- `variant="outline"` — border-only, no fill; matches monochrome identity
- `size="sm"` — compact, `h-8`
- `disabled` prop set to `true`; renders with `opacity-50 pointer-events-none cursor-not-allowed`
- Label text: `"COMING SOON"` (uppercase, tracked — apply `tracking-widest uppercase text-xs` via `class` prop)
- Full-width within the card footer: add `class="w-full"`
- No icon. The disabled state makes intent clear without decoration.

### Custom Components Needed

#### `TopBar`

- **Purpose:** Persistent application header rendered in the root layout.
- **File:** `src/lib/components/top-bar.svelte`
- **Props:** none (stateless)
- **Structure:** `<header>` element, `h-12`, `sticky top-0 z-10`, `bg-background border-b border-border`. Contains a single `<div>` with `max-w-3xl mx-auto px-4 h-full flex items-center`. Inside: an `<a href="/">` anchor with the wordmark "AURIS" styled `text-sm font-semibold tracking-widest uppercase text-foreground no-underline hover:opacity-80`.

#### `StatsPanel`

- **Purpose:** Reads `auris:stats` from localStorage via the `getStats()` helper and renders three stat readouts.
- **File:** `src/lib/components/stats-panel.svelte`
- **Props:** none (reads localStorage internally via `$effect`)
- **Internal state:** One `$state` variable of type `AurisStats | null`, initialized to `null`. A `$effect` runs on mount (browser-only, referencing `browser` from `$app/environment`) to call `getStats()` and assign the result.
- **Stat fields displayed:**
  - "SESSIONS PLAYED" — show `—` when `sessionsPlayed === 0` or no data
  - "BEST SCORE" — show `—` when `bestScore === 0` or no data
  - "LAST PLAYED" — show `—` when `lastPlayed === null`; when a value exists, display it as-is (stored as `YYYY-MM-DD` string, e.g. `"2026-04-10"`)
- **Layout:** `<section>` with `bg-card border border-border rounded-lg p-5`. Inner grid: `grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border`.
- **Each stat cell:** `<div class="flex flex-col gap-1 py-3 sm:py-0 sm:px-5 first:pl-0 last:pr-0">`. Contains a `<dt>` for the label and a `<dd>` for the value. Use a `<dl>` semantic wrapper.
- **Value typography:** `text-2xl font-semibold tabular-nums text-foreground`
- **Label typography:** `text-xs tracking-widest uppercase text-muted-foreground`

#### `GameCard`

- **Purpose:** Renders one training game entry with title, description, and a disabled play button.
- **File:** `src/lib/components/game-card.svelte`
- **Props:**
  - `title: string` — e.g. `"EQ Matching"`
  - `description: string` — e.g. `"Match the EQ curve by ear"`
  - `href: string` — route path for when the game is live (unused for now, passed through)
  - `available: boolean` — defaults to `false`; when `false`, button is disabled with "COMING SOON" label; when `true`, button is enabled with "PLAY" label and routes to `href`
- **Structure:** Uses `Card.Root`, `Card.Header`, `Card.Title`, `Card.Description`, `Card.Footer`, and `Button` from shadcn-svelte. `Card.Root` gets `class="flex flex-col justify-between h-full"`.

### Reused Components

No existing components in `src/lib/components/` at the time of this spec. `TopBar`, `StatsPanel`, and `GameCard` are the first inhabitants.

---

## 4. States

### StatsPanel

| State                   | Trigger                                           | Visual Treatment                                                                                                                                                        |
| ----------------------- | ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Loading / SSR           | Before `$effect` runs (initial render)            | All three values display `—` (em dash). No spinner — the dash is the empty state and the loading state simultaneously.                                                  |
| Populated               | `getStats()` returns data                         | Numeric values replace em dashes. `tabular-nums` keeps layout stable.                                                                                                   |
| Empty (no localStorage) | `getStats()` returns defaults                     | All three values display `—`. Numeric fields `sessionsPlayed: 0` and `bestScore: 0` also render as `—` (zero is treated as no data). `lastPlayed: null` renders as `—`. |
| Error                   | localStorage throws (e.g. private browsing quota) | Catch the error silently; treat as empty state. All values show `—`.                                                                                                    |

### GameCard / Button

| State                    | Trigger                                       | Visual Treatment                                                                                                                                                |
| ------------------------ | --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Default (disabled)       | `available = false`                           | `Button` variant `outline`, `disabled` prop true: `opacity-50`, `pointer-events-none`. Card has `bg-card border-border`.                                        |
| Card hover (disabled)    | User hovers the card while button is disabled | No hover state. Card is completely inert — no background change, cursor remains `default`. Do not add `hover:` classes to `Card.Root` when `available = false`. |
| Default (available)      | `available = true` — future state             | `Button` enabled, variant `outline`, label "PLAY". Cursor `pointer` on card.                                                                                    |
| Button hover (available) | Hover over enabled button                     | shadcn-svelte default: `hover:bg-accent hover:text-accent-foreground`. No custom overrides needed.                                                              |
| Button focus             | Keyboard tab to button                        | `ring-2 ring-ring ring-offset-2 ring-offset-background` — shadcn-svelte default focus ring.                                                                     |
| Button active            | Mousedown on enabled button                   | `opacity-90` — shadcn-svelte default.                                                                                                                           |

### TopBar

| State   | Trigger | Visual Treatment                                                       |
| ------- | ------- | ---------------------------------------------------------------------- |
| Default | Always  | `bg-background border-b border-border`. Static, no interactive states. |

---

## 5. Interactions

### User Flows

1. **Cold open (no localStorage):** User opens the app → sees top bar + stats panel with all `—` values + three disabled game cards. No network calls. No loading spinner. Render is immediate.

2. **Return visit (localStorage present):** `$effect` fires after mount → `getStats()` reads `auris:stats` → stats update reactively. Since this is synchronous localStorage access, the transition from `—` to real values happens within one frame. No visual flash is expected, but `tabular-nums` ensures layout does not shift when numbers replace dashes.

3. **Click on disabled "COMING SOON" button:** `pointer-events-none` prevents any interaction. No navigation, no event fires.

### Transitions and Animation

Per the PRD non-goals: no animations or transitions beyond browser defaults. Do not add `transition:`, `animate:`, or CSS `transition` properties to any element in this feature.

### Keyboard Shortcuts

None in this feature. The only interactive elements are the disabled buttons, which are correctly excluded from the tab order via `aria-disabled="true"` and `tabindex="-1"` (shadcn-svelte's disabled handling sets `pointer-events-none` and the underlying Bits UI will manage aria attributes).

### Scroll Behaviour

Default browser scroll on the page body. Top bar is `sticky top-0` so it remains in view. No custom scroll logic.

### Focus Order

Natural DOM order:

1. Top bar (no focusable elements)
2. Stats panel (no focusable elements — `<dl>` is display-only)
3. Card grid: each card's button in source order — EQ Matching, Frequency ID, Dynamics

Because all buttons are disabled, keyboard users will skip over them. This is acceptable for this initial version where no games are available yet.

---

## 6. Accessibility

### ARIA Roles and Semantics

| Element         | Tag / Role                                                            | Notes                                                                              |
| --------------- | --------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Top bar         | `<header>`                                                            | Landmark; implicit `role="banner"`                                                 |
| App wordmark    | `<span>`                                                              | Decorative text, no `aria-label` needed                                            |
| Stats section   | `<section aria-label="Training statistics">`                          | Named landmark                                                                     |
| Stats data      | `<dl>` with `<dt>` / `<dd>` pairs                                     | Correct semantic for labelled values                                               |
| Game card grid  | `<section aria-label="Training modules">` wrapping `<ul role="list">` | `role="list"` restores list semantics stripped by `list-style: none` in CSS resets |
| Each game card  | `<li>`                                                                | Card is a list item                                                                |
| Disabled button | `Button` with `disabled` prop                                         | shadcn-svelte sets `aria-disabled="true"` on the underlying element                |

### Keyboard Navigation

- Tab moves through focusable elements in DOM order.
- Disabled buttons receive `pointer-events-none` from shadcn-svelte; they should not be reachable via Tab. Confirm with implementation — if they remain in tab order, add `tabindex="-1"` explicitly.
- No custom key handlers in this feature.

### Color Contrast

All text must meet WCAG AA (4.5:1 for normal text, 3:1 for large text / UI components).

| Foreground token                          | Background token                  | Approximate ratio       | Pass AA?                                                  |
| ----------------------------------------- | --------------------------------- | ----------------------- | --------------------------------------------------------- |
| `--foreground` `oklch(0.985 0 0)`         | `--background` `oklch(0.145 0 0)` | ~18:1                   | Yes                                                       |
| `--foreground` `oklch(0.985 0 0)`         | `--card` `oklch(0.205 0 0)`       | ~14:1                   | Yes                                                       |
| `--muted-foreground` `oklch(0.708 0 0)`   | `--card` `oklch(0.205 0 0)`       | ~5.5:1                  | Yes (borderline — verify with tooling)                    |
| `--muted-foreground` `oklch(0.708 0 0)`   | `--background` `oklch(0.145 0 0)` | ~6.5:1                  | Yes                                                       |
| Disabled button text (opacity-50 applied) | `--card`                          | Fails AA at 50% opacity | Acceptable — disabled controls are exempt from WCAG 1.4.3 |

### Focus Indicators

shadcn-svelte's Button applies `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2` by default. `--ring` is `oklch(0.556 0 0)` — a mid-grey. This meets 3:1 against `--background`. Do not remove this focus ring.

### Screen Reader Considerations

- Stat values rendered as `—` (em dash, U+2014) should read naturally as "dash" or be supplemented with a visually hidden alternative. Prefer `aria-label="Sessions played: no data"` on the `<dd>` when value is `—`, or wrap the em dash in `<span aria-hidden="true">—</span><span class="sr-only">No data</span>`.
- "COMING SOON" as button label is sufficient for screen readers — it communicates both that a button exists and that the action is unavailable.
- The uppercase CSS/class treatment (`uppercase tracking-widest`) does not affect screen reader pronunciation — labels remain readable as lowercase in the accessibility tree.

---

## 7. Open Questions

All open questions resolved by the product owner:

- [x] **OQ-1: Empty vs zero in stats.** Zero numeric values (`sessionsPlayed: 0`, `bestScore: 0`) display as `—`, same as missing data. Only show a real number when it is greater than zero.
- [x] **OQ-2: Top bar navigation.** Wordmark is `<a href="/">` — a link back to home on all routes.
- [x] **OQ-3: Game card clickability.** Disabled cards are completely inert — no hover state, no cursor change.
- [x] **OQ-4: `lastPlayed` format.** Stored and displayed as `YYYY-MM-DD` (e.g. `"2026-04-10"`). No reformatting needed.
- [x] **OQ-5: `dark` class placement.** Add `class="dark"` to the `<html>` element in `src/app.html`.
