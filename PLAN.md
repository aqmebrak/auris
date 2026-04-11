# Auris — Development Plan

Iterative, phase-based. Each phase is a logical unit of shippable work.
Check items off as they land on `main`.

---

## Phase 1 — Foundation & Frequency ID MVP ✅

Core infrastructure + first working game.

- [x] SvelteKit + Svelte 5 scaffold
- [x] Tailwind v4 + shadcn-svelte component library
- [x] Dark monochrome theme (oklch tokens)
- [x] Top-bar navigation
- [x] Dashboard with game card grid
- [x] Stats panel (localStorage persistence)
- [x] Frequency ID game — state machine (`idle → guessing → roundResult → gameOver`)
- [x] FrequencyIdEngine — Web Audio API, A/B routing (dry vs peaking EQ), WAV buffer cache
- [x] FreqStrip — logarithmic frequency selector, touch + mouse
- [x] A/B toggle component
- [x] Playwright e2e — dashboard card grid

---

## Phase 2 — UI polish + Game UX fixes ✅

Fixes found during first playthrough on a 33" screen.

- [x] Neon fuchsia primary accent `oklch(0.7 0.28 340)` applied to primary elements
- [x] Layout widened to `max-w-7xl` (top-bar, dashboard, game page)
- [x] Game card button spacing — breathing room, centered PLAY (fuchsia), no `w-full` stretch
- [x] Stats panel — larger numbers (`text-3xl`), bolder labels
- [x] FreqStrip — taller (`min-h-55`), ±1/3 octave margin-of-error band on hover, fuchsia cursor
- [x] Game page — play/pause, A/B toggle, REPLAY button wired to engine
- [x] Remove `listening…` intermediate phase — PLAY → guessing directly
- [x] Hide BOOST/CUT + dB during guessing; reveal in round result as learning feedback
- [x] WAV music samples replace pink noise (7 rock/metal/drum tracks)
- [x] Delete dead `src/lib/audio.ts` (pink-noise engine)
- [x] `pnpm check` + `pnpm lint` + `pnpm test:e2e` all green

---

## Phase 3 — Frequency ID depth (next)

Make the game more educational and replayable.

- [ ] **Difficulty levels** — Easy (±1 octave margin, ±6 dB), Medium (±1/3 oct, ±12 dB), Hard (±1/4 oct, ±6 dB)
- [ ] **Frequency zones** — let user practice specific bands (lows, mids, highs) instead of full 20–20k
- [ ] **Gain variety** — randomise dB between 6 / 9 / 12 instead of fixed ±12
- [ ] **Stats persistence** — track per-frequency-zone accuracy over time, show heatmap on dashboard
- [ ] **Round count config** — 3 / 5 / 10 rounds per session
- [ ] **Result animation** — brief pulse on correct guess (green glow), shake on wrong

---

## Phase 4 — Second game

New ear-training exercise. Run `/prd` to spec it out before implementation.

- [ ] **Dynamic EQ** — identify whether EQ boost is on attack, sustain, or tail of a transient
- [ ] **Level matching** — match two signals by ear (volume training)
- [ ] **Reverb type ID** — identify hall / room / plate / spring by listening
- [ ] **Compression ratio ID** — hear heavily vs. lightly compressed and match

Pick one. Write PRD first.

---

## Phase 5 — Auth + Cloud sync

Currently all state is localStorage. Add optional account for cross-device sync.

- [ ] Drizzle schema: `users`, `sessions`, `game_results`
- [ ] Auth (Lucia or better-auth)
- [ ] Sync stats to DB on game-over
- [ ] Dashboard: show lifetime stats from DB when logged in

---

## Phase 6 — Polish & Deploy

- [ ] PWA manifest + service worker (offline WAV caching)
- [ ] `og:image` + metadata for sharing
- [ ] Vercel analytics
- [ ] Lighthouse audit — target 95+ performance, 100 a11y
- [ ] README with setup instructions
