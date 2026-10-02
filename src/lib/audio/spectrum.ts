/**
 * Long-term average spectrum of a sample, used to estimate how much louder or
 * quieter an EQ makes *this* material (a +6 dB boost at 100 Hz changes a kick
 * loop far more than a hi-hat loop). Pure math over plain arrays.
 */

import { responseDb, type PeakingBand } from './eq-math.js';

/** In-place radix-2 FFT. Length must be a power of two. */
export function fft(re: Float64Array, im: Float64Array): void {
	const n = re.length;
	for (let i = 1, j = 0; i < n; i++) {
		let bit = n >> 1;
		for (; j & bit; bit >>= 1) j ^= bit;
		j ^= bit;
		if (i < j) {
			[re[i], re[j]] = [re[j], re[i]];
			[im[i], im[j]] = [im[j], im[i]];
		}
	}
	for (let len = 2; len <= n; len <<= 1) {
		const ang = (-2 * Math.PI) / len;
		const wRe = Math.cos(ang);
		const wIm = Math.sin(ang);
		for (let i = 0; i < n; i += len) {
			let cRe = 1;
			let cIm = 0;
			for (let k = 0; k < len / 2; k++) {
				const a = i + k;
				const b = a + len / 2;
				const tRe = re[b] * cRe - im[b] * cIm;
				const tIm = re[b] * cIm + im[b] * cRe;
				re[b] = re[a] - tRe;
				im[b] = im[a] - tIm;
				re[a] += tRe;
				im[a] += tIm;
				const nRe = cRe * wRe - cIm * wIm;
				cIm = cRe * wIm + cIm * wRe;
				cRe = nRe;
			}
		}
	}
}

export interface BandSpectrum {
	freqs: number[];
	power: number[];
}

/**
 * Mean power per log-spaced band. Averages Hann-windowed FFT frames spread
 * evenly across the (mono) signal, then folds bins into `perOctave` bands.
 */
export function averageSpectrum(
	samples: ArrayLike<number>,
	fs: number,
	opts: { size?: number; frames?: number; perOctave?: number; min?: number; max?: number } = {}
): BandSpectrum {
	const { size = 8192, frames = 16, perOctave = 6, min = 20, max = 20000 } = opts;
	const bins = size / 2;
	const power = new Float64Array(bins);
	const usable = Math.max(0, samples.length - size);
	const count = usable === 0 ? 1 : frames;

	for (let fr = 0; fr < count; fr++) {
		const start = count === 1 ? 0 : Math.floor((usable * fr) / (count - 1));
		const re = new Float64Array(size);
		const im = new Float64Array(size);
		for (let i = 0; i < size && start + i < samples.length; i++) {
			const hann = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (size - 1));
			re[i] = samples[start + i] * hann;
		}
		fft(re, im);
		for (let k = 1; k < bins; k++) power[k] += re[k] * re[k] + im[k] * im[k];
	}

	const bandCount = Math.round(Math.log2(max / min) * perOctave);
	const freqs: number[] = [];
	const bandPower: number[] = new Array(bandCount).fill(0);
	for (let b = 0; b < bandCount; b++) freqs.push(min * Math.pow(max / min, (b + 0.5) / bandCount));
	for (let k = 1; k < bins; k++) {
		const f = (k * fs) / size;
		if (f < min || f >= max) continue;
		const b = Math.min(bandCount - 1, Math.floor(Math.log2(f / min) * perOctave));
		bandPower[b] += power[k];
	}
	return { freqs, power: bandPower };
}

/**
 * Estimated loudness change (dB, power-weighted) of applying `bands` to a
 * signal with the given spectrum. 0 when the spectrum is empty or bands flat.
 */
export function eqLoudnessDeltaDb(spectrum: BandSpectrum, bands: PeakingBand[]): number {
	let total = 0;
	let shaped = 0;
	for (let i = 0; i < spectrum.freqs.length; i++) {
		const p = spectrum.power[i];
		total += p;
		shaped += p * Math.pow(10, responseDb(spectrum.freqs[i], bands) / 10);
	}
	if (total === 0 || shaped === 0) return 0;
	return 10 * Math.log10(shaped / total);
}
