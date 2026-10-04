/**
 * Sample library — typed access to `library.json`, which `pnpm samples`
 * (scripts/prepare-samples.ts) generates from raw files in `samples-src/`.
 *
 * Naming convention for raw files: `{kind}_{source}_{bpm}_{name}.{ext}`
 *   kind    mix | stem | drums | multi
 *   source  who/what (`badoink`, `vocal-f`, `song1`); no underscores
 *   bpm     integer, 0 = unknown
 *   name    free text (dashes ok)
 */

import manifest from './library.json';

export const SAMPLE_KINDS = ['mix', 'stem', 'drums', 'multi'] as const;
export type SampleKind = (typeof SAMPLE_KINDS)[number];

/** Average energy per 1/3-octave band, in dB relative to the sample's loudest band. */
export interface SpectrumProfile {
	freqs: number[];
	relDb: number[];
}

export interface SampleEntry {
	id: string;
	url: string;
	kind: SampleKind;
	source: string;
	bpm: number | null;
	name: string;
	channels: 1 | 2;
	durationSec: number;
	/** Integrated loudness after normalisation (target −18 LUFS). */
	lufs: number;
	spectrum: SpectrumProfile;
	credit?: string;
	license?: string;
	tags?: string[];
}

export const SAMPLE_LIBRARY = manifest as SampleEntry[];

export interface ParsedSampleName {
	id: string;
	kind: SampleKind;
	source: string;
	bpm: number | null;
	name: string;
}

const NAME_RE = /^(mix|stem|drums|multi)_([^_]+)_(\d+)_(.+)$/i;

/** Parses a raw file name (with or without extension). Null when it doesn't follow the convention. */
export function parseSampleName(filename: string): ParsedSampleName | null {
	const base = filename.replace(/\.[a-z0-9]+$/i, '');
	const m = NAME_RE.exec(base);
	if (!m) return null;
	const bpm = Number(m[3]);
	return {
		id: base.toLowerCase(),
		kind: m[1].toLowerCase() as SampleKind,
		source: m[2].toLowerCase(),
		bpm: bpm > 0 ? bpm : null,
		name: m[4].toLowerCase()
	};
}

export interface SampleFilter {
	kind?: SampleKind | SampleKind[];
	channels?: 1 | 2;
	source?: string;
}

export function filterSamples(
	filter: SampleFilter = {},
	library: SampleEntry[] = SAMPLE_LIBRARY
): SampleEntry[] {
	const kinds = filter.kind === undefined ? null : [filter.kind].flat();
	return library.filter(
		(s) =>
			(!kinds || kinds.includes(s.kind)) &&
			(filter.channels === undefined || s.channels === filter.channels) &&
			(filter.source === undefined || s.source === filter.source)
	);
}

/**
 * Random sample matching the filter. When nothing matches (e.g. no mono stems
 * added yet) falls back to the whole library so a game never has nothing to play.
 */
export function pickSample(
	filter: SampleFilter = {},
	library: SampleEntry[] = SAMPLE_LIBRARY
): SampleEntry {
	const pool = filterSamples(filter, library);
	const from = pool.length > 0 ? pool : library;
	return from[Math.floor(Math.random() * from.length)];
}

/** Energy (dB re loudest band) at `freq`, interpolated on the log-frequency axis. */
export function bandRelDb(profile: SpectrumProfile, freq: number): number {
	const { freqs, relDb } = profile;
	if (freqs.length === 0) return 0;
	if (freq <= freqs[0]) return relDb[0];
	if (freq >= freqs[freqs.length - 1]) return relDb[relDb.length - 1];
	let i = 0;
	while (freqs[i + 1] < freq) i++;
	const t = Math.log(freq / freqs[i]) / Math.log(freqs[i + 1] / freqs[i]);
	return relDb[i] + t * (relDb[i + 1] - relDb[i]);
}

/** Minimum energy (dB re loudest band) for a boost / cut at a frequency to be audible. */
export const AUDIBLE_REL_DB = { boost: -30, cut: -20 } as const;

type Profiled = Pick<SampleEntry, 'spectrum'>;

/** Whether a boost (`gainDb > 0`) or cut (`< 0`) at `freq` is audible on this sample. */
export function isAudible(
	sample: Profiled | null | undefined,
	freq: number,
	gainDb: number
): boolean {
	if (!sample) return true;
	return bandRelDb(sample.spectrum, freq) >= AUDIBLE_REL_DB[gainDb >= 0 ? 'boost' : 'cut'];
}

/**
 * Candidate frequencies where a boost or cut will actually be audible on this
 * sample (a cut where there is nothing to cut, or a boost of silence, is a
 * coin flip). Returns all candidates if none qualify or no sample is given.
 */
export function audibleFreqs(
	sample: Profiled | null | undefined,
	candidates: readonly number[],
	kind: 'boost' | 'cut',
	minRelDb: number = AUDIBLE_REL_DB[kind]
): number[] {
	if (!sample) return [...candidates];
	const ok = candidates.filter((f) => bandRelDb(sample.spectrum, f) >= minRelDb);
	return ok.length > 0 ? ok : [...candidates];
}
