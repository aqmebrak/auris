## Context

The Web Audio API requires an `AudioContext` to be created or resumed after a user gesture due to browser autoplay policies. We need a centralized manager that handles this constraint, decodes MP3 files into `AudioBuffer` objects (an async operation), and exposes a simple playback API. All four exercise modules need A/B playback — playing the same audio sample dry vs. with an effect applied — without managing nodes themselves.

## Goals / Non-Goals

**Goals:**
- Single `AudioContext` instance for the app lifetime
- Buffer cache so samples are decoded once and replayed efficiently
- Pluggable effect chains: any module passes a builder function, the engine wraps it
- Reactive state (`isPlaying`, `currentMode`, `isLoaded`) via Svelte 5 `$state`
- No audio click artifacts on stop or A/B toggle

**Non-Goals:**
- Recording or microphone input
- Multi-track playback (one sample at a time)
- Offline/Service Worker audio caching (samples are small, network load is negligible)

## Decisions

**Lazy AudioContext creation (on first Play click)**
The browser suspends or blocks contexts created before a user gesture. Creating it lazily in the `play()` call guarantees compliance. Alternative: create on app mount with `ctx.resume()` on gesture — more complex, same result.

**`AudioBufferSourceNode` single-use pattern**
Web Audio API source nodes are fire-once; a new one must be created for each playback. The engine always creates a fresh `BufferSourceNode` in `play()`, connects it to the effect chain or directly to `masterGain`, and disposes after `stop()`. This is the standard Web Audio pattern.

**5ms gain ramp before stop/toggle**
`source.stop()` causes a click if the waveform is mid-cycle. A `linearRampToValueAtTime(0, currentTime + 0.005)` on `masterGain` before stop eliminates this. The ramp is short enough to be imperceptible.

**Effect chain is a builder function, not a config object**
`playWithEffect(sampleId, (ctx) => AudioNode)` gives maximum flexibility — any module can build any node topology without the engine knowing about it. Alternative: pass a typed config — more type-safe but requires engine changes for each new effect type.

**Module files use `.svelte.ts` extension**
Required for Svelte 5 runes (`$state`, `$effect`) to work outside `.svelte` files. Plain `.ts` files cannot use runes.

## Risks / Trade-offs

`AudioContext` suspended state → Mitigation: always call `ctx.resume()` at the start of `play()`, regardless of how the context was created.

MP3 loop gap → Some MP3 encoders add silence at the start/end due to frame padding. This creates a short gap when looping. Mitigation: use samples trimmed to clean loop points, or switch to WAV for looping samples if gap is audible.

First-play latency → `decodeAudioData` is async. If called on play, the first press has a delay. Mitigation: call `loadSamples()` eagerly on app mount (not in a gesture handler), so buffers are ready by the time the user clicks Play.
