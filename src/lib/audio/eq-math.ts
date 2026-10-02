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
