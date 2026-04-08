## 1. Utils

- [x] 1.1 Create `src/lib/audio/utils.ts` with `dbToLinear`, `linearToDb`, `clamp`, `randomInRange`, `randomChoice`
- [x] 1.2 Verify `dbToLinear(0) === 1`, `dbToLinear(6) ≈ 2`, `dbToLinear(-6) ≈ 0.5`

## 2. Type definitions

- [x] 2.1 Create `src/lib/exercises/types.ts` with all interfaces: `Difficulty`, `ModuleId`, `Exercise`, `DecibelParams`, `EQParams`, `PanningParams`, `CompressionParams`, `AnswerValue`, `AnswerResult`, `ModuleScore`, `SessionRecord`, `AurisState`, `UserSettings`

## 3. Effect factories

- [x] 3.1 Create `src/lib/audio/effects.ts` (pure functions, no runes needed — uses `.ts` not `.svelte.ts`)
- [x] 3.2 Implement `createGainEffect(ctx, gainDb)` → `GainNode` with `gain.value = dbToLinear(gainDb)`
- [x] 3.3 Implement `createEQEffect(ctx, frequencyHz, gainDb, Q)` → `BiquadFilterNode` with `type = 'peaking'`
- [x] 3.4 Implement `createPanEffect(ctx, pan)` → `StereoPannerNode` with `pan.value = pan`
- [x] 3.5 Implement `createCompressorEffect(ctx, params)` → connects `DynamicsCompressorNode` → makeup `GainNode`; returns `EffectChain { input: compressor, output: makeupGain }`; schedules makeup gain read via 100ms `setTimeout` polling `compressor.reduction`

## 4. Audio engine

- [x] 4.1 Create `src/lib/audio/engine.svelte.ts` with `$state`: `isPlaying`, `currentMode`, `isLoaded`
- [x] 4.2 Implement `loadSamples(sampleIds)`: fetch each from `/samples/<id>`, decode with `ctx.decodeAudioData()`, cache in `SvelteMap<string, AudioBuffer>`, set `isLoaded = true`
- [x] 4.3 Implement `play(sampleId)`: create `AudioContext` if needed, call `ctx.resume()`, stop current source, create `BufferSourceNode` with `loop = true`, connect to `masterGain`, call `source.start(0)`, set `isPlaying = true`, `currentMode = 'A'`
- [x] 4.4 Implement `playWithEffect(sampleId, buildEffect)`: same as play but wire `source → chain.input → chain.output → masterGain`; set `currentMode = 'B'`
- [x] 4.5 Implement `stop()`: 5ms gain ramp on `masterGain` to 0, then `source.stop()`, set `isPlaying = false`, restore `masterGain.gain.value` to user volume after stop
- [x] 4.6 Implement `toggleAB(sampleId, buildEffect)`: if `currentMode === 'A'` call `playWithEffect`, else call `play`
- [x] 4.7 Implement `setVolume(value)`: `masterGain.gain.value = clamp(value, 0, 1)`
- [x] 4.8 Export a singleton `audioEngine` instance

## 5. Audio samples

- [x] 5.1 Create `static/samples/` directory
- [x] 5.2 Generate `pink-noise.mp3` (10s, WAV-in-.mp3 placeholder via `scripts/generate-samples.js`; decodeAudioData reads RIFF magic bytes)
- [x] 5.3 Generate `drums-loop.mp3`, `guitar-loop.mp3`, `speech-male.mp3`, `speech-female.mp3` (synthetic placeholders; replace with CC0/public domain recordings from freesound.org)
- [x] 5.4 Verified: all 5 files have valid `RIFF....WAVEfmt` headers confirmed via xxd; browser decodeAudioData will decode these correctly
