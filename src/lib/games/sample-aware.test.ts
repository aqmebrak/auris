import { describe, it, expect } from 'vitest';
import { bandRelDb, isAudible } from '$lib/audio/library.js';
import { generateTarget as eqmTarget } from './eq-matching/config.js';
import {
	generateDistractor,
	generateTarget as eqgTarget,
	eqConfigsEqual,
	FREQ_STEPS
} from './eq-guess/config.js';
import { pickTargetFreq } from './freq-id/config.js';

const RUNS = 300;
/** Only the 125–500 Hz region carries energy. */
const bassy = {
	spectrum: {
		freqs: [125, 250, 500, 1000, 2000, 4000, 8000],
		relDb: [0, -5, -15, -35, -50, -60, -70]
	}
};
const AUDIBLE = [125, 250, 500];
const silent = { spectrum: { freqs: [125, 8000], relDb: [-90, -90] } };

describe('EQ Matching targets', () => {
	it('stay where the sample has energy (up to the number of audible slots)', () => {
		for (const bands of [1, 2, 3]) {
			for (let i = 0; i < RUNS; i++) {
				const t = eqmTarget(bands, [-12, -6, 6, 12], false, bassy);
				expect(t).toHaveLength(bands);
				for (const b of t) expect(AUDIBLE).toContain(b.freq);
				expect(new Set(t.map((b) => b.freq)).size).toBe(bands);
			}
		}
	});

	it('without a sample, any octave band is possible', () => {
		const seen = new Set<number>();
		for (let i = 0; i < RUNS; i++) eqmTarget(1, [6], false).forEach((b) => seen.add(b.freq));
		expect(seen.size).toBeGreaterThan(4);
	});

	it('falls back gracefully when nothing is audible', () => {
		const t = eqmTarget(2, [6, -6], false, silent);
		expect(t).toHaveLength(2);
	});
});

describe('EQ Guess', () => {
	it('targets stay where the sample has energy', () => {
		for (const bands of [2, 3]) {
			for (let i = 0; i < RUNS; i++) {
				for (const b of eqgTarget(bands, [6, 9, 12], bassy)) expect(AUDIBLE).toContain(b.freq);
			}
		}
	});

	it('easy/medium distractors move bands to audible places (almost always)', () => {
		for (const difficulty of ['easy', 'medium'] as const) {
			let audible = 0;
			let total = 0;
			for (let i = 0; i < RUNS; i++) {
				const target = eqgTarget(2, [6, 9, 12], bassy);
				const d = generateDistractor(target, difficulty, bassy);
				expect(eqConfigsEqual(d, target)).toBe(false);
				for (const b of d) {
					total++;
					if (isAudible(bassy, b.freq, b.gainDb)) audible++;
				}
			}
			expect(audible / total).toBeGreaterThan(0.9);
		}
	});

	it('hard distractor flips a band whose opposite sign is audible', () => {
		for (let i = 0; i < RUNS; i++) {
			const target = eqgTarget(2, [6, 9, 12], bassy);
			const d = generateDistractor(target, 'hard', bassy);
			const flipped = d.find((b, k) => b.gainDb !== target[k].gainDb)!;
			expect(isAudible(bassy, flipped.freq, flipped.gainDb)).toBe(true);
		}
	});

	it('distractors stay valid and distinct with or without a sample', () => {
		for (const sample of [bassy, silent, undefined]) {
			for (const difficulty of ['easy', 'medium', 'hard'] as const) {
				for (let i = 0; i < 100; i++) {
					const target = eqgTarget(3, [6, 9], sample);
					const d = generateDistractor(target, difficulty, sample);
					expect(d).toHaveLength(3);
					expect(new Set(d.map((b) => b.freq)).size).toBe(3);
					expect(d.every((b) => FREQ_STEPS.includes(b.freq as never))).toBe(true);
					expect(eqConfigsEqual(d, target)).toBe(false);
				}
			}
		}
	});
});

describe('Freq ID targets', () => {
	it('Easy buttons pick audible octave bands for boosts and cuts', () => {
		for (const kind of ['boost', 'cut'] as const) {
			for (let i = 0; i < RUNS; i++) {
				expect(AUDIBLE).toContain(pickTargetFreq(bassy, 'buttons', 'full', kind));
			}
		}
	});

	it('strip targets stay in the audible region and inside the zone', () => {
		for (const kind of ['boost', 'cut'] as const) {
			for (let i = 0; i < RUNS; i++) {
				const f = pickTargetFreq(bassy, 'strip', 'full', kind);
				expect(f).toBeGreaterThanOrEqual(75);
				expect(f).toBeLessThanOrEqual(10000);
				// grid points are audible; jitter is at most half a 1/6-octave step
				// (thresholds: boost −30 dB, cut −20 dB; allow a couple dB for the jitter)
				expect(bandRelDb(bassy.spectrum, f)).toBeGreaterThan(kind === 'boost' ? -33 : -23);
			}
		}
	});

	it('respects the zone even when the sample is quiet there', () => {
		for (let i = 0; i < RUNS; i++) {
			const f = pickTargetFreq(bassy, 'strip', 'highs', 'cut');
			expect(f).toBeGreaterThanOrEqual(1000);
			expect(f).toBeLessThanOrEqual(10000);
		}
	});
});
