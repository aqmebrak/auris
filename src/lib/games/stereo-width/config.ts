/**
 * Stereo Width — how much wider (or narrower) than the original is it?
 * The side (L−R) signal is scaled; the answer is the scale. Samples must have
 * real stereo content (a dual-mono "stereo" file can't change width).
 */

import { defineGame } from '$lib/game/config.js';
import type { SampleRound } from '$lib/game/types.js';
import { pickSample } from '$lib/audio/library.js';

export type WidthDifficulty = 'easy' | 'medium' | 'hard';

export interface StereoWidthOptions {
	difficulty: WidthDifficulty;
	roundCount: 3 | 5 | 10;
}

export const DEFAULT_OPTIONS: StereoWidthOptions = {
	difficulty: 'medium',
	roundCount: 5
};

/** Side scale per choice: 0 = mono, 1 = as original, 2 = side doubled. */
export const DIFFICULTY_CONFIG: Record<WidthDifficulty, { label: string; choices: number[] }> = {
	easy: { label: 'Easy', choices: [0, 0.5, 2, 3] },
	medium: { label: 'Medium', choices: [0, 0.5, 0.75, 1.5, 2, 3] },
	hard: { label: 'Hard', choices: [0.5, 0.75, 1.25, 1.5, 2, 3] }
};

export const ROUND_COUNT_OPTIONS = [3, 5, 10] as const;

/** Below this side/mid ratio a width change is barely audible. */
export const MIN_SIDE_DB = -20;

export function formatWidth(width: number): string {
	return width === 0 ? 'Mono' : `${Math.round(width * 100)}%`;
}

export interface WidthRound extends SampleRound<number> {
	width: number;
	/** Side/mid energy ratio of the sample (for loudness compensation). */
	sideDb: number;
}

export function createStereoWidthConfig(opts: StereoWidthOptions = DEFAULT_OPTIONS) {
	const { choices } = DIFFICULTY_CONFIG[opts.difficulty];

	return defineGame<WidthRound, number>({
		id: 'stereo-width',
		roundCount: opts.roundCount,
		generateRound: () => {
			const sample = pickSample({ channels: 2, minSideDb: MIN_SIDE_DB });
			return {
				width: choices[Math.floor(Math.random() * choices.length)],
				sideDb: sample.sideDb ?? MIN_SIDE_DB,
				sampleUrl: sample.url,
				guess: null,
				result: 'pending'
			};
		},
		evaluateGuess: (round, guess) => guess === round.width
	});
}
