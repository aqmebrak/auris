/**
 * Feed-forward compressor DSP — pure, framework-free, shared by the
 * AudioWorklet (realtime) and offline analysis (auto makeup gain, tests).
 *
 * Stereo-linked peak detector → soft-knee gain computer (dB domain) →
 * attack/release smoothing of the gain (Giannoulis et al., "Digital Dynamic
 * Range Compressor Design"). Unlike the built-in DynamicsCompressorNode there
 * is no lookahead and attack/release mean exactly what they say, which is what
 * makes attack/release ear training meaningful.
 */

import { rmsDb } from './loudness.js';

export interface CompressorParams {
	thresholdDb: number;
	ratio: number;
	attackMs: number;
	releaseMs: number;
	kneeDb: number;
	makeupDb: number;
}

export const BYPASS: CompressorParams = {
	thresholdDb: 0,
	ratio: 1,
	attackMs: 10,
	releaseMs: 100,
	kneeDb: 0,
	makeupDb: 0
};

const FLOOR_DB = -120;

/** Static gain change (dB, ≤ 0) for an input level — the compression curve. */
export function gainComputerDb(levelDb: number, p: CompressorParams): number {
	const over = levelDb - p.thresholdDb;
	const slope = 1 / p.ratio - 1;
	if (p.kneeDb > 0 && 2 * Math.abs(over) <= p.kneeDb) {
		const x = over + p.kneeDb / 2;
		return (slope * x * x) / (2 * p.kneeDb);
	}
	return over > 0 ? slope * over : 0;
}

function timeConstant(ms: number, fs: number): number {
	return Math.exp(-1 / (Math.max(0.01, ms) * 0.001 * fs));
}

export class CompressorDsp {
	private fs: number;
	private p: CompressorParams;
	private aAttack = 0;
	private aRelease = 0;
	/** Smoothed gain change in dB (≤ 0). */
	private gain = 0;

	constructor(fs: number, params: CompressorParams = BYPASS) {
		this.fs = fs;
		this.p = params;
		this.setParams(params);
	}

	setParams(params: CompressorParams): void {
		this.p = params;
		this.aAttack = timeConstant(params.attackMs, this.fs);
		this.aRelease = timeConstant(params.releaseMs, this.fs);
	}

	/** Current gain reduction in dB (0 = none, negative = reducing). */
	get reduction(): number {
		return this.gain;
	}

	reset(): void {
		this.gain = 0;
	}

	/** Processes `length` frames. `inputs` and `outputs` are per-channel arrays. */
	process(
		inputs: ArrayLike<number>[],
		outputs: { [i: number]: number; length: number }[],
		length = inputs[0]?.length ?? 0
	): void {
		const channels = Math.min(inputs.length, outputs.length);
		const makeup = this.p.makeupDb;
		for (let i = 0; i < length; i++) {
			let peak = 0;
			for (let c = 0; c < channels; c++) {
				const v = Math.abs(inputs[c][i]);
				if (v > peak) peak = v;
			}
			const levelDb = peak > 1e-6 ? 20 * Math.log10(peak) : FLOOR_DB;
			const target = gainComputerDb(levelDb, this.p);
			const a = target < this.gain ? this.aAttack : this.aRelease;
			this.gain = a * this.gain + (1 - a) * target;
			const lin = Math.pow(10, (this.gain + makeup) / 20);
			for (let c = 0; c < channels; c++) outputs[c][i] = inputs[c][i] * lin;
		}
	}
}

/** Runs the compressor over whole channels (offline). Returns new channel arrays. */
export function renderCompressed(
	channels: ArrayLike<number>[],
	fs: number,
	params: CompressorParams
): Float32Array[] {
	const out = channels.map((c) => new Float32Array(c.length));
	new CompressorDsp(fs, params).process(channels, out);
	return out;
}

/**
 * Makeup gain (dB) that makes the compressed signal as loud (RMS) as the dry
 * one, so A/B differs in dynamics rather than level. Clamped to 0..24 dB.
 */
export function autoMakeupDb(
	channels: ArrayLike<number>[],
	fs: number,
	params: Omit<CompressorParams, 'makeupDb'>
): number {
	const dry = rmsDb(channels);
	const wet = rmsDb(renderCompressed(channels, fs, { ...params, makeupDb: 0 }));
	return Math.max(0, Math.min(24, dry - wet));
}

/** Threshold sitting `offsetDb` relative to the signal's RMS level. */
export function thresholdFromLevel(channels: ArrayLike<number>[], offsetDb: number): number {
	return rmsDb(channels) + offsetDb;
}
