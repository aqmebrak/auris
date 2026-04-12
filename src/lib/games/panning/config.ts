/**
 * Panning ID game — config + round type.
 * Plugs into the generic game engine: `createGameStore(createPanningConfig(options))`.
 */

import { defineGame } from '$lib/game/config.js';
import type { RoundBase } from '$lib/game/types.js';
import { pickTrack } from '$lib/audio/samples.js';

export interface PanRound extends RoundBase<number> {
	targetPan: number; // -1 (full left) to +1 (full right)
	sampleUrl: string;
}

export type PanDifficulty = 'easy' | 'medium' | 'hard';
export type PanZone = 'full' | 'wide' | 'narrow';

export interface PanningOptions {
	difficulty: PanDifficulty;
	zone: PanZone;
	roundCount: 3 | 5 | 10;
}

export const DEFAULT_OPTIONS: PanningOptions = {
	difficulty: 'medium',
	zone: 'full',
	roundCount: 5
};

export const DIFFICULTY_CONFIG: Record<PanDifficulty, { label: string; errorMarginPan: number }> = {
	easy: { label: 'Easy', errorMarginPan: 0.2 },
	medium: { label: 'Medium', errorMarginPan: 0.1 },
	hard: { label: 'Hard', errorMarginPan: 0.05 }
};

export const ZONE_CONFIG: Record<PanZone, { label: string; min: number; max: number }> = {
	full: { label: 'Full (L–R)', min: -1, max: 1 },
	wide: { label: 'Wide (±75%)', min: -0.75, max: 0.75 },
	narrow: { label: 'Narrow (±50%)', min: -0.5, max: 0.5 }
};

export const ROUND_COUNT_OPTIONS = [3, 5, 10] as const;

/** Min distance from center to avoid ambiguous near-center targets. */
const MIN_PAN_DISTANCE = 0.1;

export function createPanningConfig(opts: PanningOptions = DEFAULT_OPTIONS) {
	const diff = DIFFICULTY_CONFIG[opts.difficulty];
	const zone = ZONE_CONFIG[opts.zone];

	return defineGame<PanRound, number>({
		id: 'panning',
		roundCount: opts.roundCount,
		generateRound: () => {
			// Pick random pan in zone range, avoiding near-center ambiguity
			let pan: number;
			do {
				pan = zone.min + Math.random() * (zone.max - zone.min);
			} while (Math.abs(pan) < MIN_PAN_DISTANCE);
			pan = Math.round(pan * 100) / 100;
			return {
				targetPan: pan,
				sampleUrl: pickTrack(),
				guess: null,
				result: 'pending'
			};
		},
		evaluateGuess: (round, guess) => Math.abs(guess - round.targetPan) <= diff.errorMarginPan
	});
}
