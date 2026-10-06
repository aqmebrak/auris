import { describe, it, expect } from 'vitest';
import {
	audibleCutoffs,
	audibleFreqs,
	bandRelDb,
	filterSamples,
	parseSampleName,
	pickSample,
	type SampleEntry
} from './library.js';

const flat = (freqs: number[], db: number) => ({ freqs, relDb: freqs.map(() => db) });
const entry = (over: Partial<SampleEntry>): SampleEntry => ({
	id: 'x',
	url: '/audio/x.flac',
	kind: 'mix',
	source: 's',
	bpm: null,
	name: 'x',
	channels: 2,
	durationSec: 10,
	lufs: -18,
	spectrum: flat([100, 1000, 10000], 0),
	...over
});

describe('parseSampleName', () => {
	it('parses the convention, ignoring extension and case', () => {
		expect(parseSampleName('Stem_vocal-f_92_ballad-take2.WAV')).toEqual({
			id: 'stem_vocal-f_92_ballad-take2',
			kind: 'stem',
			source: 'vocal-f',
			bpm: 92,
			name: 'ballad-take2'
		});
	});

	it('bpm 0 means unknown', () => {
		expect(parseSampleName('mix_badoink_0_suburbs.wav')?.bpm).toBeNull();
	});

	it('rejects names that do not follow the convention', () => {
		expect(parseSampleName('568755__badoink__rockin_140.wav')).toBeNull();
		expect(parseSampleName('loop_a_120_b.wav')).toBeNull();
		expect(parseSampleName('mix_a_fast_b.wav')).toBeNull();
	});
});

describe('filterSamples / pickSample', () => {
	const lib = [
		entry({ id: 'a', kind: 'mix', channels: 2 }),
		entry({ id: 'b', kind: 'stem', channels: 1 }),
		entry({ id: 'c', kind: 'drums', channels: 2, source: 'kit' })
	];

	it('filters by kind (single or list), channels and source', () => {
		expect(filterSamples({ kind: 'stem' }, lib).map((s) => s.id)).toEqual(['b']);
		expect(filterSamples({ kind: ['mix', 'drums'] }, lib).map((s) => s.id)).toEqual(['a', 'c']);
		expect(filterSamples({ channels: 1 }, lib).map((s) => s.id)).toEqual(['b']);
		expect(filterSamples({ source: 'kit' }, lib).map((s) => s.id)).toEqual(['c']);
	});

	it('picks from matches, falling back to the whole library when none match', () => {
		for (let i = 0; i < 20; i++) expect(pickSample({ kind: 'stem' }, lib).id).toBe('b');
		const ids = new Set(Array.from({ length: 100 }, () => pickSample({ kind: 'multi' }, lib).id));
		expect(ids.size).toBeGreaterThan(1);
	});
});

describe('bandRelDb / audibleFreqs', () => {
	const bassy = {
		spectrum: { freqs: [100, 1000, 10000], relDb: [0, -15, -60] }
	};

	it('interpolates on the log-frequency axis and clamps at the ends', () => {
		expect(bandRelDb(bassy.spectrum, 100)).toBe(0);
		expect(bandRelDb(bassy.spectrum, 10)).toBe(0);
		expect(bandRelDb(bassy.spectrum, 100000)).toBe(-60);
		expect(bandRelDb(bassy.spectrum, Math.sqrt(100 * 1000))).toBeCloseTo(-7.5, 5);
	});

	it('drops frequencies the sample cannot reveal; cuts are stricter than boosts', () => {
		const cands = [100, 1000, 10000];
		expect(audibleFreqs(bassy, cands, 'boost')).toEqual([100, 1000]);
		expect(audibleFreqs(bassy, cands, 'cut')).toEqual([100, 1000]);
		const mid = { spectrum: { freqs: [100, 1000], relDb: [0, -25] } };
		expect(audibleFreqs(mid, [100, 1000], 'boost')).toEqual([100, 1000]);
		expect(audibleFreqs(mid, [100, 1000], 'cut')).toEqual([100]);
	});

	it('falls back to all candidates when none qualify', () => {
		const silent = { spectrum: { freqs: [100, 1000], relDb: [-90, -90] } };
		expect(audibleFreqs(silent, [100, 1000], 'cut')).toEqual([100, 1000]);
	});
});

describe('audibleCutoffs', () => {
	// energy only below ~500 Hz
	const bassy = {
		spectrum: { freqs: [100, 250, 500, 1000, 4000, 16000], relDb: [0, -3, -10, -40, -60, -80] }
	};
	// energy only above ~2 kHz (thin / bright)
	const bright = {
		spectrum: { freqs: [100, 250, 500, 1000, 4000, 16000], relDb: [-80, -60, -40, -15, 0, -5] }
	};

	it('high-pass is audible only if there is energy below the cutoff', () => {
		const cands = [100, 400, 1600, 6400];
		expect(audibleCutoffs(bassy, cands, 'highpass')).toEqual([100, 400]);
		expect(audibleCutoffs(bright, cands, 'highpass')).toEqual([1600, 6400]);
	});

	it('low-pass is audible only if there is energy above the cutoff', () => {
		const cands = [250, 500, 8000];
		expect(audibleCutoffs(bassy, cands, 'lowpass')).toEqual([250]);
		expect(audibleCutoffs(bright, [500, 2000, 8000], 'lowpass')).toEqual([500, 2000, 8000]);
	});

	it('falls back to all candidates when none qualify or no sample', () => {
		expect(audibleCutoffs(bassy, [8000, 16000], 'lowpass')).toEqual([8000, 16000]);
		expect(audibleCutoffs(null, [100, 200], 'highpass')).toEqual([100, 200]);
	});
});
