/**
 * dB Change game — config + round type.
 * Two-alternative forced choice: guess which of two dB values was applied.
 */

import { defineGame } from '$lib/game/config.js';
import type { RoundBase } from '$lib/game/types.js';
import { pickTrack } from '$lib/audio/samples.js';

export interface GainRound extends RoundBase<number> {
	targetDb: number; // dB applied, positive = boost, negative = cut
	options: [number, number]; // [optionA, optionB] shuffled — one is targetDb
	sampleUrl: string;
}

export type DbDifficulty = 'easy' | 'medium' | 'hard';

export interface DbChangeOptions {
	difficulty: DbDifficulty;
	roundCount: 3 | 5 | 10;
}

export const DEFAULT_OPTIONS: DbChangeOptions = {
	difficulty: 'medium',
	roundCount: 5
};

/** Magnitudes available per difficulty and the distractor delta range [min, max]. */
export const DIFFICULTY_CONFIG: Record<
	DbDifficulty,
	{ label: string; pool: number[]; deltaRange: [number, number] }
> = {
	easy: { label: 'Easy', pool: [6, 8, 10, 12], deltaRange: [4, 4] },
	medium: { label: 'Medium', pool: [4, 6, 8, 10, 12], deltaRange: [2, 3] },
	hard: { label: 'Hard', pool: [1, 2, 3, 4, 6, 8, 10, 12], deltaRange: [1, 2] }
};

export const ROUND_COUNT_OPTIONS = [3, 5, 10] as const;

function pickDistractor(targetMag: number, pool: number[], deltaRange: [number, number]): number {
	const [dMin, dMax] = deltaRange;
	// Prefer candidates within the delta range, fall back to any other pool value
	const preferred = pool.filter((v) => {
		const diff = Math.abs(v - targetMag);
		return diff >= dMin && diff <= dMax;
	});
	const fallback = pool.filter((v) => v !== targetMag);
	const candidates = preferred.length > 0 ? preferred : fallback;
	return candidates[Math.floor(Math.random() * candidates.length)];
}

export function createDbChangeConfig(opts: DbChangeOptions = DEFAULT_OPTIONS) {
	const diff = DIFFICULTY_CONFIG[opts.difficulty];

	return defineGame<GainRound, number>({
		id: 'db-change',
		roundCount: opts.roundCount,
		generateRound: () => {
			const sign = Math.random() < 0.5 ? 1 : -1;
			const targetMag = diff.pool[Math.floor(Math.random() * diff.pool.length)];
			const targetDb = sign * targetMag;
			const distractorMag = pickDistractor(targetMag, diff.pool, diff.deltaRange);
			const distractorDb = sign * distractorMag;
			const options: [number, number] =
				Math.random() < 0.5 ? [targetDb, distractorDb] : [distractorDb, targetDb];
			return {
				targetDb,
				options,
				sampleUrl: pickTrack(),
				guess: null,
				result: 'pending'
			};
		},
		evaluateGuess: (round, guess) => guess === round.targetDb
	});
}
