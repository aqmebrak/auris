## Why

Compression is the most misunderstood tool in audio production. Engineers who can hear the effect of different thresholds and ratios make better mixing decisions and troubleshoot pumping and over-compression faster. Compression Training progresses from simply detecting whether compression is applied (easy) to identifying ratio (medium) to identifying both threshold and ratio (hard). A critical detail: makeup gain is applied after the compressor so the user hears timbral character, not just a volume reduction.

## What Changes

- Add `compression.svelte.ts`: exercise generator and evaluator using `DynamicsCompressorNode`, with makeup gain compensation, three task modes (detect / ratio / threshold+ratio)
- Add `/exercise/compression/+page.svelte`: adapts answer UI per difficulty — yes/no on easy, single ratio selector on medium, dual selectors on hard
- Reuse `AnswerSelect.svelte` (from panning-training) for all answer inputs
- Reuse all other shared components from decibel-training

## Capabilities

### New Capabilities
- `compression-exercise`: Exercise generator and evaluator for compression identification, with makeup gain compensation, three difficulty task modes, and per-parameter binary scoring

### Modified Capabilities
<!-- none -->

## Impact

- Depends on: `audio-engine`, `score-storage`, `decibel-training` (shared components), `panning-training` (AnswerSelect)
- Files: `src/lib/exercises/compression.svelte.ts`, `src/routes/exercise/compression/+page.svelte`
- Web Audio API: `DynamicsCompressorNode` (threshold, ratio, knee, attack, release) + downstream makeup `GainNode`
- Makeup gain calculation: read `compressor.reduction` after audio starts, apply `makeupGain.gain.value = dbToLinear(-compressor.reduction)`
