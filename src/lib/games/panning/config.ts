/**
 * Panning ID game — config + round type.
 * Plugs into the generic game engine: `createGameStore(createPanningConfig(options))`.
 *
 * Easy picks one of five snap positions; Medium and Hard use the continuous
 * strip. Scored by distance: 1 exact, 0.5 at the error margin, 0 at twice it.
 */

import { defineGame } from '$lib/game/config.js';
import type { SampleRound } from '$lib/game/types.js';
import { pickTrack } from '$lib/audio/samples.js';

export interface PanRound extends SampleRound<number> {
	targetPan: number; // -1 (full left) to +1 (full right)
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

/** Snap positions offered as buttons on Easy. */
export const SNAP_POSITIONS = [-1, -0.5, 0, 0.5, 1] as const;

export const DIFFICULTY_CONFIG: Record<
	PanDifficulty,
	{ label: string; input: 'buttons' | 'strip'; errorMarginPan: number }
> = {
	easy: { label: 'Easy', input: 'buttons', errorMarginPan: 0.3 },
	medium: { label: 'Medium', input: 'strip', errorMarginPan: 0.15 },
	hard: { label: 'Hard', input: 'strip', errorMarginPan: 0.08 }
};

export const ZONE_CONFIG: Record<PanZone, { label: string; min: number; max: number }> = {
	full: { label: 'Full (L–R)', min: -1, max: 1 },
	wide: { label: 'Wide (±75%)', min: -0.75, max: 0.75 },
	narrow: { label: 'Narrow (±50%)', min: -0.5, max: 0.5 }
};

export const ROUND_COUNT_OPTIONS = [3, 5, 10] as const;

/** Min distance from center on the strip, to avoid ambiguous near-center targets. */
const MIN_PAN_DISTANCE = 0.1;

export function positionsInZone(zone: PanZone): number[] {
	const { min, max } = ZONE_CONFIG[zone];
	return SNAP_POSITIONS.filter((p) => p >= min && p <= max);
}

/** 1 at the exact position, 0.5 at the margin, 0 at twice the margin. */
export function panScore(target: number, guess: number, margin: number): number {
	return Math.max(0, 1 - Math.abs(guess - target) / (2 * margin));
}

export function createPanningConfig(opts: PanningOptions = DEFAULT_OPTIONS) {
	const diff = DIFFICULTY_CONFIG[opts.difficulty];
	const zone = ZONE_CONFIG[opts.zone];
	const snaps = positionsInZone(opts.zone);

	return defineGame<PanRound, number>({
		id: 'panning',
		roundCount: opts.roundCount,
		generateRound: () => {
			let pan: number;
			if (diff.input === 'buttons') {
				pan = snaps[Math.floor(Math.random() * snaps.length)];
			} else {
				do {
					pan = zone.min + Math.random() * (zone.max - zone.min);
				} while (Math.abs(pan) < MIN_PAN_DISTANCE);
				pan = Math.round(pan * 100) / 100;
			}
			return { targetPan: pan, sampleUrl: pickTrack(), guess: null, result: 'pending' };
		},
		scoreGuess: (round, guess) => panScore(round.targetPan, guess, diff.errorMarginPan),
		passThreshold: 0.5,
		evaluateGuess: (round, guess) => Math.abs(guess - round.targetPan) <= diff.errorMarginPan
	});
}
