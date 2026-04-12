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
export const FREQ_STEPS = [63, 125, 250, 500, 1000, 2000, 4000, 8000] as const;

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

function generateTarget(bandCount: number, gainPool: number[]): EqConfig {
	// Pick bandCount distinct frequencies, alternating boost/cut
	const freqs = [...FREQ_STEPS].sort(() => Math.random() - 0.5).slice(0, bandCount);
	freqs.sort((a, b) => a - b); // ascending order
	return freqs.map((freq, i) => ({
		freq,
		gainDb: (i % 2 === 0 ? 1 : -1) * randomFrom(gainPool as readonly number[]),
		q: Q_DEFAULT
	}));
}

function generateDistractor(target: EqConfig): EqConfig {
	// Shift each band's freq by 1 step in FREQ_STEPS, and negate or shift the gain
	return target.map((band) => {
		const idx = FREQ_STEPS.indexOf(band.freq as (typeof FREQ_STEPS)[number]);
		// Move freq up by 1 step, wrap around within array
		const newIdx = (idx + 1) % FREQ_STEPS.length;
		const newFreq = FREQ_STEPS[newIdx];
		// Negate the gain (boost↔cut)
		return { freq: newFreq, gainDb: -band.gainDb, q: Q_DEFAULT };
	});
}

export function eqConfigsEqual(a: EqConfig, b: EqConfig): boolean {
	if (a.length !== b.length) return false;
	// Both are sorted ascending by freq (generated that way)
	return a.every((band, i) => band.freq === b[i].freq && band.gainDb === b[i].gainDb);
}

export function createEqGuessConfig(opts: EqGuessOptions = DEFAULT_OPTIONS) {
	const { bandCount, gainPool } = DIFFICULTY_CONFIG[opts.difficulty];

	return defineGame<EqGuessRound, EqConfig>({
		id: 'eq-guess',
		roundCount: opts.roundCount,
		generateRound: () => {
			const targetEq = generateTarget(bandCount, gainPool);
			const distractor = generateDistractor(targetEq);
			const options: [EqConfig, EqConfig] =
				Math.random() < 0.5 ? [targetEq, distractor] : [distractor, targetEq];
			return { targetEq, options, sampleUrl: pickTrack(), guess: null, result: 'pending' };
		},
		evaluateGuess: (round, guess) => eqConfigsEqual(guess, round.targetEq)
	});
}
