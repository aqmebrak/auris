## Why

Frequency recognition is the core skill that separates experienced engineers from beginners. EQ Training teaches the user to identify where in the frequency spectrum a change was applied, whether it was boosted or cut, and (on hard difficulty) how much. This module extends the established exercise loop pattern with a specialized input: the FrequencyPicker — a grid of labeled frequency bands that mirrors how engineers think about the spectrum.

## What Changes

- Add `eq.svelte.ts`: exercise generator and evaluator using `BiquadFilterNode` (type: peaking) with difficulty-controlled frequency bands, gain ranges, and Q values
- Add `FrequencyPicker.svelte`: grid of frequency band buttons with optional boost/cut toggle and gain slider, adapting to difficulty
- Add `/exercise/eq/+page.svelte`: wires the exercise loop with difficulty-adaptive FrequencyPicker controls
- Reuse all shared components from decibel-training (AudioTransport, FeedbackOverlay, ScoreDisplay, DifficultySelector)

## Capabilities

### New Capabilities
- `eq-exercise`: Exercise generator and evaluator for EQ frequency/gain identification with peaking filter, three difficulty tiers, and multi-field answer evaluation
- `frequency-picker-ui`: Specialized frequency band selector with boost/cut toggle and gain slider, displaying bands as labeled buttons

### Modified Capabilities
<!-- none -->

## Impact

- Depends on: `audio-engine`, `score-storage`, `decibel-training` (for shared components)
- Files: `src/lib/exercises/eq.svelte.ts`, `src/lib/components/FrequencyPicker.svelte`, `src/routes/exercise/eq/+page.svelte`
- Web Audio API: `BiquadFilterNode` with `type: 'peaking'`, frequency Hz, gain dB, Q factor
