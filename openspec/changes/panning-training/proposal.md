## Why

Stereo placement is essential for creating clear, professional mixes. Sound engineers must be able to hear and quantify pan positions accurately to place instruments in the stereo field and catch mono compatibility issues. Panning Training trains this skill from coarse detection (hard left / center / hard right on easy) to fine-grained positioning (10% increments on hard). It also introduces `AnswerSelect.svelte` — a multiple-choice button group reused by the compression module.

## What Changes

- Add `panning.svelte.ts`: exercise generator and evaluator using `StereoPannerNode`, with difficulty-appropriate position sets and tolerance scoring
- Add `AnswerSelect.svelte`: multiple-choice button group for discrete answer options — used on easy panning and all compression difficulties
- Add `/exercise/panning/+page.svelte`: renders AnswerSelect on easy, AnswerSlider on medium/hard; includes dismissible headphones recommendation notice
- Reuse all shared components from decibel-training

## Capabilities

### New Capabilities
- `panning-exercise`: Exercise generator and evaluator for stereo pan position identification, with discrete position sets and tolerance-based continuous scoring
- `answer-select-ui`: Multiple-choice button group for discrete answer types, reused by compression module

### Modified Capabilities
<!-- none -->

## Impact

- Depends on: `audio-engine`, `score-storage`, `decibel-training` (for shared components)
- Files: `src/lib/exercises/panning.svelte.ts`, `src/lib/components/AnswerSelect.svelte`, `src/routes/exercise/panning/+page.svelte`
- Web Audio API: `StereoPannerNode` with `pan.value` set to -1...+1
- UX note: requires headphones; notice is shown and dismissible (persisted in settings)
