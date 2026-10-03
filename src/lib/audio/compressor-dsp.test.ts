import { describe, it, expect } from 'vitest';
import {
	BYPASS,
	CompressorDsp,
	autoMakeupDb,
	gainComputerDb,
	renderCompressed,
	thresholdFromLevel,
	type CompressorParams
} from './compressor-dsp.js';
import { rmsDb } from './loudness.js';

const FS = 48000;
const base: CompressorParams = {
	thresholdDb: -20,
	ratio: 4,
	attackMs: 5,
	releaseMs: 100,
	kneeDb: 0,
	makeupDb: 0
};

const dc = (amp: number, n: number) => new Float32Array(n).fill(amp);
const db = (x: number) => 20 * Math.log10(x);

describe('gainComputerDb', () => {
	it('is 0 below threshold', () => {
		expect(gainComputerDb(-30, base)).toBe(0);
	});

	it('applies (1/ratio − 1) × overshoot above threshold', () => {
		// 8 dB over at 4:1 → output 2 dB over → −6 dB
		expect(gainComputerDb(-12, base)).toBeCloseTo(-6);
	});

	it('is ratio 1 = no change, and ∞-ish ratios limit', () => {
		expect(gainComputerDb(-5, { ...base, ratio: 1 })).toBeCloseTo(0);
		expect(gainComputerDb(-10, { ...base, ratio: 1000 })).toBeCloseTo(-9.99, 1);
	});

	it('soft knee eases in around the threshold and is continuous', () => {
		const knee = { ...base, kneeDb: 6 };
		expect(gainComputerDb(-23, knee)).toBeCloseTo(0, 5); // knee edge
		expect(gainComputerDb(-20, knee)).toBeLessThan(0); // reduces at threshold
		expect(gainComputerDb(-20, knee)).toBeGreaterThan(gainComputerDb(-20, base) - 1);
		expect(gainComputerDb(-17, knee)).toBeCloseTo(gainComputerDb(-17, base), 5); // upper edge
	});
});

describe('CompressorDsp', () => {
	it('reaches the steady-state reduction for a constant loud input', () => {
		const dsp = new CompressorDsp(FS, base);
		const input = dc(Math.pow(10, -12 / 20), FS / 2);
		const out = new Float32Array(input.length);
		dsp.process([input], [out]);
		expect(dsp.reduction).toBeCloseTo(-6, 1);
		expect(db(out[out.length - 1])).toBeCloseTo(-12 - 6, 1);
	});

	it('leaves signals below threshold untouched', () => {
		const input = dc(0.01, 4800); // −40 dB
		const out = new Float32Array(input.length);
		new CompressorDsp(FS, base).process([input], [out]);
		expect(out[4799]).toBeCloseTo(0.01, 6);
	});

	it('attack: slower attack lets more of a transient through', () => {
		const burst = dc(Math.pow(10, -6 / 20), 2400); // 50 ms burst, −6 dBFS
		const peakOut = (attackMs: number) => {
			const out = new Float32Array(burst.length);
			new CompressorDsp(FS, { ...base, attackMs }).process([burst], [out]);
			return out.slice(0, 480).reduce((m, v) => Math.max(m, Math.abs(v)), 0); // first 10 ms
		};
		expect(peakOut(30)).toBeGreaterThan(peakOut(1));
	});

	it('attack: 63% of the way in about one time constant', () => {
		const dsp = new CompressorDsp(FS, { ...base, attackMs: 10, kneeDb: 0 });
		const n = Math.round(0.01 * FS);
		const input = dc(Math.pow(10, -12 / 20), n);
		dsp.process([input], [new Float32Array(n)]);
		expect(dsp.reduction / -6).toBeGreaterThan(0.6);
		expect(dsp.reduction / -6).toBeLessThan(0.66);
	});

	it('release: slower release recovers more slowly', () => {
		const run = (releaseMs: number) => {
			const dsp = new CompressorDsp(FS, { ...base, releaseMs });
			dsp.process([dc(0.5, 4800)], [new Float32Array(4800)]); // load the compressor
			dsp.process([dc(0.001, 2400)], [new Float32Array(2400)]); // 50 ms of quiet
			return dsp.reduction;
		};
		expect(run(800)).toBeLessThan(run(50)); // still more reduced (more negative)
	});

	it('links stereo channels: both get the same gain', () => {
		const l = dc(0.5, 4800);
		const r = dc(0.05, 4800);
		const outL = new Float32Array(4800);
		const outR = new Float32Array(4800);
		new CompressorDsp(FS, base).process([l, r], [outL, outR]);
		expect(outL[4799] / l[4799]).toBeCloseTo(outR[4799] / r[4799], 6);
	});

	it('bypass params are transparent', () => {
		const input = Float32Array.from({ length: 1000 }, (_, i) => Math.sin(i / 7) * 0.8);
		const out = new Float32Array(1000);
		new CompressorDsp(FS, BYPASS).process([input], [out]);
		for (let i = 0; i < 1000; i++) expect(out[i]).toBeCloseTo(input[i], 6);
	});

	it('applies makeup gain', () => {
		const out = new Float32Array(100);
		new CompressorDsp(FS, { ...BYPASS, makeupDb: 6 }).process([dc(0.1, 100)], [out]);
		expect(db(out[99] / 0.1)).toBeCloseTo(6, 1);
	});
});

describe('auto makeup + threshold', () => {
	const drums = Float32Array.from({ length: FS * 2 }, (_, i) => {
		const t = i / FS;
		const env = Math.exp(-((t % 0.25) * 18)); // 4 hits/s, decaying
		return Math.sin(2 * Math.PI * 120 * t) * env * 0.9;
	});

	it('threshold follows the signal level', () => {
		expect(thresholdFromLevel([drums], -4)).toBeCloseTo(rmsDb([drums]) - 4, 6);
	});

	it('auto makeup restores RMS to within 0.5 dB', () => {
		const params = { ...base, thresholdDb: thresholdFromLevel([drums], -6), ratio: 8 };
		const makeup = autoMakeupDb([drums], FS, params);
		expect(makeup).toBeGreaterThan(0);
		const wet = renderCompressed([drums], FS, { ...params, makeupDb: makeup });
		expect(Math.abs(rmsDb(wet) - rmsDb([drums]))).toBeLessThan(0.5);
	});

	it('makeup is 0 for a bypass', () => {
		expect(autoMakeupDb([drums], FS, BYPASS)).toBe(0);
	});
});
