# Audio Engine Spec

## audio-engine capability

**File:** `src/lib/audio/engine.svelte.ts`

**Exports (reactive state):**
- `isPlaying: boolean` — true while a source node is active
- `currentMode: 'A' | 'B'` — which version is playing
- `isLoaded: boolean` — true once all requested samples are decoded and cached

**Exports (methods):**

```typescript
loadSamples(sampleIds: string[]): Promise<void>
```
Fetches each `sampleId` from `/samples/<sampleId>`, decodes via `ctx.decodeAudioData()`, stores in `Map<string, AudioBuffer>`. If a buffer is already cached, skips without re-fetching. Sets `isLoaded = true` when all are done.

```typescript
play(sampleId: string): void
```
Plays sample dry (no effect). Stops any current playback first. Creates `AudioContext` if not yet created (lazy, user-gesture safe). Calls `ctx.resume()` if suspended. Sets `currentMode = 'A'`.

```typescript
playWithEffect(sampleId: string, buildEffect: (ctx: AudioContext) => AudioNode): void
```
Plays sample with an effect chain. The `buildEffect` function receives the `AudioContext` and returns the final `AudioNode` to connect to `masterGain`. Sets `currentMode = 'B'`.

```typescript
toggleAB(sampleId: string, buildEffect: (ctx: AudioContext) => AudioNode): void
```
If `currentMode === 'A'`, calls `playWithEffect`. If `currentMode === 'B'`, calls `play`. 5ms gain ramp applied to `masterGain` before stopping to prevent click artifacts.

```typescript
stop(): void
```
Ramps `masterGain` to 0 over 5ms, then calls `source.stop()`. Sets `isPlaying = false`.

```typescript
setVolume(value: number): void
```
Sets `masterGain.gain.value = value`. Range: 0–1. Immediate (no ramp).

**Behavior rules:**
- `AudioContext` is created once and reused; if `ctx.state === 'suspended'`, call `ctx.resume()` before playback
- All `AudioBufferSourceNode` instances have `loop = true`
- A permanent `masterGain: GainNode` sits between all source nodes and `ctx.destination`
- Calling `play()` or `playWithEffect()` while already playing stops the current source first

---

## audio-effects capability

**File:** `src/lib/audio/effects.svelte.ts`

```typescript
createGainEffect(ctx: AudioContext, gainDb: number): GainNode
```
Creates a `GainNode`. Sets `gain.value = dbToLinear(gainDb)`. Returns the node.

```typescript
createEQEffect(ctx: AudioContext, frequencyHz: number, gainDb: number, Q: number): BiquadFilterNode
```
Creates a `BiquadFilterNode`. Sets `type = 'peaking'`, `frequency.value = frequencyHz`, `gain.value = gainDb`, `Q.value = Q`. Returns the node.

```typescript
createPanEffect(ctx: AudioContext, pan: number): StereoPannerNode
```
Creates a `StereoPannerNode`. Sets `pan.value = pan`. Range -1 to 1. Returns the node.

```typescript
createCompressorEffect(ctx: AudioContext, params: CompressionParams): AudioNode
```
Creates a `DynamicsCompressorNode` with `threshold.value`, `ratio.value`, `knee.value`, `attack.value`, `release.value` set from params. Creates a downstream makeup `GainNode`. Connects compressor → makeupGain. Returns `makeupGain` as the output node. The makeup gain is set to `dbToLinear(-compressor.reduction)` — read after 100ms using `requestAnimationFrame` polling.

---

## audio-utils capability

**File:** `src/lib/audio/utils.ts`

```typescript
dbToLinear(db: number): number    // Math.pow(10, db / 20)
linearToDb(linear: number): number  // 20 * Math.log10(linear)
randomInRange(min: number, max: number, step?: number): number
  // Returns random float in [min, max]. If step provided, snaps to nearest step.
randomChoice<T>(array: T[]): T    // array[Math.floor(Math.random() * array.length)]
clamp(value: number, min: number, max: number): number  // Math.min(max, Math.max(min, value))
```
