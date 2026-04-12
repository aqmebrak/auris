export const FREQ_MIN = 20;
export const FREQ_MAX = 20000;
export const LOG_RANGE = Math.log(FREQ_MAX / FREQ_MIN);

export function posToFreq(x: number, width: number): number {
	return FREQ_MIN * Math.pow(FREQ_MAX / FREQ_MIN, x / width);
}

export function freqToPct(freq: number): number {
	return (Math.log(freq / FREQ_MIN) / LOG_RANGE) * 100;
}

/** Range-aware variants — use when FreqStrip is scoped to a sub-band. */
export function posToFreqInRange(x: number, width: number, min: number, max: number): number {
	return min * Math.pow(max / min, x / width);
}

export function freqToPctInRange(freq: number, min: number, max: number): number {
	return (Math.log(freq / min) / Math.log(max / min)) * 100;
}
