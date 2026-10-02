import { describe, it, expect } from 'vitest';
import { averageSpectrum, eqLoudnessDeltaDb, fft } from './spectrum.js';

const FS = 48000;
const sine = (f: number, n: number) =>
	Float64Array.from({ length: n }, (_, i) => Math.sin((2 * Math.PI * f * i) / FS));

describe('fft', () => {
	it('puts a bin-aligned sine in the right bin', () => {
		const n = 1024;
		const k = 32;
		const re = Float64Array.from({ length: n }, (_, i) => Math.sin((2 * Math.PI * k * i) / n));
		const im = new Float64Array(n);
		fft(re, im);
		const mag = Array.from(re, (r, i) => Math.hypot(r, im[i]));
		const peak = mag.indexOf(Math.max(...mag.slice(0, n / 2)));
		expect(peak).toBe(k);
	});
});

describe('averageSpectrum', () => {
	it('concentrates power in the band containing the tone', () => {
		const spec = averageSpectrum(sine(1000, FS), FS);
		const max = Math.max(...spec.power);
		const idx = spec.power.indexOf(max);
		expect(spec.freqs[idx]).toBeGreaterThan(800);
		expect(spec.freqs[idx]).toBeLessThan(1250);
	});

	it('handles signals shorter than one frame', () => {
		const spec = averageSpectrum(sine(1000, 100), FS);
		expect(spec.power).toHaveLength(spec.freqs.length);
	});
});

describe('eqLoudnessDeltaDb', () => {
	const low = averageSpectrum(sine(100, FS), FS);
	const high = averageSpectrum(sine(8000, FS), FS);
	const boostLow = [{ freq: 100, gainDb: 12, q: 1.5 }];

	it('is ~the band gain when the energy sits inside the band', () => {
		expect(eqLoudnessDeltaDb(low, boostLow)).toBeGreaterThan(9);
	});

	it('is ~0 when the energy sits outside the band', () => {
		expect(Math.abs(eqLoudnessDeltaDb(high, boostLow))).toBeLessThan(1);
	});

	it('is 0 for flat bands and empty spectra', () => {
		expect(eqLoudnessDeltaDb(low, [])).toBe(0);
		expect(eqLoudnessDeltaDb({ freqs: [], power: [] }, boostLow)).toBe(0);
	});
});
