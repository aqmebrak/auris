## Context

`DynamicsCompressorNode` reduces level above a threshold. The problem for ear training is that if A (dry) and B (compressed) differ in loudness, the user is identifying a volume change, not compression character. We solve this with makeup gain: read `compressor.reduction` after audio starts playing and apply an equal-and-opposite gain boost downstream. The `reduction` property is a read-only `AudioParam` that reflects the current gain reduction in dB — applying `-reduction` dB of makeup gain level-matches the output.

## Goals / Non-Goals

**Goals:**
- Level-matched A/B comparison using makeup gain from `compressor.reduction`
- Three task types that progress logically: detect → identify ratio → identify threshold and ratio
- Reuse `AnswerSelect` for all answer inputs (binary, single-select, dual-select)
- Hard difficulty uses two independent `AnswerSelect` instances (threshold + ratio)

**Non-Goals:**
- Training attack/release time recognition (audible but too subtle for beginners; can be added as a phase-2 hard+ difficulty)
- Multiband compression (single-band `DynamicsCompressorNode` only)
- Limiting detection (ratio 20:1 is effectively limiting — sufficient for this scope)

## Decisions

**Makeup gain via `compressor.reduction` property**
`compressor.reduction` is updated in real-time as the compressor processes audio. On page load, sample a few hundred milliseconds of playback, read the mean reduction, then set `makeupGain.gain.value = dbToLinear(-reduction)`. Alternatively: calculate the expected reduction from threshold/ratio math for a given RMS level — but reading the actual node property is more accurate since it accounts for attack/release behavior.

**Easy difficulty: compression vs. no-compression (not binary on/off)**
On easy, the exercise either applies compression (ratio 4:1, threshold -20) or bypasses it (ratio 1:1 — effectively no compression since a 1:1 ratio passes signal through unchanged). The user hears either a dynamically compressed signal or the dry signal, and answers yes/no. This is simpler than an explicit bypass because it uses the same node graph regardless.

**Hard difficulty: two independent AnswerSelect instances**
The page renders one `AnswerSelect` for threshold and a second for ratio. Each is evaluated independently. Accuracy is the average of both (0, 0.5, or 1). This structure is visible in the feedback as two separate correct/wrong indicators.

**Fixed attack and release for all difficulties**
Attack: 10ms, release: 200ms (typical bus compression settings). Varying these would add too many variables for ear training. Users first learn to identify compression presence and ratio; attack/release are left for a future advanced module.

## Risks / Trade-offs

`compressor.reduction` is 0 when no audio is playing, and takes a few milliseconds to stabilize after playback starts → Mitigation: read it after a 100ms delay, or average it over the first second of playback. Use `requestAnimationFrame` polling loop until stable.

Makeup gain compensation is approximate for dynamic material (reduction fluctuates) → This is acceptable; the goal is rough level matching, not loudness normalization. The user is focused on timbral character.
