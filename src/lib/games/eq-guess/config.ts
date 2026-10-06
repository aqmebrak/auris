/**
 * EQ Guess — 2AFC ear training.
 * Audio is processed through N peaking EQ bands. Two EQ configurations are
 * shown; the user picks which one matches what they hear.
 */

import { defineGame } from '$lib/game/config.js';
import type { RoundBase } from '$lib/game/types.js';
import { audibleFreqs, isAudible, pickSample, type SampleEntry } from '$lib/audio/library.js';

export interface EqBand {
	freq: number; // Hz
	gainDb: number; // dB (positive = boost, negative = cut)
	q: number;
}

export type EqConfig = EqBand[];

export interface EqGuessRound extends RoundBase<EqConfig> {
	targetEq: EqConfig;
	options: [EqConfig, EqConfig]; // shuffled: one is target, one is distractor
	sampleUrl: string;
}

export type EqGuessDifficulty = 'easy' | 'medium' | 'hard';

export interface EqGuessOptions {
	difficulty: EqGuessDifficulty;
	roundCount: 3 | 5 | 10;
}

export const DEFAULT_OPTIONS: EqGuessOptions = {
	difficulty: 'medium',
	roundCount: 5
};

export const ROUND_COUNT_OPTIONS = [3, 5, 10] as const;

// Standard octave-spaced frequencies available as band centers
export const FREQ_STEPS = [125, 250, 500, 1000, 2000, 4000, 8000] as const;

export const Q_DEFAULT = 2.5;

export const DIFFICULTY_CONFIG: Record<
	EqGuessDifficulty,
	{ label: string; bandCount: number; gainPool: number[] }
> = {
	easy: { label: 'Easy', bandCount: 2, gainPool: [9, 12] },
	medium: { label: 'Medium', bandCount: 3, gainPool: [6, 9, 12] },
	hard: { label: 'Hard', bandCount: 4, gainPool: [6, 9] }
};

function randomFrom<T>(arr: readonly T[]): T {
	return arr[Math.floor(Math.random() * arr.length)];
}

type Profiled = Pick<SampleEntry, 'spectrum'> | undefined;

export function generateTarget(bandCount: number, gainPool: number[], sample?: Profiled): EqConfig {
	// Independent random sign per band so boost/cut pattern carries no information;
	// frequencies come from where the sample can actually reveal that boost/cut.
	const remaining: number[] = [...FREQ_STEPS];
	const bands: EqConfig = [];
	for (let i = 0; i < bandCount; i++) {
		const gainDb = (Math.random() < 0.5 ? 1 : -1) * randomFrom(gainPool as readonly number[]);
		const freq = randomFrom(audibleFreqs(sample, remaining, gainDb > 0 ? 'boost' : 'cut'));
		remaining.splice(remaining.indexOf(freq), 1);
		bands.push({ freq, gainDb, q: Q_DEFAULT });
	}
	return bands.sort((a, b) => a.freq - b.freq);
}

const stepOf = (freq: number) => FREQ_STEPS.indexOf(freq as (typeof FREQ_STEPS)[number]);

/** Free steps ordered by closeness to `step` (circular when `wrap`). */
function stepsByDistance(step: number, exclude: Set<number>, wrap: boolean): number[] {
	const n = FREQ_STEPS.length;
	const dist = (i: number) =>
		wrap ? Math.min(Math.abs(i - step), n - Math.abs(i - step)) : Math.abs(i - step);
	return FREQ_STEPS.map((f, i) => ({ f, d: dist(i) }))
		.filter((x) => !exclude.has(x.f))
		.sort((a, b) => a.d - b.d)
		.map((x) => x.f);
}

/**
 * Builds the wrong option. Gains (and so the boost/cut pattern) are preserved
 * wherever frequencies move, so the distractor can't be told apart by shape
 * alone. When a sample is given, bands move to places where it can be heard.
 * - easy: every band moves ~2 steps up (wrapping)
 * - medium: one band moves to the nearest free step
 * - hard: one band keeps its frequency but flips boost/cut
 */
export function generateDistractor(
	target: EqConfig,
	difficulty: EqGuessDifficulty,
	sample?: Profiled
): EqConfig {
	const n = FREQ_STEPS.length;
	const shifted = () =>
		target.map((band) => ({ ...band, freq: FREQ_STEPS[(stepOf(band.freq) + 2) % n] }));
	let result: EqConfig;

	if (difficulty === 'easy') {
		const taken = new Set<number>();
		result = target.map((band) => {
			const preferred = (stepOf(band.freq) + 2) % n;
			const options = stepsByDistance(preferred, new Set([...taken, band.freq]), true);
			const freq = options.find((f) => isAudible(sample, f, band.gainDb)) ?? options[0];
			taken.add(freq);
			return { ...band, freq };
		});
	} else if (difficulty === 'medium') {
		const pick = Math.floor(Math.random() * target.length);
		const used = new Set(target.map((b) => b.freq));
		const options = stepsByDistance(stepOf(target[pick].freq), used, false);
		const moved = options.find((f) => isAudible(sample, f, target[pick].gainDb)) ?? options[0];
		result = target.map((band, i) => (i === pick ? { ...band, freq: moved } : { ...band }));
	} else {
		const flippable = target
			.map((b, i) => i)
			.filter((i) => isAudible(sample, target[i].freq, -target[i].gainDb));
		const pool = flippable.length > 0 ? flippable : target.map((_, i) => i);
		const pick = randomFrom(pool);
		result = target.map((band, i) =>
			i === pick ? { ...band, gainDb: -band.gainDb } : { ...band }
		);
	}

	result.sort((a, b) => a.freq - b.freq);
	// Reassigning bands can (rarely) reproduce the target; fall back to a plain shift
	return eqConfigsEqual(result, target) ? shifted().sort((a, b) => a.freq - b.freq) : result;
}

export function eqConfigsEqual(a: EqConfig, b: EqConfig): boolean {
	if (a.length !== b.length) return false;
	// Both are sorted ascending by freq (generated that way)
	return a.every((band, i) => band.freq === b[i].freq && band.gainDb === b[i].gainDb);
}

export function createEqGuessConfig(opts: EqGuessOptions = DEFAULT_OPTIONS) {
	const { bandCount, gainPool } = DIFFICULTY_CONFIG[opts.difficulty];
	const { difficulty } = opts;

	return defineGame<EqGuessRound, EqConfig>({
		id: 'eq-guess',
		roundCount: opts.roundCount,
		generateRound: () => {
			const sample = pickSample();
			const targetEq = generateTarget(bandCount, gainPool, sample);
			const distractor = generateDistractor(targetEq, difficulty, sample);
			const options: [EqConfig, EqConfig] =
				Math.random() < 0.5 ? [targetEq, distractor] : [distractor, targetEq];
			return { targetEq, options, sampleUrl: sample.url, guess: null, result: 'pending' };
		},
		evaluateGuess: (round, guess) => eqConfigsEqual(guess, round.targetEq)
	});
}
