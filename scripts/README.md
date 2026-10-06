# Scripts

## `pnpm samples`

Processes raw audio in `samples-src/` (gitignored) into app-ready assets.

**Naming:** `{kind}_{source}_{bpm}_{name}.{wav|aiff|flac|mp3|ogg}`

| Part   | Values                                                                                                                                 |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| kind   | `mix` (full stereo mix) · `stem` (single dry source) · `drums` (dry kit loop) · `multi` (one stem of a multitrack; `source` = song id) |
| source | who/what, no underscores: `badoink`, `vocal-f`, `song1`                                                                                |
| bpm    | integer, `0` = unknown                                                                                                                 |
| name   | free text, dashes ok                                                                                                                   |

**Good samples:** 15–30 s, loopable (start/end on the bar line), no fades, no silence at the head, stems _dry_ (no printed reverb/delay/compression/heavy EQ). Files over 30 s are trimmed with a 20 ms fade at each end.

**What it does:** two-pass loudness normalisation to −18 LUFS / −1 dBTP (linear, keeps dynamics) → 44.1 kHz FLAC in `static/audio/` → analysis (channels, duration, loudness, 1/3-octave energy profile) written to `src/lib/audio/library.json` → `static/audio/CREDITS.md`.

Add credit/licence/tags in `scripts/sample-meta.json` (keyed by sample id). Analysis also records the stereo side/mid energy ratio (`sideDb`; −60 = dual-mono). `pnpm samples --reanalyze` recomputes analysis from the committed FLACs only (no raw files needed). Re-run is incremental; `--force` reprocesses all, `--only <text>` filters.

Commit `library.json`, `static/audio/*.flac`, `CREDITS.md` and `sample-meta.json`; never `samples-src/`.
