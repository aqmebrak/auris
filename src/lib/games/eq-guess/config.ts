/**
 * EQ Guess — 2AFC ear training.
 * Audio is processed through N peaking EQ bands. Two EQ configurations are
 * shown; the user picks which one matches what they hear.
 */

import { defineGame } from '$lib/game/config.js';
import type { RoundBase } from '$lib/game/types.js';
import { pickTrack } from '$lib/audio/samples.js';

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

export function generateTarget(bandCount: number, gainPool: number[]): EqConfig {
	// Independent random sign per band so boost/cut pattern carries no information
	const freqs = [...FREQ_STEPS].sort(() => Math.random() - 0.5).slice(0, bandCount);
	freqs.sort((a, b) => a - b); // ascending order
	return freqs.map((freq) => ({
		freq,
		gainDb: (Math.random() < 0.5 ? 1 : -1) * randomFrom(gainPool as readonly number[]),
		q: Q_DEFAULT
	}));
}

/**
 * Builds the wrong option. Gains (and so the boost/cut pattern) are preserved
 * wherever frequencies move, so the distractor can't be told apart by shape alone.
 * - easy: every band moves 2 steps up (wrapping)
 * - medium: one band moves to the nearest free step
 * - hard: one band keeps its frequency but flips boost/cut
 */
export function generateDistractor(target: EqConfig, difficulty: EqGuessDifficulty): EqConfig {
	const stepOf = (freq: number) => FREQ_STEPS.indexOf(freq as (typeof FREQ_STEPS)[number]);
	const pick = Math.floor(Math.random() * target.length);

	let result: EqConfig;
	if (difficulty === 'easy') {
		result = target.map((band) => ({
			...band,
			freq: FREQ_STEPS[(stepOf(band.freq) + 2) % FREQ_STEPS.length]
		}));
	} else if (difficulty === 'medium') {
		const used = new Set(target.map((b) => b.freq));
		const from = stepOf(target[pick].freq);
		let moved: number = target[pick].freq;
		for (let d = 1; d < FREQ_STEPS.length; d++) {
			const candidate = [FREQ_STEPS[from + d], FREQ_STEPS[from - d]].find(
				(f) => f !== undefined && !used.has(f)
			);
			if (candidate !== undefined) {
				moved = candidate;
				break;
			}
		}
		result = target.map((band, i) => (i === pick ? { ...band, freq: moved } : { ...band }));
	} else {
		result = target.map((band, i) =>
			i === pick ? { ...band, gainDb: -band.gainDb } : { ...band }
		);
	}
	return result.sort((a, b) => a.freq - b.freq);
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
			const targetEq = generateTarget(bandCount, gainPool);
			const distractor = generateDistractor(targetEq, difficulty);
			const options: [EqConfig, EqConfig] =
				Math.random() < 0.5 ? [targetEq, distractor] : [distractor, targetEq];
			return { targetEq, options, sampleUrl: pickTrack(), guess: null, result: 'pending' };
		},
		evaluateGuess: (round, guess) => eqConfigsEqual(guess, round.targetEq)
	});
}
