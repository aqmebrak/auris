import { describe, it, expect } from 'vitest';
import { compensationDb, rmsDb } from './loudness.js';

describe('rmsDb', () => {
	it('full-scale square wave is 0 dB', () => {
		expect(rmsDb([[1, -1, 1, -1]])).toBeCloseTo(0);
	});

	it('halving amplitude drops ~6 dB', () => {
		expect(rmsDb([[0.5, -0.5, 0.5, -0.5]])).toBeCloseTo(-6.02, 1);
	});

	it('averages across channels', () => {
		expect(
			rmsDb([
				[1, 1],
				[0, 0]
			])
		).toBeCloseTo(-3.01, 1);
	});

	it('returns the floor for silence and empty input', () => {
		expect(rmsDb([[0, 0, 0]])).toBe(-120);
		expect(rmsDb([])).toBe(-120);
	});
});

describe('compensationDb', () => {
	it('returns the level difference', () => {
		expect(compensationDb(-18, -15)).toBe(-3);
		expect(compensationDb(-18, -24)).toBe(6);
	});

	it('clamps to the limit', () => {
		expect(compensationDb(-10, -60)).toBe(12);
		expect(compensationDb(-60, -10, 6)).toBe(-6);
	});

	it('ignores silent renders', () => {
		expect(compensationDb(-18, -120)).toBe(0);
	});
});
