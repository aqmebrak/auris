# Design Spec: Frequency ID

## 1. Visual Language

### Color tokens (from `src/routes/layout.css` OKLCH custom properties)

All values reference existing dark-mode tokens. The app is always rendered in dark mode.

| Token | Value | Role |
|---|---|---|
| `--background` | `oklch(0.145 0 0)` | Page and exercise backgrounds (near-black) |
| `--card` | `oklch(0.205 0 0)` | Panel and knob strip backgrounds |
| `--muted` | `oklch(0.269 0 0)` | Inactive / off-state fills |
| `--border` | `oklch(1 0 0 / 10%)` | Subtle separators |
| `--foreground` | `oklch(0.985 0 0)` | Primary text, active knob fill |
| `--muted-foreground` | `oklch(0.708 0 0)` | Labels, tick text, secondary info |
| `--primary` | `oklch(0.922 0 0)` | Active/lit states (A/B toggle active, submit enabled) |
| `--destructive` | `oklch(0.704 0.191 22.216)` | Incorrect result indicator |
| `--ring` | `oklch(0.556 0 0)` | Focus rings |

**Accent color discipline:** One accent per screen.
- DifficultySelect screen: no accent, pure monochrome.
- RoundUI screen: `--primary` (near-white) used only for the lit A/B button and enabled Submit.
- RoundResult screen: `--primary` for Correct, `--destructive` for Incorrect — never both on-screen together.
- GameOver screen: no accent, monochrome history list; score uses `--foreground`.

No additional colors are introduced. The correct freq marker on FrequencyStrip uses `--primary`; the user-guess marker uses `--muted-foreground`.

### Typography

| Use | Class |
|---|---|
| Global font | `font-mono` (JetBrains Mono Variable, set on `html` in layout.css) |
| Section labels | `text-xs uppercase tracking-widest text-muted-foreground` |
| Numeric values (knob readouts, score) | `font-mono tabular-nums` |
| Knob value readout | `text-xs font-mono tabular-nums text-foreground` |
| Round counter | `text-xs uppercase tracking-widest text-muted-foreground` |
| Difficulty card title | `text-sm font-semibold text-foreground uppercase tracking-wide` |
| Difficulty card meta | `text-xs text-muted-foreground font-mono` |
| Result verdict | `text-2xl font-semibold tracking-wide uppercase` |
| Comparison values | `text-sm font-mono tabular-nums` |
| Score (GameOver) | `text-4xl font-semibold font-mono tabular-nums text-foreground` |

### Spacing scale

Uses Tailwind v4 defaults. Key spacings:
- Page horizontal padding: `px-4` (mobile), `px-6` (desktop)
- Max content width: `max-w-3xl mx-auto`
- Card/panel padding: `p-4` (compact panels) or `p-5` (stat panels)
- Knob column gap: `gap-6` between knobs
- Between FrequencyStrip and knob column: `gap-4`
- Between A/B buttons: `gap-1` (pill pair feel)

### Border radius

Follows `--radius: 0.625rem` (`rounded-lg`). Exceptions:
- Buttons: `rounded-none` (matches existing button.svelte with `rounded-none` base — DAW feel)
- Knob circle: `rounded-full`
- A/B toggle buttons: `rounded-none` (pair reads as a single unit)
- FrequencyStrip container: `rounded-sm`

### Shadows

No drop shadows. Visual hierarchy through background lightness steps only (`--background` → `--card` → `--muted`). Borders (`border border-border`) provide separation.

---

## 2. Layout

### Screen A: DifficultySelect

Shown when `gameState === 'idle' | 'selecting_difficulty'`.

```
┌──────────────────────────────────────────────────┐
│ AURIS                                    (TopBar) │
├──────────────────────────────────────────────────┤
│                                                  │
│  ← Back                                          │
│                                                  │
│  FREQUENCY ID                                    │
│  Select difficulty                               │
│                                                  │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────┐ │
│  │    EASY      │ │    MEDIUM    │ │   HARD   │ │
│  │              │ │              │ │          │ │
│  │  ±3 dB       │ │  ±5 dB       │ │  ±10 dB  │ │
│  │  15% tol.    │ │  10% tol.    │ │  5% tol. │ │
│  │  Q 0.5–1     │ │  Q 0.5–3     │ │  Q 0.5–10│ │
│  └──────────────┘ └──────────────┘ └──────────┘ │
│                                                  │
└──────────────────────────────────────────────────┘
```

**Regions:**
- TopBar: sticky `h-12 border-b border-border bg-background` (reused component)
- Back link: `← Back` as a ghost button/link, `text-xs uppercase tracking-widest`, navigates to `/`
- Page heading: two lines — title (`FREQUENCY ID`) and subtitle (`Select difficulty`)
- Card grid: three `DifficultyCard` components in a horizontal row on tablet+, stacked on mobile

**Responsive notes:**
- Mobile (`< sm`): cards stack vertically, full width, `gap-3`
- Tablet+ (`sm+`): three cards in a row with `grid-cols-3 gap-4`

---

### Screen B: RoundUI

Shown when `gameState === 'round_active'`.

```
┌──────────────────────────────────────────────────┐
│ AURIS                                    (TopBar) │
├──────────────────────────────────────────────────┤
│                                                  │
│  ROUND 2 / 5                          [A] [B]   │
│                                                  │
│  ┌──┐  ┌─────────────────────────────────────┐  │
│  │  │  │  FREQ          GAIN           Q     │  │
│  │  │  │                                     │  │
│  │  │  │  ┌───┐         ┌───┐         ┌───┐ │  │
│  │  │  │  │ ◉ │         │ ◉ │         │ ◉ │ │  │
│  │  │  │  └───┘         └───┘         └───┘ │  │
│  │  │  │  1.2 kHz       -5 dB         2.4   │  │
│  │  │  └─────────────────────────────────────┘  │
│  └──┘                                            │
│  freq                       [SUBMIT — disabled]  │
│  strip                                           │
│                                                  │
└──────────────────────────────────────────────────┘
```

**Regions:**
- Round counter: top-left, `text-xs uppercase tracking-widest text-muted-foreground`
- A/B toggle: top-right, paired buttons
- Main body: horizontal flex row — `FrequencyStrip` (left, narrow, full height of knob area) + `KnobStrip` panel (right, takes remaining width)
- `KnobStrip`: vertical card containing three `RotaryKnob` components side by side, each with label above and value below
- Submit button: bottom-right, full width on mobile

**Responsive notes:**
- Mobile: FrequencyStrip is hidden or collapsed to 20px; knobs remain full size; A/B toggle stacks above knobs; Submit is full width
- Tablet+ (`sm+`): FrequencyStrip `w-[120px]` shown to the left of the knob panel; A/B and round counter in a top bar row

---

### Screen C: RoundResult

Shown when `gameState === 'round_result'`.

```
┌──────────────────────────────────────────────────┐
│ AURIS                                    (TopBar) │
├──────────────────────────────────────────────────┤
│                                                  │
│  ROUND 2 / 5                                     │
│                                                  │
│  CORRECT ✓   (or INCORRECT ✗)                    │
│                                                  │
│  ┌──┐  ┌──────────────────────────────────────┐  │
│  │  │  │          YOUR GUESS    TARGET        │  │
│  │  │  │  FREQ    1.2 kHz       1.1 kHz       │  │
│  │  │  │  GAIN    -5 dB         -4 dB         │  │
│  │  │  │  Q       2.4           2.1           │  │
│  │  │  │  MARGIN  ±10% = ±110 Hz              │  │
│  │  │  └──────────────────────────────────────┘  │
│  └──┘                                            │
│  freq                               [NEXT ROUND] │
│  strip                                           │
│  (with                                           │
│  target                                          │
│  marker)                                         │
│                                                  │
└──────────────────────────────────────────────────┘
```

**Regions:**
- Round counter: same position as RoundUI
- Verdict: large `CORRECT ✓` or `INCORRECT ✗` in `text-2xl font-semibold uppercase tracking-wide`
- FrequencyStrip: same position, but now shows two markers — user guess (dim, `--muted-foreground`) and correct target (bright, `--primary`)
- Comparison table: two-column layout: YOUR GUESS vs TARGET; each row: param label (left), user value (center), target value (right)
- Margin row: single row showing `±X% = ±Y Hz`
- Action button: `NEXT ROUND` (rounds 1–4) or `SEE RESULTS` (round 5), bottom-right

---

### Screen D: GameOver

Shown when `gameState === 'game_over'`.

```
┌──────────────────────────────────────────────────┐
│ AURIS                                    (TopBar) │
├──────────────────────────────────────────────────┤
│                                                  │
│  GAME OVER                                       │
│                                                  │
│  3 / 5                                           │
│                                                  │
│  ┌────────────────────────────────────────────┐  │
│  │  #   TARGET      YOUR GUESS   RESULT       │  │
│  │  1   1.2 kHz     1.1 kHz      ✓            │  │
│  │  2   400 Hz      600 Hz       ✗            │  │
│  │  3   8 kHz       8.2 kHz      ✓            │  │
│  │  4   250 Hz      250 Hz       ✓            │  │
│  │  5   63 Hz       100 Hz       ✗            │  │
│  └────────────────────────────────────────────┘  │
│                                                  │
│  [PLAY AGAIN]          [BACK TO HOME]            │
│                                                  │
└──────────────────────────────────────────────────┘
```

**Regions:**
- Page heading: `GAME OVER` in `text-sm uppercase tracking-widest text-muted-foreground`
- Score: `3 / 5` in `text-4xl font-semibold font-mono tabular-nums text-foreground`
- Round history table: 5 rows; columns: round number, target freq, user guess, result icon. All values in `font-mono tabular-nums text-sm`.
- Action row: two buttons — `PLAY AGAIN` (outline, left) and `BACK TO HOME` (ghost, right). On mobile: stacked vertically.

---

## 3. Components

### shadcn-svelte components to add

These are already partially present (`button`, `card`). Verify with `pnpm dlx shadcn-svelte@latest add <name>` if missing.

```
pnpm dlx shadcn-svelte@latest add button card badge
```

- `button` — already in `src/lib/components/ui/button/`. Used for: difficulty selection, A/B toggle, Submit, Next Round, Play Again, Back to Home.
- `card` — already in `src/lib/components/ui/card/`. Used for: DifficultyCard, KnobStrip panel, RoundResult comparison panel.
- `badge` — new. Used for: round result verdict label (CORRECT / INCORRECT) and possibly difficulty chip on GameOver.

---

### Custom components needed

**`DifficultyCard`**
- Purpose: One of three buttons on the difficulty select screen. Displays difficulty name, gain range, tolerance %, and Q range. Clicking it starts the game.
- Props:
  - `difficulty: 'easy' | 'medium' | 'hard'`
  - `gainRange: number` (e.g. 3 for easy)
  - `errorMarginPct: number` (e.g. 0.15 for easy)
  - `qMin: number`
  - `qMax: number`
  - `onselect: (difficulty: Difficulty) => void`
- Path: `src/lib/components/difficulty-card.svelte`
- Notes: Uses `Card.Root` as base. Full-card click target via a `<button>` wrapping the card interior. No hover accent color — use `hover:bg-muted` only.

---

**`RotaryKnob`**
- Purpose: SSL-strip style rotary control. Drag up = increase, drag down = decrease. Logarithmic mapping optional.
- Props:
  - `value: number`
  - `min: number`
  - `max: number`
  - `label: string` (e.g. `"FREQ"`, `"GAIN"`, `"Q"`)
  - `unit: string` (e.g. `"Hz"`, `"dB"`, `""`)
  - `logarithmic?: boolean` (default `false`)
  - `onchange: (v: number) => void`
  - `disabled?: boolean` (default `false`)
- Path: `src/lib/components/rotary-knob.svelte`
- Visual anatomy:
  - Label above knob: `text-xs uppercase tracking-widest text-muted-foreground`
  - Knob circle: `w-11 h-11 rounded-full bg-card border border-border` with a `2px` white notch indicator positioned on the rim at the mapped angle
  - Value readout below: `text-xs font-mono tabular-nums text-foreground`; format: `1.2 kHz` / `-5 dB` / `2.4`
  - Notch arc range: 270 degrees total (−135° to +135° from 6 o'clock)
- Rune pattern (Svelte 5, per `$state` and `$effect` docs):
  - `pointerdown` on knob element calls `el.setPointerCapture(e.pointerId)`
  - `pointermove` on window (via `<svelte:window>`) tracks `e.movementY`; each pixel = scaled delta
  - `pointerup` on window clears drag state
  - Internal `$state` for drag origin; `$derived` for the notch rotation angle
- Keyboard: `ArrowUp` / `ArrowDown` adjust by one step (linear: (max−min)/100; log: one octave fraction). `Shift+Arrow` = 10 steps.

---

**`FrequencyStrip`**
- Purpose: Slim vertical bar showing a logarithmic 20Hz–20kHz scale with a moving marker at the current frequency value. On RoundResult, shows a second marker for the correct target.
- Props:
  - `value: number` (Hz) — user's current guess frequency
  - `targetValue?: number` (Hz) — correct target, shown only during `round_result` state
  - `showTarget?: boolean` (default `false`)
- Path: `src/lib/components/frequency-strip.svelte`
- Visual anatomy:
  - Container: `w-[120px] h-full flex flex-row`, `bg-card border border-border rounded-sm`
  - Layout: two columns — left label gutter `w-[80px]` + right bar `w-[40px]` (the actual colored frequency bar)
  - Label gutter: `relative` positioned; each tick label is `absolute right-1 text-[9px] font-mono text-muted-foreground leading-none` aligned to its tick's vertical position
  - Bar column: `bg-card border-l border-border relative` — tick marks are `absolute w-full border-t border-border` lines at each frequency position
  - User marker: `absolute w-full border-t-2 border-foreground/60`, transitions vertically with CSS `transition-[top]`. Position computed as `(1 - logFraction) * 100%` (log-space, 20Hz at bottom).
  - Target marker (when `showTarget=true`): `absolute w-full border-t-2 border-primary`, static (no transition after reveal).
- Log position formula: `pct = log(value/20) / log(20000/20)` → `top = (1 - pct) * 100%`

---

**`ABToggle`**
- Purpose: Paired monitor source selector buttons for switching between flat (A) and EQ'd (B) audio.
- Props:
  - `mode: 'A' | 'B'`
  - `onchange: (mode: 'A' | 'B') => void`
- Path: `src/lib/components/ab-toggle.svelte`
- Visual anatomy:
  - Two `button` elements side by side with `gap-0` and a shared `border border-border` container acting as a pill group
  - Each button: `w-8 h-8 text-xs font-mono font-semibold uppercase rounded-none`
  - Inactive state: `bg-muted text-muted-foreground`
  - Active/lit state: `bg-primary text-primary-foreground` (near-white fill — the "lit" monitor button)
  - No hover accent on active. Inactive hover: `hover:bg-muted/80`

---

**`KnobStrip`**
- Purpose: The SSL-strip style panel containing the three `RotaryKnob` components side by side, with shared background and border.
- Props:
  - `freqValue: number`
  - `gainValue: number`
  - `qValue: number`
  - `gainMin: number` (negative, e.g. −10)
  - `gainMax: number` (positive, e.g. +10)
  - `qMin: number`
  - `qMax: number`
  - `disabled?: boolean`
  - `onFreqChange: (v: number) => void`
  - `onGainChange: (v: number) => void`
  - `onQChange: (v: number) => void`
- Path: `src/lib/components/knob-strip.svelte`
- Visual: `Card.Root` with `flex flex-row items-center justify-around p-4 gap-6`. Internal dividers (`border-r border-border`) between the three knob slots.

---

**`RoundResult`**
- Purpose: The comparison panel shown after submitting a guess.
- Props:
  - `result: 'correct' | 'incorrect'`
  - `targetFreq: number`
  - `targetGainDb: number`
  - `targetQ: number`
  - `userFreq: number`
  - `userGainDb: number`
  - `userQ: number`
  - `errorMarginPct: number`
  - `isLastRound: boolean`
  - `onnext: () => void`
- Path: `src/lib/components/round-result.svelte`
- Notes: Uses `Card.Root` for the comparison table panel. Verdict uses a `badge` with `variant="outline"` and custom color class override.

---

**`GameOver`**
- Purpose: Final screen showing score and round history.
- Props:
  - `session: GameSession`
  - `onPlayAgain: () => void`
  - `onHome: () => void`
- Path: `src/lib/components/game-over.svelte`
- Notes: Round history is a `<table>` element with `role="table"`, `aria-label="Round history"`, styled with `font-mono tabular-nums text-sm`. Correct rows: `text-foreground`. Incorrect rows: `text-muted-foreground`.

---

### Reused components

- `src/lib/components/top-bar.svelte` — reused as-is on every screen
- `src/lib/components/ui/button/button.svelte` — reused for all interactive buttons
- `src/lib/components/ui/card/` — all Card sub-components reused as panels

---

## 4. States

### `DifficultyCard`

| State | Visual treatment |
|---|---|
| Default | `bg-card border-border text-foreground` |
| Hover | `bg-muted` (full card), cursor `pointer` |
| Focus | `ring-1 ring-ring ring-offset-1 ring-offset-background` (keyboard nav) |
| Active/pressed | `translate-y-px` (1px down, follows button.svelte base) |

---

### `RotaryKnob`

| State | Visual treatment |
|---|---|
| Default | `bg-card border-border`, notch at mapped angle, value label visible |
| Hover | `border-foreground/30` (subtle rim brightening) |
| Focus | `ring-1 ring-ring` on the knob circle |
| Dragging | `cursor-ns-resize` on `body` (set during drag); notch rotates live |
| Disabled | `opacity-50 pointer-events-none` |
| Pristine (never touched) | Value label shows `—` or the min value; Submit remains disabled |
| Post-result (read-only) | Same as disabled visually; knobs shown in result screen with submitted values |

---

### `FrequencyStrip`

| State | Visual treatment |
|---|---|
| Default (round active) | Single user marker `border-foreground/60`, slides smoothly |
| Result (showTarget=true) | Target marker `border-primary` appears; user marker dims to `border-muted-foreground` |
| Target marker appear | CSS `transition-opacity duration-300` fade-in on the target marker after a 150ms delay (suspense) |

---

### `ABToggle`

| State | Visual treatment |
|---|---|
| A active | A button: `bg-primary text-primary-foreground`; B button: `bg-muted text-muted-foreground` |
| B active | B button: `bg-primary text-primary-foreground`; A button: `bg-muted text-muted-foreground` |
| Hover (inactive button) | `bg-muted/80` |
| Focus | `ring-1 ring-ring` on the focused button |

---

### `Submit` button

| State | Visual treatment |
|---|---|
| Disabled (freq knob not moved) | `disabled:opacity-50 pointer-events-none` — exact disabled treatment from button.svelte |
| Enabled | `variant="default"` — `bg-primary text-primary-foreground` |
| Hover (enabled) | Slight opacity reduction from button base |
| Focus | `ring-1 ring-ring` |

---

### `RoundResult` verdict badge

| State | Visual treatment |
|---|---|
| Correct | `text-primary` (near-white), `border-primary/30`; prepended Lucide `Check` icon |
| Incorrect | `text-destructive`, `border-destructive/30`; prepended Lucide `X` icon |

---

### `Next Round` / `See Results` button

| State | Visual treatment |
|---|---|
| Default | `variant="outline"` |
| Hover | `bg-muted text-foreground` |
| Focus | `ring-1 ring-ring` |

---

### `GameOver` round history rows

| State | Visual treatment |
|---|---|
| Correct row | `text-foreground` |
| Incorrect row | `text-muted-foreground` |
| Result icon (✓) | Lucide `Check` size-3, `text-primary` |
| Result icon (✗) | Lucide `X` size-3, `text-destructive` |

---

## 5. Interactions

### Difficulty selection flow

1. User lands on `/games/frequency-id` → DifficultySelect screen renders.
2. User clicks a `DifficultyCard` → `onselect` fires → `createGameSession(difficulty)` runs → `gameState` transitions to `'round_active'` → RoundUI renders.
3. On transition to RoundUI, audio engine calls `play('B')` automatically (user hears EQ'd sample first as per US-006).
4. Back link (`← Back`) uses `href="/"` — no JS navigation needed.

### Rotary knob drag mechanics

- `pointerdown` on knob: call `el.setPointerCapture(e.pointerId)` (per PRD technical note). Store `dragStartY = e.clientY` and `dragStartValue = value`.
- `pointermove` (captured): `delta = dragStartY - e.clientY`. Positive delta = dragged up = increase.
- Sensitivity: `pixelsPerFullRange = 200`. Linear: `newValue = clamp(dragStartValue + (delta / pixelsPerFullRange) * (max - min), min, max)`. Log: convert to log space, apply delta, convert back.
- `pointerup` / `pointercancel`: release capture, clear drag state.
- Value fires `onchange` on every move (real-time update), not on release.
- Keyboard: `ArrowUp`/`ArrowDown` on focused knob = 1 step. `Shift+ArrowUp`/`Shift+ArrowDown` = 10 steps. Step size for linear = `(max - min) / 100`. Step size for log = multiply/divide by `Math.pow(max/min, 0.01)`.

Referenced Svelte 5 pattern: `$state` for `isDragging`, `dragStartY`, `dragStartValue`; `$derived` for `rotationDeg` (the notch visual angle). Per `$effect` docs: attach `pointermove`/`pointerup` listeners to `window` inside an `$effect` that cleans them up on destroy. The `<svelte:window>` element can also be used for `onpointermove` and `onpointerup` event binding.

### A/B toggle

- Clicking the inactive button immediately calls `FrequencyIdEngine.setMode(newMode)`.
- No debounce, no crossfade (per FR-10).
- The `mode` prop is the single source of truth; the page-level `$state` holds it.

### Submit enable condition

- A `$state` boolean `freqKnobMoved` starts `false`.
- The first `onchange` call from the Frequency `RotaryKnob` sets it `true`.
- Submit `disabled` prop is `$derived(() => !freqKnobMoved)`.
- On round transition (new round or play again), `freqKnobMoved` resets to `false`.

### Round progression transitions

- Submitting: `gameState` changes to `'round_result'`. KnobStrip switches to `disabled=true`. FrequencyStrip gains `showTarget=true` with a 150ms delay on the target marker opacity.
- Next Round: `gameState` → `'round_active'` for next round index. Knobs reset to center/default values. `freqKnobMoved` resets. Audio starts in B mode.
- See Results (round 5): `gameState` → `'game_over'`. Audio stops.
- Play Again: same `difficulty`, new `GameSession`, `currentRoundIndex = 0`, `gameState` → `'round_active'`. Audio restarts B mode.
- Back to Home: navigate to `/`.

### State transition animation

Use `transition:` directive on each screen view (`fade`, `duration: 150ms`) for a clean cut between DifficultySelect → RoundUI → RoundResult → GameOver. Per Svelte 5 `transition:` docs, `fade` from `svelte/transition` is appropriate. The knob value changes use no animation — raw DOM updates for latency-free feel.

### Keyboard shortcuts

| Key | Action |
|---|---|
| `Tab` | Move focus through interactive elements in DOM order |
| `Shift+Tab` | Reverse focus |
| `ArrowUp`/`ArrowDown` on focused knob | Adjust by 1 step |
| `Shift+ArrowUp`/`Shift+ArrowDown` on focused knob | Adjust by 10 steps |
| `Enter` / `Space` on Submit | Submit guess |
| `Enter` / `Space` on A/B button | Switch mode |
| `Enter` / `Space` on DifficultyCard | Select difficulty |
| `Enter` / `Space` on Next Round / Play Again | Advance |

### Scroll behavior

No scroll within the game screens. The RoundUI and RoundResult fit within the viewport. GameOver may scroll on very short viewports (history table); standard browser scroll applies. No custom scroll logic.

---

## 6. Accessibility

### ARIA roles and labels

- `FrequencyStrip` container: `role="img"` with `aria-label="Frequency scale, 20Hz to 20kHz. Current value: {formatted value}"`. Update `aria-label` reactively when `value` changes.
- `RotaryKnob` circle element: `role="slider"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, `aria-label="{label} in {unit}"`. Update `aria-valuenow` on every change.
- `ABToggle` group: wrap in `<div role="group" aria-label="Audio source">`. Each button: standard `<button>` with `aria-pressed` (`true` = active).
- Submit button: `aria-label="Submit frequency guess"` when enabled; `aria-disabled="true"` when disabled (not `disabled` attribute alone — use both for SR compatibility).
- RoundResult comparison table: `<table role="table" aria-label="Round result comparison">` with `<thead>`, `<tbody>`, proper `<th scope="col">`.
- GameOver history: `<table role="table" aria-label="Round history">`.
- Score on GameOver: wrap in `<p aria-live="polite">` so screen readers announce it on state change.
- Verdict on RoundResult: wrap in `<p aria-live="assertive">` — this is time-critical feedback.

### Keyboard navigation

- All interactive elements reachable by `Tab` in logical DOM order (top-to-bottom, left-to-right).
- `RotaryKnob` receives focus via `tabindex="0"` on the knob circle. Arrow key handling via `onkeydown`.
- A/B toggle buttons are standard `<button>` elements; no custom focus trap needed.
- DifficultyCard: `<button>` wrapping the card content; `tabindex="0"`.
- No focus traps anywhere on these screens (no dialogs).
- After round submission, focus moves to the `Next Round` button (programmatic `el.focus()` after state change).
- After clicking Play Again, focus moves to the Frequency knob (first interactive element in RoundUI).

### Color contrast

All text on dark backgrounds uses tokens that achieve WCAG AA (4.5:1 for normal text, 3:1 for large):

| Foreground token | Background token | Approx ratio |
|---|---|---|
| `--foreground` (`oklch(0.985 0 0)`) | `--background` (`oklch(0.145 0 0)`) | ~18:1 — AAA |
| `--foreground` | `--card` (`oklch(0.205 0 0)`) | ~14:1 — AAA |
| `--muted-foreground` (`oklch(0.708 0 0)`) | `--background` | ~5.8:1 — AA |
| `--muted-foreground` | `--card` | ~4.6:1 — AA |
| `--primary` (`oklch(0.922 0 0)`) | `--muted` (`oklch(0.269 0 0)`) | ~9:1 — AAA |
| `--destructive` (`oklch(0.704 0.191 22.216)`) | `--background` | verify — target AA |

The destructive red on near-black background should be verified at build time (it is a medium-chroma orange-red; the OKLCH value produces approximately 4.7:1 on `--background`).

### Focus indicators

All focusable elements use the global `outline-ring/50` from `layout.css` `@layer base`. Interactive Svelte components must not suppress `outline` with `outline-none` unless they provide an alternative `ring` style. The `button.svelte` base already uses `focus-visible:ring-1 focus-visible:ring-ring/50`. Custom components (RotaryKnob, FrequencyStrip) must replicate this pattern.

### Screen reader considerations

- `FrequencyStrip` is decorative for sighted users but informational for SR users. The `aria-label` with current value is the primary SR interface for this component. No need to expose tick positions to SR.
- `RotaryKnob` value changes should be reflected in `aria-valuenow` immediately on drag/keyboard (reactive attribute update). SR will announce the new value.
- The `aria-live="assertive"` on the verdict ensures SR users hear "CORRECT" or "INCORRECT" immediately without waiting for the next navigation.
- Avoid `aria-live` on the FrequencyStrip value (too chatty during drag); only announce on interaction end or on explicit key press.

---

## 7. Open Questions

- [x] **FrequencyStrip visibility on mobile:** Strip is `w-[120px]` with an 80px label gutter + 40px bar. On mobile (below `sm`), collapse to `w-10` (bar only, label gutter hidden with `hidden sm:flex`).


- [ ] **Knob default / reset value on new round:** When a new round starts, should all three knobs visually reset to a "center" position (mid-range for gain/Q, mid-log for frequency), or to the previously submitted values? Centering avoids priming the user; keeping previous values is confusing. Recommended: reset to center. Confirm. 

- [ ] **Audio autoplay on page load:** Browsers block autoplay for AudioContext until a user gesture. The first `play('B')` on round start requires the user to have interacted (they clicked a DifficultyCard). This should be safe, but confirm that the audio engine should not attempt to play during the `selecting_difficulty` state. The PRD's US-006 states "When the round starts, the B sample (EQ'd) should play first." This implies that the audio engine should wait to call `play('B')` until the first round starts, which only happens after difficulty selection. Confirm this flow.

- [ ] **Gain knob center-zero visual:** For the gain knob, the center position is 0 dB. Should the notch at the 12 o'clock position be visually distinguished (e.g., a brighter notch or a dot at 12 o'clock on the rim) to help the user find zero quickly? This is a UX nicety, not in the PRD. Recommended: add a small dot or line at the 12 o'clock position on the gain knob to indicate the 0 dB center point. Confirm this design choice.

- [x] **FrequencyStrip tick label placement:** Resolved — component is now `w-[120px]` with an 80px label gutter to the left of the 40px bar. Labels are `text-[9px] font-mono` right-aligned inside the gutter.


- [ ] **RoundResult knob display:** During `round_result`, should the knobs remain visible showing the user's submitted values, or should they be replaced by the text comparison table? The current wireframe shows them present but disabled. Confirm whether showing the knobs (disabled, frozen at user values) alongside the comparison panel is the intended UX. Showing them provides a visual link back to the user's input, but may be redundant with the table. Recommendation: keep them visible but disabled for continuity.

- [ ] **GameOver score emphasis:** Score `3 / 5` — should the number use the `--primary` token if it's a "good" score (e.g., ≥ 4/5) and `--destructive` if below some threshold? Or always monochrome? PRD does not specify; recommendation is always monochrome to avoid value judgments. Confirm this design choice.
