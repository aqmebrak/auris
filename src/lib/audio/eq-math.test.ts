import { describe, it, expect } from 'vitest';
import {
	PASS_STAGE_Q,
	logGrid,
	matchScore,
	passResponseDb,
	peakingMagnitudeDb,
	qToDb,
	responseDb
} from './eq-math.js';

describe('peakingMagnitudeDb', () => {
	it('equals the band gain at the center frequency', () => {
		for (const gainDb of [-12, -3, 6, 12]) {
			expect(peakingMagnitudeDb(1000, { freq: 1000, gainDb, q: 1.5 })).toBeCloseTo(gainDb, 1);
		}
	});

	it('is ~0 dB far from the band', () => {
		expect(Math.abs(peakingMagnitudeDb(80, { freq: 4000, gainDb: 12, q: 3 }))).toBeLessThan(0.5);
	});

	it('is narrower for higher Q', () => {
		const wide = peakingMagnitudeDb(1500, { freq: 1000, gainDb: 12, q: 1 });
		const narrow = peakingMagnitudeDb(1500, { freq: 1000, gainDb: 12, q: 3 });
		expect(wide).toBeGreaterThan(narrow);
	});

	it('zero gain is flat', () => {
		expect(peakingMagnitudeDb(500, { freq: 1000, gainDb: 0, q: 2 })).toBe(0);
	});
});

describe('responseDb', () => {
	it('sums bands in series', () => {
		const a = { freq: 1000, gainDb: 6, q: 1.5 };
		const b = { freq: 1000, gainDb: -6, q: 1.5 };
		expect(responseDb(1000, [a, b])).toBeCloseTo(0, 1);
	});
});

describe('logGrid', () => {
	it('spans min..max inclusive with ~perOctave points per octave', () => {
		const g = logGrid(100, 1600, 12);
		expect(g[0]).toBeCloseTo(100);
		expect(g[g.length - 1]).toBeCloseTo(1600);
		expect(g).toHaveLength(49);
	});
});

describe('matchScore', () => {
	const target = [{ freq: 1000, gainDb: 12, q: 1.5 }];

	it('is 1 for an exact match, regardless of band order', () => {
		expect(matchScore(target, target)).toBe(1);
		const two = [
			{ freq: 250, gainDb: 6, q: 1.5 },
			{ freq: 4000, gainDb: -6, q: 1.5 }
		];
		expect(matchScore(two, [...two].reverse())).toBeCloseTo(1, 10);
	});

	it('is 0 when nothing is applied', () => {
		expect(matchScore(target, [])).toBe(0);
	});

	it('is 0 for the opposite sign', () => {
		expect(matchScore(target, [{ freq: 1000, gainDb: -12, q: 1.5 }])).toBe(0);
	});

	it('gives partial credit for the right place with the wrong gain', () => {
		const halfGain = matchScore(target, [{ freq: 1000, gainDb: 6, q: 1.5 }]);
		expect(halfGain).toBeGreaterThan(0.6);
		expect(halfGain).toBeLessThan(0.75);
	});

	it('scores a misplaced band low and a half-correct two-band answer in between', () => {
		const misplaced = matchScore(target, [{ freq: 4000, gainDb: 12, q: 1.5 }]);
		expect(misplaced).toBeGreaterThan(0);
		expect(misplaced).toBeLessThan(0.35);
		const two = [
			{ freq: 250, gainDb: 6, q: 1.5 },
			{ freq: 4000, gainDb: -6, q: 1.5 }
		];
		const oneRight = matchScore(two, [two[0], { freq: 1000, gainDb: -6, q: 1.5 }]);
		expect(oneRight).toBeGreaterThan(0.4);
		expect(oneRight).toBeLessThan(0.6);
	});
});

describe('passResponseDb', () => {
	it('is −3 dB at the cutoff for both slopes and both types (Butterworth)', () => {
		for (const slope of [12, 24] as const) {
			expect(passResponseDb(1000, 'lowpass', 1000, slope)).toBeCloseTo(-3.01, 0);
			expect(passResponseDb(1000, 'highpass', 1000, slope)).toBeCloseTo(-3.01, 0);
		}
	});

	it('rolls off ~12 or ~24 dB one octave past the cutoff', () => {
		expect(passResponseDb(2000, 'lowpass', 1000, 12)).toBeCloseTo(-12.3, 0);
		expect(passResponseDb(2000, 'lowpass', 1000, 24)).toBeCloseTo(-24.1, 0);
		expect(passResponseDb(500, 'highpass', 1000, 12)).toBeCloseTo(-12.3, 0);
		expect(passResponseDb(500, 'highpass', 1000, 24)).toBeCloseTo(-24.1, 0);
	});

	it('is flat in the passband', () => {
		expect(Math.abs(passResponseDb(100, 'lowpass', 5000, 24))).toBeLessThan(0.1);
		expect(Math.abs(passResponseDb(8000, 'highpass', 200, 24))).toBeLessThan(0.1);
	});

	it('converts linear Q to the dB value Web Audio expects', () => {
		expect(qToDb(Math.SQRT1_2)).toBeCloseTo(-3.01, 1);
		expect(PASS_STAGE_Q[24]).toHaveLength(2);
	});
});
