# Auris — Audio Ear-Training App for Sound Engineers

## Context

Build a SvelteKit app that helps sound engineers sharpen their ears by playing audio samples with applied effects (gain, EQ, panning, compression) and having the user identify what changed. Scores are tracked locally. Dark/studio aesthetic.

## Tech Stack

- SvelteKit (Svelte 5 with runes) + TypeScript
- Tailwind CSS (dark DAW theme)
- Web Audio API (apply effects to bundled samples)
- localStorage (score persistence)
- `adapter-static` (pure SPA, no SSR, no backend)

## Project Structure

```
auris/
├── static/samples/                    # Bundled royalty-free audio (MP3, 44.1kHz, 192kbps)
│   ├── pink-noise.mp3
│   ├── drums-loop.mp3
│   ├── guitar-loop.mp3
│   ├── speech-male.mp3
│   └── speech-female.mp3
├── src/
│   ├── app.html
│   ├── app.css                        # Tailwind directives + DAW theme vars
│   ├── lib/
│   │   ├── audio/
│   │   │   ├── engine.svelte.ts       # AudioContext, buffer loading, A/B playback
│   │   │   ├── effects.svelte.ts      # Effect factory: gain, EQ, pan, compressor nodes
│   │   │   └── utils.ts              # dB<->linear, random param generators, clamp
│   │   ├── stores/
│   │   │   ├── scores.svelte.ts       # Reactive scores + localStorage auto-persist via $effect
│   │   │   └── settings.svelte.ts     # Volume, difficulty, sample prefs
│   │   ├── exercises/
│   │   │   ├── types.ts              # All TS interfaces (Exercise, AnswerValue, ModuleScore, etc.)
│   │   │   ├── decibel.svelte.ts      # Generate exercise + evaluate answer
│   │   │   ├── eq.svelte.ts
│   │   │   ├── panning.svelte.ts
│   │   │   └── compression.svelte.ts
│   │   └── components/
│   │       ├── AudioTransport.svelte   # Play/Stop + A/B toggle
│   │       ├── AnswerSlider.svelte     # Range input (dB, panning)
│   │       ├── AnswerSelect.svelte     # Multiple-choice (compression)
│   │       ├── FrequencyPicker.svelte  # Frequency band grid (EQ)
│   │       ├── ScoreDisplay.svelte     # Score + streak
│   │       ├── FeedbackOverlay.svelte  # Correct/incorrect result
│   │       ├── ProgressBar.svelte
│   │       ├── ModuleCard.svelte       # Dashboard card per module
│   │       └── DifficultySelector.svelte
│   └── routes/
│       ├── +layout.svelte             # App shell: nav, dark theme, global audio init
│       ├── +layout.ts                 # ssr = false, prerender = false
│       ├── +page.svelte               # Dashboard: module cards + overall progress
│       └── exercise/
│           ├── +layout.svelte         # Shared exercise chrome (back, score bar)
│           ├── decibel/+page.svelte
│           ├── eq/+page.svelte
│           ├── panning/+page.svelte
│           └── compression/+page.svelte
├── svelte.config.js
├── tailwind.config.js                 # DAW color palette, custom fonts
├── vite.config.ts
└── package.json
```

## Audio Architecture

**Engine** (`engine.svelte.ts`): Owns a single `AudioContext` (created on first user gesture). Loads samples via `fetch()` + `decodeAudioData()`, caches in a `Map<string, AudioBuffer>`. Exposes `play()`, `stop()`, `playWithEffect(sampleId, effectBuilder)`, `toggleAB()`. All sources loop. A permanent `masterGain` node sits before `destination`.

**Effects** (`effects.svelte.ts`): Pure functions that build Web Audio node chains:
- `createGainEffect(ctx, gainDb)` -> `GainNode`
- `createEQEffect(ctx, freq, gainDb, Q)` -> `BiquadFilterNode` (type: peaking)
- `createPanEffect(ctx, pan)` -> `StereoPannerNode`
- `createCompressorEffect(ctx, {threshold, ratio, knee, attack, release})` -> `DynamicsCompressorNode` + makeup `GainNode`

**A/B toggle**: Stops and restarts playback (no crossfade). 5ms gain ramp prevents clicks.

## Exercise Flow (all modules follow this pattern)

1. `generateExercise(difficulty)` -> random params + correct answer
2. User clicks Play -> engine plays sample with effect (B) or dry (A)
3. User toggles A/B to compare
4. User submits answer via slider/picker/select
5. `evaluateAnswer()` -> accuracy score (tolerance-based)
6. FeedbackOverlay shows result, score updates, localStorage persists
7. "Next" generates a new exercise

## Difficulty Progression

| Module | Easy | Medium | Hard |
|---|---|---|---|
| **Decibel** | +/-3/+/-6 dB, +/-2 tolerance | +/-1-6 dB in 1dB steps, +/-1 tolerance | +/-0.5-6 dB in 0.5dB steps, +/-0.5 tolerance |
| **EQ** | 3 bands (250/1k/4k), +/-6dB, wide Q -- identify freq only | 7 bands, +/-6dB -- identify freq + boost/cut | 7 bands, +/-3-9dB, narrow Q -- freq + boost/cut + gain |
| **Panning** | 3 positions (L/C/R) | 5 positions (L100/L50/C/R50/R100) | 10% increments, +/-10% tolerance |
| **Compression** | Detect yes/no | Identify ratio (2:1/4:1/8:1/20:1) | Identify threshold + ratio |

Auto-advance suggestion at 80% accuracy over 10 attempts. Step-down suggestion at 40%.

## Scoring

```
points = round(basePoints[difficulty] * accuracy + streakBonus)
basePoints: easy=10, medium=20, hard=30
accuracy: 0-1 (continuous for sliders, binary for multiple-choice)
streakBonus: min(streak, 10) * 2
streak increments at accuracy >= 0.8, resets at < 0.5
```

## Audio Samples

5 bundled files (~200-400KB total). Source from Freesound.org (CC0) or LibriVox (public domain):
- Pink noise (10s) -- ideal for EQ training
- Drum loop (~8 bars, 120 BPM) -- compression transients, panning
- Guitar/melodic loop (~8 bars) -- EQ harmonic content
- Male speech (10-15s) -- familiar reference
- Female speech (10-15s) -- different frequency profile

Format: MP3, 44.1kHz, 192kbps, stereo (mono for speech).

## Implementation Order

### Phase 1: Scaffolding
1. `npx sv create auris` (SvelteKit + TS + Svelte 5)
2. Add Tailwind CSS, configure `adapter-static`, set `ssr = false`
3. DAW dark theme in `tailwind.config.js`
4. `git init`, `.gitignore`

### Phase 2: Audio Core
5. `engine.svelte.ts` -- AudioContext, buffer loading, A/B playback
6. `effects.svelte.ts` -- all four effect factories
7. `utils.ts` -- dB/linear conversions, random helpers
8. `types.ts` -- all data model interfaces

### Phase 3: Storage
9. `scores.svelte.ts` -- reactive state + localStorage auto-persist
10. `settings.svelte.ts` -- user preferences

### Phase 4: First Module (Decibel) -- Prove the full loop
11. `decibel.svelte.ts` -- exercise generator + evaluator
12. `AudioTransport.svelte`, `AnswerSlider.svelte`, `FeedbackOverlay.svelte`, `ScoreDisplay.svelte`
13. `/exercise/decibel/+page.svelte` -- wire it all together end-to-end

### Phase 5: Remaining Modules
14. EQ module + `FrequencyPicker.svelte`
15. Panning module (reuse `AnswerSlider` with L/R labels)
16. Compression module + `AnswerSelect.svelte`

### Phase 6: Dashboard & Polish
17. Dashboard page with `ModuleCard.svelte` + `ProgressBar.svelte`
18. Root layout (nav), exercise layout (back button, score bar)
19. `DifficultySelector.svelte`
20. Visual polish -- glowing accents, meter animations, transitions

## Verification

1. `npm run dev` -- app loads without errors
2. Navigate to `/exercise/decibel` -- Play button works, A/B toggles audibly change volume
3. Submit answers -- feedback overlay shows, score persists across page refreshes (check localStorage)
4. Repeat for EQ, panning, compression modules
5. Dashboard shows accurate progress from scores
6. `npm run build` succeeds (static adapter)
