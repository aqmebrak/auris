# Gotchas and decisions

Non-obvious facts about this codebase — things the code and config do not say. Read the section for the area you are touching.

## Product

- **Audience: mixing engineers working on rock and metal.** Samples are rock/metal on purpose (dense distorted guitars, loud drums); tune ranges and difficulty to that, never propose other genres.
- **No backend.** Progress lives in localStorage (`auris:stats:{gameId}`). Drizzle/Neon/Better Auth were removed; the Vercel project still has an unused Neon integration. Accounts are only worth adding if gamification goes deep.
- **Sample licences are unverified** (freesound, see `scripts/sample-meta.json`) — resolve before any public release.

## Svelte / tooling

- `$derived(expr)`, never `$derived(() => expr)` (the latter stores a function).
- `{#each}` needs a key, and an unused item variable fails lint — use `Array.from({ length: n }, (_, i) => i) as i (i)`. Variables prefixed `_` are exempt from `no-unused-vars`.
- Serena cannot parse `.svelte` files — use Read/Edit there.
- pnpm 11: `pnpm update`/`add` writes a placeholder `allowBuilds` entry (`set this to true or false`) into `pnpm-workspace.yaml`; set it to `true` for packages you trust (esbuild, ffmpeg-static).
- Adding a route can break `svelte-check` in `ui/button/button.svelte` (SvelteKit's `resolve()` route union grows too big for TS). The `href as '/'` cast there is deliberate.
- Vitest needs the `$lib` alias, defined in `vitest.config.ts`.
- `pkill -f <pattern>` kills your own shell when the pattern appears in the command; use `fuser -k PORT/tcp`.

## Audio

- **Web Audio `Q` for lowpass/highpass is in dB**, not linear — convert with `qToDb` (`audio/eq-math.ts`). Butterworth: 12 dB/oct = Q 0.7071; 24 dB/oct = two stages, Q 0.5412 and 1.3066.
- `DelayNode` delays under a few samples are interpolated (a 0.1 ms comb notch is about −29 dB, not a full null).
- **Do not use `DynamicsCompressorNode` for ear training** (fixed lookahead/knee, vague attack/release). Dynamics uses its own `CompressorDsp` (`audio/compressor-dsp.ts`), shared by an AudioWorklet and offline analysis; `?worker&url` bundles the worklet fine with Vite + adapter-vercel.
- **A/B must be level-matched** or louder wins. EQ/filter games cancel the loudness change from the sample's average spectrum (`createCompensatedPlayable` + `compensationFromResponse`); Dynamics auto-computes makeup gain; Stereo Width compensates analytically. Phase/Comb plays mono for _both_ paths so a stereo fold-down never differs between A and B.
- `AudioChain`: A = dry, B = effected. Dual-path engines (EQ Matching, Dynamics): both paths effected so you compare your settings with the target, not with dry.
- Dynamics' gain-reduction meter must stay dark on the target path — it would reveal the answer.
- FLAC for samples: gapless loops (lossy codecs add priming gaps).

## Samples

- Pipeline: raw files in `samples-src/` (gitignored) → `pnpm samples` → `static/audio/*.flac` + generated `src/lib/audio/library.json` + `CREDITS.md`. See `scripts/README.md`.
- Pick fair targets: choose the sample first, then frequencies where it can reveal the change (`audibleFreqs`/`isAudible`/`audibleCutoffs`; boost ≥ −30 dB, cut ≥ −20 dB re the loudest 1/3-octave band). Generators take an optional `sample` so tests can inject a synthetic spectrum.
- `sideDb` is stereo side/mid energy; −60 means dual-mono. Two current samples (`rockin`, `rock-seq`) are dual-mono — use `pickSample({ channels: 2, minSideDb: -20 })` for anything stereo.
- New analysis fields: add to `analyze()` in `scripts/prepare-samples.ts`, then `pnpm samples --reanalyze` (works from the committed FLACs).

## Scoring

- Binary games set `evaluateGuess`; graded games also set `scoreGuess` (0..1) and `passThreshold` — a graded round is correct when its score reaches the threshold.
- Continuous guesses use `score = max(0, 1 − error / (2·margin))` with `passThreshold 0.5`, so a round is correct exactly when the error is within the margin. Easy = buttons on snap values; Medium/Hard = the strip.
- EQ Matching's `matchScore` normalises by _target + guess_ energy. Normalising by the target alone scored every misplaced band 0 and made partial credit impossible.

## Game pages and tests

- **No layout shift between game states.** Anything shown in a later state of a round is rendered from the start, disabled; secret values use a `masked` prop rather than being removed. `GameShell` gives each game one `board(round, ui)` snippet that renders in idle, playing and result (`ui.interactive`, `ui.revealed`).
- The board stays mounted between phases, so the controller drops focus on submit/next — otherwise a focused strip swallows the Enter/Space shortcuts.
- Option-dependent resets belong in the controller's `onOptionsChange`, not in a button handler (the shell can apply a difficulty suggestion).
- Name A/B buttons by what they are (Target, Your EQ, Original, EQ'd), never "A"/"B". Graphs are large on desktop and taller on mobile; check at ~402 px width.
- New game checklist: `games/registry.ts` (a test enforces route ↔ registry parity), `routes/games/game-fixtures.ts` (drives the session and layout-stability E2E), controller `gameId` equal to the registry id.
- E2E: REPLAY exists but is disabled in idle — wait for `toBeEnabled()` to know a round is playing. Keyboard shortcuts are ignored while a button has focus, so blur first. Don't hardcode dashboard card counts.
