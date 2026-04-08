export function dbToLinear(db: number): number {
	return Math.pow(10, db / 20);
}

export function linearToDb(linear: number): number {
	return 20 * Math.log10(linear);
}

export function clamp(value: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, value));
}

export function randomInRange(min: number, max: number, step?: number): number {
	if (step !== undefined) {
		const steps = Math.floor((max - min) / step);
		return min + Math.round(Math.random() * steps) * step;
	}
	return min + Math.random() * (max - min);
}

export function randomChoice<T>(array: T[]): T {
	return array[Math.floor(Math.random() * array.length)];
}
