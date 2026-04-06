## 1. Utils

- [ ] 1.1 Create `src/lib/audio/utils.ts` with `dbToLinear`, `linearToDb`, `clamp`, `randomInRange`, `randomChoice`
- [ ] 1.2 Verify `dbToLinear(0) === 1`, `dbToLinear(6) ≈ 2`, `dbToLinear(-6) ≈ 0.5`

## 2. Type definitions

- [ ] 2.1 Create `src/lib/exercises/types.ts` with all interfaces: `Difficulty`, `ModuleId`, `Exercise`, `DecibelParams`, `EQParams`, `PanningParams`, `CompressionParams`, `AnswerValue`, `AnswerResult`, `ModuleScore`, `SessionRecord`, `AurisState`, `UserSettings`

## 3. Effect factories

- [ ] 3.1 Create `src/lib/audio/effects.svelte.ts`
- [ ] 3.2 Implement `createGainEffect(ctx, gainDb)` → `GainNode` with `gain.value = dbToLinear(gainDb)`
- [ ] 3.3 Implement `createEQEffect(ctx, frequencyHz, gainDb, Q)` → `BiquadFilterNode` with `type = 'peaking'`
- [ ] 3.4 Implement `createPanEffect(ctx, pan)` → `StereoPannerNode` with `pan.value = pan`
- [ ] 3.5 Implement `createCompressorEffect(ctx, params)` → connects `DynamicsCompressorNode` → makeup `GainNode`; returns markup `GainNode`; schedules makeup gain read via 100ms `setTimeout` polling `compressor.reduction`

## 4. Audio engine

- [ ] 4.1 Create `src/lib/audio/engine.svelte.ts` with `$state`: `isPlaying`, `currentMode`, `isLoaded`
- [ ] 4.2 Implement `loadSamples(sampleIds)`: fetch each from `/samples/<id>`, decode with `ctx.decodeAudioData()`, cache in `Map<string, AudioBuffer>`, set `isLoaded = true`
- [ ] 4.3 Implement `play(sampleId)`: create `AudioContext` if needed, call `ctx.resume()`, stop current source, create `BufferSourceNode` with `loop = true`, connect to `masterGain`, call `source.start(0)`, set `isPlaying = true`, `currentMode = 'A'`
- [ ] 4.4 Implement `playWithEffect(sampleId, buildEffect)`: same as play but wire `source → effectNode → masterGain`; set `currentMode = 'B'`
- [ ] 4.5 Implement `stop()`: 5ms gain ramp on `masterGain` to 0, then `source.stop()`, set `isPlaying = false`, restore `masterGain.gain.value` to user volume after stop
- [ ] 4.6 Implement `toggleAB(sampleId, buildEffect)`: if `currentMode === 'A'` call `playWithEffect`, else call `play`
- [ ] 4.7 Implement `setVolume(value)`: `masterGain.gain.value = clamp(value, 0, 1)`
- [ ] 4.8 Export a singleton `audioEngine` instance

## 5. Audio samples

- [ ] 5.1 Create `static/samples/` directory
- [ ] 5.2 Download or generate `pink-noise.mp3` (10s, CC0) and place in `static/samples/`
- [ ] 5.3 Download `drums-loop.mp3`, `guitar-loop.mp3`, `speech-male.mp3`, `speech-female.mp3` (CC0/public domain) and place in `static/samples/`
- [ ] 5.4 Verify each file loads and plays via a temporary test page
