# PRD: Frequency ID — Ear Training Exercise

## Introduction

Frequency ID is Auris's first interactive ear training exercise. The user listens to an audio sample processed in-browser via Web Audio API with a random EQ boost or cut, then uses three rotary knobs (frequency, gain, Q) to identify the applied EQ. The goal is to train the user's ability to recognize frequency characteristics by ear — a core skill for audio engineers.

## Goals

- Deliver a complete, playable 5-round game loop from difficulty selection to score screen
- Apply EQ processing in real-time via Web Audio API (BiquadFilterNode, no pre-processed files)
- Provide intuitive rotary knob controls styled after SSL console strips
- Allow A/B comparison between original (A, flat) and EQ'd (B) audio
- Save game results to localStorage
- Lay down a reusable core game engine (state machine, round types, scoring) for future exercises

## User Stories

### US-001: Core game engine — types, state machine, scoring
**Description:** As a developer, I need a typed game engine with a state machine, round tracking, and scoring so all future exercises can build on the same foundation.

**Acceptance Criteria:**
- [ ] `src/lib/game/types.ts` exports: `Difficulty`, `GameState`, `Round`, `GameSession`, `GameResult`
- [ ] `GameState` union: `'idle' | 'selecting_difficulty' | 'round_active' | 'round_result' | 'game_over'`
- [ ] `GameSession` tracks: `difficulty`, `rounds` (array of 5 `Round`), `currentRoundIndex`, `score`, `startedAt`, `endedAt`
- [ ] `Round` tracks: `targetFreq`, `targetGainDb`, `targetQ`, `userFreq`, `userGainDb`, `userQ`, `result: 'correct' | 'incorrect' | 'pending'`, `errorMarginPct`
- [ ] `src/lib/game/config.ts` exports `DIFFICULTY_CONFIG`: `{ easy: { gainRange: 3, qMin: 0.5, qMax: 1, errorMargin: 0.15 }, medium: { gainRange: 5, qMin: 0.5, qMax: 3, errorMargin: 0.10 }, hard: { gainRange: 10, qMin: 0.5, qMax: 10, errorMargin: 0.05 } }`
- [ ] `src/lib/game/engine.ts` exports `createGameSession(difficulty)` and `evaluateGuess(round, userFreq)` (returns `'correct' | 'incorrect'`)
- [ ] Scoring: 1 point per correct frequency guess (within error margin); max 5 points per game
- [ ] Typecheck passes

### US-002: Route scaffold + difficulty selection screen
**Description:** As a user, I want to navigate to `/games/frequency-id` and pick a difficulty before playing so I can control the challenge level.

**Acceptance Criteria:**
- [ ] Route: `src/routes/games/frequency-id/+page.svelte`
- [ ] Difficulty selection screen renders when game state is `idle` or `selecting_difficulty`
- [ ] Three difficulty buttons: Easy / Medium / Hard, each showing: gain range (e.g. "±3 dB"), error margin (e.g. "15% tolerance"), Q range (e.g. "Q 0.5–1")
- [ ] Clicking a difficulty initializes a new `GameSession` and transitions to `round_active`
- [ ] Back link (`← Back`) navigates to `/`
- [ ] Monochrome, minimalist — consistent with dashboard aesthetic
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-003: Web Audio API engine
**Description:** As a developer, I need an audio engine that loads an audio sample, applies a BiquadFilter for the B signal, and allows toggling between flat (A) and filtered (B) playback.

**Acceptance Criteria:**
- [ ] `src/lib/audio/frequency-id-engine.ts` exports class or composable `FrequencyIdEngine`
- [ ] `load(url: string): Promise<void>` — fetches and decodes audio via `AudioContext.decodeAudioData`
- [ ] `play(mode: 'A' | 'B'): void` — starts looping playback; A = flat (bypass filter), B = BiquadFilterNode type `"peaking"` applied
- [ ] `stop(): void` — stops playback
- [ ] `setFilter(freq: number, gainDb: number, q: number): void` — updates filter params in real-time
- [ ] `setMode(mode: 'A' | 'B'): void` — switches between A and B without restarting audio
- [ ] Audio loops continuously (`loop = true`)
- [ ] SSR-safe: AudioContext only instantiated in browser (guard with `typeof window !== 'undefined'`)
- [ ] Placeholder audio file at `static/audio/freq-id-placeholder.wav` (empty/silent; user will replace)
- [ ] Typecheck passes

### US-004: Rotary knob component
**Description:** As a user, I want to turn rotary knobs (SSL strip style) to set my frequency, gain, and Q guesses with an intuitive drag interaction.

**Acceptance Criteria:**
- [ ] `src/lib/components/RotaryKnob.svelte` — props: `value: number`, `min: number`, `max: number`, `label: string`, `unit: string`, `logarithmic?: boolean`, `onchange: (v: number) => void`
- [ ] Visual: circle ~44px diameter, monochrome fill, small notch indicator on the rim (like a pointer)
- [ ] Drag interaction: `pointerdown` + `pointermove` on `window`; drag **up** increases value, **down** decreases
- [ ] Frequency knob uses logarithmic mapping (`logarithmic={true}`); gain and Q use linear
- [ ] Value label displayed below knob, formatted: `1.2 kHz` / `-5 dB` / `2.4` (no unit for Q)
- [ ] Keyboard accessible: `ArrowUp`/`ArrowDown` adjust by 1 step, `Shift+Arrow` by 10 steps
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-005: Frequency strip display
**Description:** As a user, I want a slim vertical frequency strip showing 20Hz–20kHz with a marker at my selected frequency so I have spatial reference while sweeping.

**Acceptance Criteria:**
- [ ] `src/lib/components/FrequencyStrip.svelte` — prop: `value: number` (Hz)
- [ ] Vertical bar ~120px wide, full component height; left ~80px is a label gutter for tick labels, right ~40px is the colored frequency bar
- [ ] Logarithmic scale: 20Hz at bottom, 20kHz at top
- [ ] Labeled tick marks at: 20, 63, 125, 250, 500, 1k, 2k, 4k, 8k, 16k, 20k Hz
- [ ] Moving marker (horizontal line or small triangle) positioned at current `value`, transitions smoothly
- [ ] Monochrome, compact — matches overall DAW aesthetic
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-006: Game round UI — knobs, A/B switch, submit
**Description:** As a user, I want the main exercise UI with the frequency strip, three knobs, A/B toggle, and submit button during a round so I can make and submit my guess.

**Acceptance Criteria:**
- [ ] Round counter displayed: "Round 2 / 5"
- [ ] Layout: `FrequencyStrip` to the left of the frequency knob column
- [ ] Three `RotaryKnob` components in a vertical column (SSL strip style): Frequency (Hz, logarithmic, 20Hz–20kHz), Gain (dB, linear, ±difficulty range), Q (linear, difficulty qMin–qMax)
- [ ] A / B toggle buttons side by side; active button visually lit; clicking switches `FrequencyIdEngine.setMode()` instantly
- [ ] Audio autoplays in B mode when round starts (user hears the EQ'd sample first)
- [ ] "Submit" button disabled until user has moved the frequency knob at least once
- [ ] Submitting calls `evaluateGuess()`, saves result to current `Round`, transitions to `round_result`
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-007: Round result + game over screens
**Description:** As a user, I want clear feedback after each guess and a final score screen after 5 rounds so I can learn from my answers and choose to continue.

**Acceptance Criteria:**
- [ ] Round result view (state `round_result`):
  - Shows "Correct ✓" or "Incorrect ✗" in large text
  - Shows correct values: target freq (formatted), target gain (dB), target Q
  - Shows user's guess values side-by-side for comparison
  - Shows the allowed error margin (e.g. "±15% = ±150 Hz")
  - "Next Round" button (or "See Results" on round 5) → next state
- [ ] Game over view (state `game_over`):
  - Score as `X / 5`
  - List of all 5 rounds: round number, target freq, user guess, correct/incorrect
  - "Play Again" resets game with same difficulty (back to `round_active`, round 1)
  - "Back to Home" navigates to `/`
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-008: localStorage stats persistence
**Description:** As a user, I want my Frequency ID game results saved to localStorage so they appear in the Auris dashboard stats.

**Acceptance Criteria:**
- [ ] On game over, appends a `FrequencyIdResult` entry to localStorage key `auris_freq_id_history`
- [ ] `FrequencyIdResult` shape: `{ timestamp: string (ISO), difficulty: Difficulty, score: number, rounds: Round[] }`
- [ ] `src/lib/stats.ts` updated: `getStats()` returns two new fields: `freqIdGamesPlayed: number`, `freqIdBestScore: number | null`
- [ ] Dashboard stats panel (`src/routes/+page.svelte`) updated to display these two new stats
- [ ] Typecheck passes

## Functional Requirements

- FR-1: The B signal is produced by a `BiquadFilterNode` of type `"peaking"` inserted in the Web Audio graph; A uses the same source node with the filter bypassed (disconnect/reconnect, not gain=0)
- FR-2: Target frequency is randomly picked in log-space: `f = Math.round(80 * Math.pow(10000 / 80, Math.random()))` → uniform log distribution 80Hz–10kHz
- FR-3: Target gain is randomly picked: `±gainRange * Math.random()`, minimum absolute value of 1dB (never near-zero)
- FR-4: Target Q is randomly picked linearly within `[qMin, qMax]` for the difficulty
- FR-5: Correctness check: `Math.abs(userFreq - targetFreq) / targetFreq <= errorMargin`
- FR-6: Only frequency is scored; gain and Q guesses are displayed for learning, not evaluated
- FR-7: Frequency knob covers 20Hz–20kHz (display range); system targets are 80Hz–10kHz
- FR-8: Difficulty gain ranges: easy ±3dB, medium ±5dB, hard ±10dB
- FR-9: Difficulty Q ranges: easy 0.5–1, medium 0.5–3, hard 0.5–10 (Q=0 invalid in Web Audio API)
- FR-10: Audio loops continuously while playing; A/B mode switches are instantaneous (no crossfade)
- FR-11: A new `AudioBufferSourceNode` is created each time `play()` is called (source nodes are one-shot in Web Audio API)

## Non-Goals

- No backend, no user accounts, no server-side scoring
- No MIDI input or external hardware control
- No waveform visualizer or spectrogram display
- No hint system or frequency labels revealed during guessing
- No timed rounds (no countdown)
- No social/sharing features
- Gain and Q guesses are not scored (display only)
- No multi-band EQ (one frequency target per round)

## Design Considerations

- Follows the monochrome dark DAW aesthetic from `tasks/design-dashboard.md`
- SSL strip reference: knobs vertically stacked, compact, industrial look — circle with notch
- Frequency strip: slim vertical bar (logarithmic), left of the frequency knob
- A/B buttons: visually paired toggle, one always active — like a monitor source selector
- All OKLCH color tokens from `src/routes/layout.css`

## Technical Considerations

- All Web Audio API code must be SSR-safe (`browser` guard from `$app/environment` or `typeof window`)
- `AudioBufferSourceNode` is one-shot — recreate on each `play()` call
- Use Svelte 5 runes (`$state`, `$derived`, `$effect`) — no legacy `$:` reactive statements
- Knob drag: capture pointer with `setPointerCapture` on `pointerdown` for smooth out-of-element dragging
- Static audio files go in `static/audio/` — SvelteKit serves them as-is
- localStorage key: `auris_freq_id_history`
- Reuse `src/lib/stats.ts` pattern from dashboard

## Success Metrics

- User completes a full 5-round game from difficulty selection to score screen
- A/B switch is immediate and the filter is clearly audible with the placeholder audio
- Knob drag feels responsive — value updates in real-time as user drags
- Game results appear in dashboard stats after play

## Open Questions

- Should round result reveal a visual marker on the frequency strip showing the correct frequency vs. the user's guess? -- YES
- Should "Play Again" skip difficulty selection and immediately restart with same difficulty? YES
- Should gain/Q targets always be a boost (positive) or can they be a cut (negative)? Both a boost or a cut, chosen randomly. This adds variety and prevents users from just learning to listen for boosts. -- YES
