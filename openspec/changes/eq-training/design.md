## Context

EQ identification requires a different input metaphor than a simple slider. Engineers don't think in arbitrary numbers — they think in frequency bands (250 Hz, 1 kHz, 4 kHz) and directions (boost vs. cut). The `FrequencyPicker` must present these as labeled buttons rather than a continuous range, matching the mental model of a graphic EQ or parametric EQ plugin. The component has three complexity levels driven by difficulty, so it must adapt its visible controls without requiring different components per difficulty.

## Goals / Non-Goals

**Goals:**
- Frequency bands presented as labeled buttons, not a number slider
- Single component (`FrequencyPicker`) that adapts to easy/medium/hard via props
- Peaking `BiquadFilterNode` for the EQ effect (most common real-world EQ type)
- Multi-field answer evaluation that scores each field independently on hard

**Non-Goals:**
- High-shelf, low-shelf, or notch filter types (peaking is sufficient for training)
- Visual frequency spectrum display (would require FFT analysis — out of scope)
- Sub-band frequency sweeping within a band (users select from fixed bands only)

## Decisions

**`BiquadFilterNode` with `type: 'peaking'`**
Peaking is the standard parametric EQ boost/cut. It's what engineers use most in practice. Low-shelf and high-shelf were considered but add complexity without proportional training benefit.

**Q values by difficulty (1.0 / 2.0 / 4.0)**
Wide Q on easy means the frequency change is more audible and easier to localize. Narrow Q on hard isolates the change, making it harder to distinguish from adjacent bands. This is a deliberate difficulty progression, not an arbitrary choice.

**FrequencyPicker adapts via props, not separate components**
`showBoostCut` and `showGain` props toggle visibility of the additional controls. This keeps one component interface and one test surface. Alternative (separate EasyPicker, MediumPicker, HardPicker) would triple the component count for no behavioral difference.

**Multi-field accuracy averaging on hard**
On hard, the final accuracy is the average of frequency accuracy (binary: band matches or not) + boost/cut accuracy (binary) + gain accuracy (continuous within ±3dB tolerance). This rewards partial knowledge — knowing the frequency is right but the gain is off still earns partial points.

## Risks / Trade-offs

On easy difficulty with only 3 frequency bands, the user has a 1-in-3 chance of guessing correctly → Expected. Easy difficulty is for beginners; the streak and difficulty progression system provides incentive to advance.

Pink noise is the most useful sample for EQ training (flat spectrum makes boosts/cuts obvious), but music loops may hide subtle EQ changes → Mitigation: default preferred sample for EQ exercises should be pink-noise; the sample selector lets users choose harder material.
