import { describe, it, expect } from 'vitest';
import { compensationDb, rmsDb, sideToMidDb } from './loudness.js';

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

describe('sideToMidDb', () => {
	it('is the floor for mono and positive for out-of-phase material', () => {
		expect(sideToMidDb([1, -1, 0.5], [1, -1, 0.5])).toBe(-60);
		expect(sideToMidDb([1, -1], [-1, 1])).toBe(60);
	});

	it('is 0 dB when side and mid carry equal energy (one channel only)', () => {
		expect(sideToMidDb([1, -1, 1, -1], [0, 0, 0, 0])).toBeCloseTo(0, 10);
	});

	it('is 6 dB down for a 50% side component', () => {
		// L = M + 0.5 M... build M=1, S=0.5 → L=1.5, R=0.5 → ratio (0.5/1)^2 → -6 dB
		expect(sideToMidDb([1.5, 1.5], [0.5, 0.5])).toBeCloseTo(-6.02, 1);
	});
});
