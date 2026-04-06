## Context

Stereo panning is perceived differently across listening environments — headphones give an exaggerated stereo image, speakers depend on room acoustics. The `StereoPannerNode` is the standard Web Audio API node for stereo placement; it uses the equal-power panning law, which is what most DAWs use. The input type changes by difficulty: easy uses a three-option multiple-choice (Left / Center / Right), medium and hard use a continuous slider with L/C/R labels.

## Goals / Non-Goals

**Goals:**
- `StereoPannerNode` for all panning (not `PannerNode` — that's 3D spatial audio, overkill)
- Same `AnswerSlider` component from decibel-training, just with panning units (L/C/R labels instead of dB)
- New `AnswerSelect` component for discrete multiple-choice (easy panning + all compression difficulties)
- Headphones notice: shown once, dismissible, persisted so it doesn't reappear

**Non-Goals:**
- Mid/side panning or surround sound
- Speaker calibration or room correction advice beyond the notice

## Decisions

**`StereoPannerNode` over `PannerNode`**
`StereoPannerNode` is a 2D stereo node (left/right balance). `PannerNode` is a 3D spatial audio node. We want stereo field awareness, not 3D positioning. `StereoPannerNode` maps directly to the pan knob in a DAW.

**Easy difficulty uses `AnswerSelect` (buttons), not slider**
Three buttons (L / C / R) are more appropriate for a beginner who cannot yet perceive fine gradations. Forcing them to use a continuous slider with no reference points creates frustration. The button layout also implicitly teaches the three core positions.

**Headphones notice persisted in settings store (`settings.headphonesNoticeDismissed`)**
The notice is informational, not a blocker. It appears on first visit to the panning page. Dismissing it sets a flag in the settings store (which auto-persists to localStorage). No modal or overlay — a dismissible banner is sufficient.

**`AnswerSelect` built as a generic multiple-choice component**
`options: { label: string; value: unknown }[]` makes it reusable for compression (yes/no, ratio choices, threshold choices). The value type is `unknown` with the parent asserting the type after the `select` event — this is simpler than a generic type parameter in a Svelte component context.

## Risks / Trade-offs

Mono audio samples panned with `StereoPannerNode` will produce the expected stereo effect. Stereo samples (drums, guitar loop) will be correctly panned as a stereo signal — no issue there either.

Users on laptop speakers may not perceive panning differences accurately → Mitigation: the headphones notice addresses this. The exercise still functions; accuracy will just be lower without headphones.
