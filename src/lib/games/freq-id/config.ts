/**
 * Frequency ID game — config + round type.
 * Plugs into the generic game engine: `createGameStore(createFreqIdConfig(options))`.
 */

import { defineGame } from '$lib/game/config.js';
import type { RoundBase } from '$lib/game/types.js';
import { pickTrack } from '$lib/audio/samples.js';

export interface FreqIdRound extends RoundBase<number> {
	targetFreq: number;
	gainDb: number;
	sampleUrl: string;
}

export type Difficulty = 'easy' | 'medium' | 'hard';
export type FreqZone = 'full' | 'lows' | 'mids' | 'highs';

export interface FreqIdOptions {
	difficulty: Difficulty;
	zone: FreqZone;
	roundCount: 3 | 5 | 10;
}

export const DEFAULT_OPTIONS: FreqIdOptions = {
	difficulty: 'medium',
	zone: 'full',
	roundCount: 5
};

export const DIFFICULTY_CONFIG: Record<
	Difficulty,
	{ label: string; errorMarginOctaves: number; gainOptions: number[] }
> = {
	easy: { label: 'Easy', errorMarginOctaves: 1.5, gainOptions: [6, 9, 12] },
	medium: { label: 'Medium', errorMarginOctaves: 0.75, gainOptions: [6, 9, 12] },
	hard: { label: 'Hard', errorMarginOctaves: 1 / 4, gainOptions: [6, 9, 12] }
};

export const ZONE_CONFIG: Record<FreqZone, { label: string; min: number; max: number }> = {
	full: { label: 'Full (75–10k)', min: 75, max: 10000 },
	lows: { label: 'Lows (75–500)', min: 75, max: 500 },
	mids: { label: 'Mids (200–5k)', min: 200, max: 5000 },
	highs: { label: 'Highs (1k–10k)', min: 1000, max: 10000 }
};

export const ROUND_COUNT_OPTIONS = [3, 5, 10] as const;

export function createFreqIdConfig(opts: FreqIdOptions = DEFAULT_OPTIONS) {
	const diff = DIFFICULTY_CONFIG[opts.difficulty];
	const zone = ZONE_CONFIG[opts.zone];

	return defineGame<FreqIdRound, number>({
		id: 'freq-id',
		roundCount: opts.roundCount,
		generateRound: () => {
			const gainMag = diff.gainOptions[Math.floor(Math.random() * diff.gainOptions.length)];
			return {
				targetFreq: Math.round(zone.min * Math.pow(zone.max / zone.min, Math.random())),
				gainDb: Math.random() < 0.5 ? gainMag : -gainMag,
				sampleUrl: pickTrack(),
				guess: null,
				result: 'pending'
			};
		},
		evaluateGuess: (round, guess) =>
			Math.abs(Math.log2(guess / round.targetFreq)) <= diff.errorMarginOctaves
	});
}

/** Default error margin for FreqStrip display when no difficulty is selected yet. */
export const ERROR_MARGIN_OCTAVES = DIFFICULTY_CONFIG.medium.errorMarginOctaves;
