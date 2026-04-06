## 1. Exercise logic

- [ ] 1.1 Create `src/lib/exercises/compression.svelte.ts`
- [ ] 1.2 Define `DIFFICULTY_CONFIG` for easy (detect), medium (ratio), hard (threshold + ratio)
- [ ] 1.3 Implement `generateExercise(difficulty, sampleId?)`: pick random threshold/ratio per difficulty, build `Exercise` with `CompressionParams` (ratio 1 for easy no-compression case)
- [ ] 1.4 Implement `evaluateAnswer(exercise, userAnswer)`: easy binary detected, medium binary ratio, hard average of threshold + ratio matches

## 2. Effect factory update (if needed)

- [ ] 2.1 Verify `createCompressorEffect` in `effects.svelte.ts` properly reads `compressor.reduction` after 100ms and applies makeup gain
- [ ] 2.2 Verify ratio 1:1 still creates the compressor node (no special-casing for bypass) so the node graph is identical

## 3. Compression exercise page

- [ ] 3.1 Create `src/routes/exercise/compression/+page.svelte`
- [ ] 3.2 Initialize state: exercise, detected (null), selectedRatio (null), selectedThreshold (null), result (null)
- [ ] 3.3 Wire AudioTransport → engine: dry on A, `playWithEffect` with `createCompressorEffect` on B
- [ ] 3.4 Render easy UI: single `AnswerSelect` with Yes/No options
- [ ] 3.5 Render medium UI: single `AnswerSelect` with 2:1 / 4:1 / 8:1 / 20:1 options
- [ ] 3.6 Render hard UI: two stacked `AnswerSelect` — one for threshold (-10/-20/-30/-40 dBFS), one for ratio
- [ ] 3.7 Disable submit until required selections are made for current difficulty
- [ ] 3.8 Handle submit: build userAnswer object from selected values, call `evaluateAnswer`, call `scores.recordAnswer`, set result
- [ ] 3.9 On hard: show two separate correct/wrong indicators in feedback (threshold and ratio)
- [ ] 3.10 Handle next — reset state, generate new exercise
- [ ] 3.11 Test: easy (yes/no), medium (ratio selector), hard (dual selectors), makeup gain makes levels match
