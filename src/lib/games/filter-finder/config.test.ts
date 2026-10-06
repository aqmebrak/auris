import { describe, it, expect } from 'vitest';
import {
	DIFFICULTY_CONFIG,
	RANGE,
	STEPS,
	createFilterFinderConfig,
	pickCutoff,
	type FilterChoice,
	type FilterDifficulty
} from './config.js';
import { bandRelDb } from '$lib/audio/library.js';

const DIFFS: FilterDifficulty[] = ['easy', 'medium', 'hard'];
const RUNS = 200;
const FREQS = [63, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
/** Little energy below ~250 Hz (thin / bright). */
const bright = { spectrum: { freqs: FREQS, relDb: [-60, -60, -40, -20, -10, -5, 0, -3, -8] } };
/** Little energy above ~4 kHz (dark / bass-heavy). */
const dark = { spectrum: { freqs: FREQS, relDb: [0, 0, -3, -8, -12, -15, -20, -60, -80] } };

describe('filter-finder rounds', () => {
	for (const filter of ['highpass', 'lowpass', 'mixed'] as FilterChoice[]) {
		it(`${filter}: type, range and slope follow the options`, () => {
			for (const difficulty of DIFFS) {
				const config = createFilterFinderConfig({ filter, difficulty, roundCount: 5 });
				const seen = new Set<string>();
				for (let i = 0; i < RUNS; i++) {
					const r = config.generateRound();
					seen.add(r.type);
					if (filter !== 'mixed') expect(r.type).toBe(filter);
					expect(r.targetFreq).toBeGreaterThanOrEqual(RANGE[r.type].min);
					expect(r.targetFreq).toBeLessThanOrEqual(RANGE[r.type].max);
					expect(r.slope).toBe(DIFFICULTY_CONFIG[difficulty].slope);
					if (difficulty === 'easy') expect(STEPS[r.type]).toContain(r.targetFreq);
				}
				if (filter === 'mixed') expect(seen.size).toBe(2);
			}
		});
	}

	it('scores 1 exact, 0.5 at the margin, 0 at twice it; passes within the margin', () => {
		for (const difficulty of DIFFS) {
			const config = createFilterFinderConfig({ filter: 'highpass', difficulty, roundCount: 5 });
			const m = DIFFICULTY_CONFIG[difficulty].errorMarginOctaves;
			const r = config.generateRound();
			expect(config.scoreGuess!(r, r.targetFreq)).toBe(1);
			expect(config.scoreGuess!(r, r.targetFreq * 2 ** m)).toBeCloseTo(0.5, 10);
			expect(config.scoreGuess!(r, r.targetFreq * 2 ** (2 * m))).toBeCloseTo(0, 10);
			expect(config.evaluateGuess(r, r.targetFreq * 2 ** (m * 0.9))).toBe(true);
			expect(config.evaluateGuess(r, r.targetFreq * 2 ** (m * 1.1))).toBe(false);
		}
	});
});

describe('pickCutoff is sample-aware', () => {
	it('high-pass cutoffs sit where there is energy below them', () => {
		for (const input of ['buttons', 'strip'] as const) {
			for (let i = 0; i < RUNS; i++) {
				const f = pickCutoff(bright, input, 'highpass');
				// threshold −25 dB on the removed region; allow a few dB for strip jitter
				expect(bandRelDb(bright.spectrum, f / 2)).toBeGreaterThan(-30);
			}
		}
	});

	it('low-pass cutoffs sit where there is energy above them', () => {
		for (const input of ['buttons', 'strip'] as const) {
			for (let i = 0; i < RUNS; i++) {
				const f = pickCutoff(dark, input, 'lowpass');
				expect(bandRelDb(dark.spectrum, f * 2)).toBeGreaterThan(-35);
			}
		}
	});

	it('Easy buttons only offer audible steps', () => {
		for (let i = 0; i < RUNS; i++) {
			expect([500, 1000]).toContain(pickCutoff(bright, 'buttons', 'highpass'));
			expect(pickCutoff(dark, 'buttons', 'lowpass')).toBe(2000);
		}
	});
});
