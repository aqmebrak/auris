/**
 * Exact peaking-EQ frequency response (RBJ cookbook biquad), matching what
 * Web Audio's `BiquadFilterNode` type 'peaking' does. Pure math — used for
 * live curves, match scoring and loudness estimation.
 */

export interface PeakingBand {
	freq: number; // Hz
	gainDb: number;
	q: number;
}

export const DEFAULT_SAMPLE_RATE = 48000;

/** Magnitude (dB) of one peaking band at frequency `f`. */
export function peakingMagnitudeDb(f: number, band: PeakingBand, fs = DEFAULT_SAMPLE_RATE): number {
	if (band.gainDb === 0) return 0;
	const A = Math.pow(10, band.gainDb / 40);
	const w0 = (2 * Math.PI * band.freq) / fs;
	const alpha = Math.sin(w0) / (2 * band.q);
	const cosW0 = Math.cos(w0);
	const b0 = 1 + alpha * A;
	const b1 = -2 * cosW0;
	const b2 = 1 - alpha * A;
	const a0 = 1 + alpha / A;
	const a1 = -2 * cosW0;
	const a2 = 1 - alpha / A;

	const w = (2 * Math.PI * f) / fs;
	const c1 = Math.cos(w);
	const s1 = Math.sin(w);
	const c2 = Math.cos(2 * w);
	const s2 = Math.sin(2 * w);
	const nRe = b0 + b1 * c1 + b2 * c2;
	const nIm = -(b1 * s1 + b2 * s2);
	const dRe = a0 + a1 * c1 + a2 * c2;
	const dIm = -(a1 * s1 + a2 * s2);
	return 10 * Math.log10((nRe * nRe + nIm * nIm) / (dRe * dRe + dIm * dIm));
}

/** Combined response (dB) of bands in series. */
export function responseDb(f: number, bands: PeakingBand[], fs = DEFAULT_SAMPLE_RATE): number {
	let sum = 0;
	for (const b of bands) sum += peakingMagnitudeDb(f, b, fs);
	return sum;
}

/** Log-spaced frequencies from `min` to `max`, `perOctave` points per octave. */
export function logGrid(min: number, max: number, perOctave: number): number[] {
	const count = Math.max(2, Math.round(Math.log2(max / min) * perOctave) + 1);
	return Array.from({ length: count }, (_, i) => min * Math.pow(max / min, i / (count - 1)));
}

export const MATCH_RANGE = { min: 75, max: 10000, perOctave: 12 } as const;
const MATCH_GRID = logGrid(MATCH_RANGE.min, MATCH_RANGE.max, MATCH_RANGE.perOctave);

/**
 * How closely `guess` reproduces `target`'s response, 0..1:
 * 1 − RMS(difference) ÷ (RMS(target) + RMS(guess)).
 * Exact = 1, applying nothing = 0, opposite sign = 0, half the gain ≈ 0.67,
 * one of two bands right ≈ 0.5. Independent of how large the target move is.
 */
export function matchScore(target: PeakingBand[], guess: PeakingBand[]): number {
	let diffSq = 0;
	let targetSq = 0;
	let guessSq = 0;
	for (const f of MATCH_GRID) {
		const t = responseDb(f, target);
		const g = responseDb(f, guess);
		targetSq += t * t;
		guessSq += g * g;
		diffSq += (t - g) * (t - g);
	}
	const denom = Math.sqrt(targetSq) + Math.sqrt(guessSq);
	if (denom === 0) return 1;
	return Math.max(0, Math.min(1, 1 - Math.sqrt(diffSq) / denom));
}

export type PassType = 'highpass' | 'lowpass';
export type PassSlope = 12 | 24;

/** Linear Q of each biquad stage: 1 stage = Butterworth 12 dB/oct, 2 stages = Butterworth 24 dB/oct. */
export const PASS_STAGE_Q: Record<PassSlope, number[]> = {
	12: [Math.SQRT1_2],
	24: [0.5412, 1.3066]
};

/** Web Audio's lowpass/highpass `Q` is in dB, not linear. */
export const qToDb = (q: number) => 20 * Math.log10(q);

/** Magnitude (dB) of one RBJ high/low-pass biquad stage at `f`. */
export function passStageMagnitudeDb(
	f: number,
	type: PassType,
	cutoff: number,
	q: number,
	fs = DEFAULT_SAMPLE_RATE
): number {
	const w0 = (2 * Math.PI * cutoff) / fs;
	const alpha = Math.sin(w0) / (2 * q);
	const cosW0 = Math.cos(w0);
	const k = type === 'lowpass' ? 1 - cosW0 : 1 + cosW0;
	const b0 = k / 2;
	const b1 = type === 'lowpass' ? k : -k;
	const b2 = k / 2;
	const a0 = 1 + alpha;
	const a1 = -2 * cosW0;
	const a2 = 1 - alpha;
	const w = (2 * Math.PI * f) / fs;
	const c1 = Math.cos(w);
	const s1 = Math.sin(w);
	const c2 = Math.cos(2 * w);
	const s2 = Math.sin(2 * w);
	const nRe = b0 + b1 * c1 + b2 * c2;
	const nIm = -(b1 * s1 + b2 * s2);
	const dRe = a0 + a1 * c1 + a2 * c2;
	const dIm = -(a1 * s1 + a2 * s2);
	return 10 * Math.log10((nRe * nRe + nIm * nIm) / (dRe * dRe + dIm * dIm));
}

/** Magnitude (dB) of the full filter (all stages) at `f`. */
export function passResponseDb(
	f: number,
	type: PassType,
	cutoff: number,
	slope: PassSlope,
	fs = DEFAULT_SAMPLE_RATE
): number {
	return PASS_STAGE_Q[slope].reduce(
		(sum, q) => sum + passStageMagnitudeDb(f, type, cutoff, q, fs),
		0
	);
}

/**
 * Magnitude (dB) of `x + polarity · x(t − delay)` at `f`: a comb filter
 * (polarity +1: notches at odd multiples of 1/(2·delay)) or its polarity-flipped
 * twin (−1: notches at 0 and multiples of 1/delay). Floors at −60 dB.
 */
export function combResponseDb(f: number, delayMs: number, polarity: 1 | -1): number {
	const power = 2 + 2 * polarity * Math.cos(2 * Math.PI * f * (delayMs / 1000));
	return Math.max(-60, 10 * Math.log10(Math.max(power, 1e-6)));
}
