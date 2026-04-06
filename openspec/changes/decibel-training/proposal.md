## Why

Decibel sensitivity is the most fundamental audio skill — engineers must recognize level differences to balance mixes, set proper gain staging, and calibrate their monitoring. Decibel Training is the first exercise module because it proves the complete end-to-end loop: audio engine → exercise generation → A/B playback → user answer → evaluation → score persistence. All other modules follow the same pattern.

## What Changes

- Add `decibel.svelte.ts`: exercise generator (`generateExercise`) and evaluator (`evaluateAnswer`) with three difficulty tiers
- Add `AudioTransport.svelte`: play/stop button + A/B toggle — the shared transport UI all modules use
- Add `AnswerSlider.svelte`: styled range input with numeric readout — reused by panning module
- Add `FeedbackOverlay.svelte`: correct/incorrect overlay with correct answer reveal — reused by all modules
- Add `ScoreDisplay.svelte`: live score + streak readout — reused by all modules
- Add `DifficultySelector.svelte`: Easy/Medium/Hard toggle — reused by all modules
- Add `/exercise/decibel/+page.svelte`: wires all components into the complete exercise loop
- Add `/exercise/+layout.svelte`: shared exercise chrome (back button, module title, score bar)

## Capabilities

### New Capabilities
- `decibel-exercise`: Exercise generator and evaluator for dB change identification, with difficulty-based parameter ranges and tolerance scoring
- `audio-transport-ui`: Shared transport controls (play/stop/AB) used across all exercise modules
- `answer-slider-ui`: Reusable numeric range input for continuous answer types
- `feedback-ui`: Post-submission result overlay used across all exercise modules
- `score-display-ui`: Live score and streak component used across all exercise modules
- `difficulty-selector-ui`: Module difficulty toggle used across all exercise modules
- `exercise-layout`: Shared SvelteKit layout for all exercise route pages

### Modified Capabilities
<!-- none -->

## Impact

- Depends on: `audio-engine`, `score-storage`
- Shared components (AudioTransport, AnswerSlider, FeedbackOverlay, ScoreDisplay, DifficultySelector) are built here and reused by eq, panning, and compression modules
- Files: `src/lib/exercises/decibel.svelte.ts`, `src/lib/components/*.svelte`, `src/routes/exercise/`
