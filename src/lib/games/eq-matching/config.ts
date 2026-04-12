/**
 * EQ Matching — dial in the target EQ by ear.
 * User adjusts N peaking EQ bands (Hz, Gain, Q) to match the hidden target.
 * Difficulty controls band count: Easy=1, Medium=2, Hard=3.
 */

import { defineGame } from '$lib/game/config.js';
import type { RoundBase } from '$lib/game/types.js';
import { pickTrack } from '$lib/audio/samples.js';

export interface EqBand {
	freq: number; // Hz
	gainDb: number; // dB (never 0)
	q: number;
}

export type EqMatchingDifficulty = 'easy' | 'medium' | 'hard';

export interface EqMatchingOptions {
	difficulty: EqMatchingDifficulty;
	roundCount: 3 | 5 | 10;
}

export const DEFAULT_OPTIONS: EqMatchingOptions = {
	difficulty: 'medium',
	roundCount: 5
};

export const ROUND_COUNT_OPTIONS = [3, 5, 10] as const;

export const FREQ_STEPS = [63, 125, 250, 500, 1000, 2000, 4000, 8000] as const;
export const GAIN_STEPS = [-12, -6, -3, -2, 2, 3, 6, 12] as const; // no 0
export const Q_STEPS = [1, 1.5, 2, 3] as const;

export const MAX_BANDS = 3;

export const DIFFICULTY_CONFIG: Record<EqMatchingDifficulty, { label: string; bandCount: number }> =
	{
		easy: { label: 'Easy', bandCount: 1 },
		medium: { label: 'Medium', bandCount: 2 },
		hard: { label: 'Hard', bandCount: 3 }
	};

// Starting user band positions spread across the frequency range
const DEFAULT_FREQS: Record<number, number[]> = {
	1: [1000],
	2: [250, 4000],
	3: [250, 1000, 4000]
};

export function defaultBands(bandCount: number): EqBand[] {
	const freqs = DEFAULT_FREQS[bandCount] ?? DEFAULT_FREQS[1];
	return freqs.map((freq) => ({ freq, gainDb: GAIN_STEPS[4], q: Q_STEPS[1] })); // +2 dB, Q 1.5
}

export interface EqMatchingRound extends RoundBase<EqBand[]> {
	targetBands: EqBand[];
	sampleUrl: string;
}

function randomFrom<T>(arr: readonly T[]): T {
	return arr[Math.floor(Math.random() * arr.length)];
}

function generateTarget(bandCount: number): EqBand[] {
	const freqs = [...FREQ_STEPS].sort(() => Math.random() - 0.5).slice(0, bandCount);
	freqs.sort((a, b) => a - b);
	return freqs.map((freq) => ({
		freq,
		gainDb: randomFrom(GAIN_STEPS),
		q: randomFrom(Q_STEPS)
	}));
}

function bandsEqual(a: EqBand[], b: EqBand[]): boolean {
	if (a.length !== b.length) return false;
	const sort = (arr: EqBand[]) => [...arr].sort((x, y) => x.freq - y.freq);
	return sort(a).every(
		(band, i) =>
			band.freq === sort(b)[i].freq && band.gainDb === sort(b)[i].gainDb && band.q === sort(b)[i].q
	);
}

export function createEqMatchingConfig(opts: EqMatchingOptions = DEFAULT_OPTIONS) {
	const { bandCount } = DIFFICULTY_CONFIG[opts.difficulty];

	return defineGame<EqMatchingRound, EqBand[]>({
		id: 'eq-matching',
		roundCount: opts.roundCount,
		generateRound: () => ({
			targetBands: generateTarget(bandCount),
			sampleUrl: pickTrack(),
			guess: null,
			result: 'pending'
		}),
		evaluateGuess: (round, guess) => bandsEqual(guess, round.targetBands)
	});
}
