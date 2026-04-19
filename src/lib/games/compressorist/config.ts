/**
 * Compressorist — match the compression settings by ear.
 * Guess: CompressionParams (4 values). Eval: each within tolerance.
 */

import { defineGame } from '$lib/game/config.js';
import type { RoundBase } from '$lib/game/types.js';
import { pickTrack } from '$lib/audio/samples.js';

export interface CompressionParams {
	attack: number; // ms
	release: number; // ms
	ratio: number;
	makeup: number; // dB
}

export interface CompressoristRound extends RoundBase<CompressionParams> {
	targetParams: CompressionParams;
	sampleUrl: string;
}

export type CompressorDifficulty = 'easy' | 'medium' | 'hard';

export interface CompressoristOptions {
	difficulty: CompressorDifficulty;
	roundCount: 3 | 5 | 10;
}

export const DEFAULT_OPTIONS: CompressoristOptions = {
	difficulty: 'medium',
	roundCount: 5
};

// Discrete click-stop values (SSL-inspired) — full sets used for evaluation indexing
export const ATTACK_STEPS = [1, 3, 10, 30, 100] as const; // ms
export const RELEASE_STEPS = [100, 200, 400, 800] as const; // ms
export const RATIO_STEPS = [2, 4, 10, 20] as const; // 10:1 replaces 8:1 for clearer ear-training steps
export const MAKEUP_STEPS = [0, 3, 6, 9, 12] as const; // dB

/** Per-difficulty available steps for both target generation and user knobs. */
export const DIFFICULTY_STEPS: Record<
	CompressorDifficulty,
	{
		attacks: readonly number[];
		releases: readonly number[];
		ratios: readonly number[];
		makeups: readonly number[];
	}
> = {
	easy: {
		attacks: [1, 10, 100],
		releases: [100, 400, 800],
		ratios: [2, 10],
		makeups: [0, 6, 12]
	},
	medium: {
		attacks: [1, 10, 30, 100],
		releases: [100, 200, 400, 800],
		ratios: [2, 4, 10, 20],
		makeups: [0, 3, 6, 12]
	},
	hard: {
		attacks: [1, 3, 10, 30, 100],
		releases: [100, 200, 400, 800],
		ratios: [2, 4, 10, 20],
		makeups: [0, 3, 6, 9, 12]
	}
};

export const DEFAULT_USER_PARAMS: CompressionParams = {
	attack: 10,
	release: 200,
	ratio: 4,
	makeup: 6
};

export const ROUND_COUNT_OPTIONS = [3, 5, 10] as const;

/** Allowed step distance per difficulty level. */
const TOLERANCE: Record<CompressorDifficulty, { attack: number; release: number; makeup: number }> =
	{
		easy: { attack: 2, release: 2, makeup: 6 },
		medium: { attack: 1, release: 1, makeup: 3 },
		hard: { attack: 0, release: 0, makeup: 0 }
	};

export const DIFFICULTY_CONFIG: Record<CompressorDifficulty, { label: string }> = {
	easy: { label: 'Easy' },
	medium: { label: 'Medium' },
	hard: { label: 'Hard' }
};

function randomFrom<T>(arr: readonly T[]): T {
	return arr[Math.floor(Math.random() * arr.length)];
}

export function createCompressoristConfig(opts: CompressoristOptions = DEFAULT_OPTIONS) {
	const tol = TOLERANCE[opts.difficulty];
	const steps = DIFFICULTY_STEPS[opts.difficulty];

	return defineGame<CompressoristRound, CompressionParams>({
		id: 'compressorist',
		roundCount: opts.roundCount,
		generateRound: () => ({
			targetParams: {
				attack: randomFrom(steps.attacks),
				release: randomFrom(steps.releases),
				ratio: randomFrom(steps.ratios),
				makeup: randomFrom(steps.makeups)
			},
			sampleUrl: pickTrack(),
			guess: null,
			result: 'pending'
		}),
		evaluateGuess: (round, guess) => {
			const t = round.targetParams;
			const ai = (v: number) => ATTACK_STEPS.indexOf(v as (typeof ATTACK_STEPS)[number]);
			const ri = (v: number) => RELEASE_STEPS.indexOf(v as (typeof RELEASE_STEPS)[number]);
			return (
				Math.abs(ai(guess.attack) - ai(t.attack)) <= tol.attack &&
				Math.abs(ri(guess.release) - ri(t.release)) <= tol.release &&
				guess.ratio === t.ratio &&
				Math.abs(guess.makeup - t.makeup) <= tol.makeup
			);
		}
	});
}
