# Auris — Task Plan

## Status Legend
- ✅ Complete
- 🔄 In Progress
- ⬜ Pending
- ❌ Blocked

---

## Phase 1 — Foundation & Frequency ID MVP ✅

Core infrastructure + first working game.

| Task | Status | Notes |
|------|--------|-------|
| SvelteKit + Svelte 5 scaffold | ✅ | |
| Tailwind v4 + shadcn-svelte | ✅ | |
| Dark monochrome theme (oklch tokens) | ✅ | `src/routes/layout.css` |
| Top-bar navigation | ✅ | `src/lib/components/top-bar.svelte` |
| Dashboard with game card grid | ✅ | `src/routes/+page.svelte` |
| Stats panel (localStorage) | ✅ | `src/lib/stores/stats-store.svelte.ts` |
| Frequency ID game state machine | ✅ | `src/routes/games/frequency-id/+page.svelte` |
| FrequencyIdEngine (Web Audio, A/B routing) | ✅ | `src/lib/audio/chain.ts` |
| FreqStrip (log selector, touch+mouse) | ✅ | `src/lib/components/freq-strip.svelte` |
| A/B toggle component | ✅ | `src/lib/components/ab-toggle.svelte` |
| Playwright e2e — dashboard card grid | ✅ | `src/routes/dashboard.e2e.ts` |

---

## Phase 2 — UI Polish + Game UX Fixes ✅

Fixes found during first playthrough on a 33" screen.

| Task | Status | Notes |
|------|--------|-------|
| Neon fuchsia primary accent | ✅ | `oklch(0.7 0.28 340)` |
| Layout widened to `max-w-7xl` | ✅ | |
| Game card button spacing | ✅ | |
| Stats panel — larger numbers | ✅ | `text-3xl` |
| FreqStrip — taller, ±⅓ oct band on hover | ✅ | `min-h-55` |
| Game page — play/pause, A/B, REPLAY | ✅ | |
| Remove `listening…` intermediate phase | ✅ | |
| Hide BOOST/CUT during guessing | ✅ | |
| WAV music samples (7 tracks) | ✅ | `static/audio/` |
| Delete dead `src/lib/audio.ts` | ✅ | |
| All quality checks green | ✅ | |

---

## Phase 3 — Generic Game Engine Foundation ✅

Reusable game framework so every new game plugs in without reinventing round/score/audio logic.

| Task | Status | Notes |
|------|--------|-------|
| `src/lib/game/types.ts` — generic types | ✅ | `GameConfig<TRound, TGuess>`, `Phase`, `RoundBase` |
| `src/lib/game/session.ts` — pure functions | ✅ | `createSession`, `submitGuess`, `nextRound`, `scoreSession` |
| `src/lib/game/config.ts` — `defineGame` helper | ✅ | |
| `src/lib/stores/game-store.svelte.ts` — reactive factory | ✅ | `createGameStore<TR,TG>(config)` |
| `src/lib/stores/stats-store.svelte.ts` — per-game persistence | ✅ | `auris:stats:{gameId}` |
| `src/lib/audio/player.ts` — game-agnostic audio | ✅ | |
| `src/lib/audio/effects.ts` — effect node factories | ✅ | `createPeakingEq` |
| `src/lib/audio/chain.ts` — `AudioChain` A/B routing | ✅ | |
| `src/lib/audio/samples.ts` — sample list + `pickTrack()` | ✅ | |
| Shared game UI components (`game/`) | ✅ | `game-header`, `playback-controls`, `game-over`, `round-result` |
| Freq ID ported to new engine | ✅ | `src/lib/games/freq-id/` |
| All tests pass, no regression | ✅ | |
| `src/lib/game/README.md` | ✅ | How to add a new game |

---

## Phase 4 — Frequency ID Depth ✅

More educational and replayable. Just extend the config — engine handled everything else.

| Task | Status | Notes |
|------|--------|-------|
| Difficulty levels (Easy/Medium/Hard) | ✅ | ±1 oct / ±⅓ oct / ±¼ oct margin |
| Frequency zones (Full/Lows/Mids/Highs) | ✅ | FreqStrip rescales range + ticks |
| Gain variety (6/9/12 dB random) | ✅ | |
| Stats persistence + per-band heatmap | ✅ | `freq-id-heatmap.svelte` on dashboard |
| Round count config (3/5/10) | ✅ | |
| Result animations (pulse / shake) | ✅ | CSS keyframes in `layout.css` |

---

## Phase 5 — Second Game ✅

Panning ID — hear a panned signal, guess the stereo position.

| Task | Status | Notes |
|------|--------|-------|
| Choose game type | ✅ | Panning ID |
| Implement game config + audio | ✅ | `src/lib/games/panning/config.ts`, `audio.ts` |
| StereoStrip component | ✅ | `src/lib/components/stereo-strip.svelte` |
| Implement UI | ✅ | `src/routes/games/panning/+page.svelte` |
| Register on dashboard | ✅ | `src/routes/+page.svelte` |
| Tests + quality checks | ✅ | `pnpm check` ✅ `pnpm lint` ✅ |

