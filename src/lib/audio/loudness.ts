/**
 * Loudness helpers for fair A/B comparison. Pure math — callers supply decoded
 * channel data (e.g. from an `OfflineAudioContext` render of each path).
 */

const SILENCE_DB = -120;

/** RMS level in dBFS across all channels. Silence returns a -120 dB floor. */
export function rmsDb(channels: ArrayLike<number>[]): number {
	let sum = 0;
	let count = 0;
	for (const ch of channels) {
		for (let i = 0; i < ch.length; i++) sum += ch[i] * ch[i];
		count += ch.length;
	}
	if (count === 0 || sum === 0) return SILENCE_DB;
	return Math.max(SILENCE_DB, 10 * Math.log10(sum / count));
}

/**
 * Gain (dB) to apply to the effected path so it matches the reference level.
 * Clamped so a pathological render can't blast the listener.
 */
export function compensationDb(referenceDb: number, effectedDb: number, limit = 12): number {
	if (referenceDb <= SILENCE_DB || effectedDb <= SILENCE_DB) return 0;
	return Math.max(-limit, Math.min(limit, referenceDb - effectedDb));
}

/**
 * Side-to-mid energy ratio of a stereo signal in dB (0 = as much side as mid,
 * −∞ = mono). Floors at −60 dB. Mid = (L+R)/2, side = (L−R)/2.
 */
export function sideToMidDb(left: ArrayLike<number>, right: ArrayLike<number>): number {
	let mid = 0;
	let side = 0;
	const n = Math.min(left.length, right.length);
	for (let i = 0; i < n; i++) {
		const m = (left[i] + right[i]) / 2;
		const s = (left[i] - right[i]) / 2;
		mid += m * m;
		side += s * s;
	}
	if (side === 0) return -60;
	if (mid === 0) return 60;
	return Math.max(-60, Math.min(60, 10 * Math.log10(side / mid)));
}
