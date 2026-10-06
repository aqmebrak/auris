/**
 * Filter Finder — find the cutoff of a high-pass or low-pass.
 * A = original, B = filtered. Easy picks one of the octave-spaced cutoffs;
 * Medium/Hard use the continuous strip. Scored by octave error like Frequency ID
 * (1 exact, 0.5 at the margin, 0 at twice it). Cutoffs are drawn only where the
 * sample has energy in the region the filter removes.
 */

import { defineGame } from '$lib/game/config.js';
import type { SampleRound } from '$lib/game/types.js';
import { audibleCutoffs, pickSample, type SampleEntry } from '$lib/audio/library.js';
import { logGrid, type PassSlope, type PassType } from '$lib/audio/eq-math.js';
import { freqScore } from '$lib/frequency.js';

export type FilterChoice = PassType | 'mixed';
export type FilterDifficulty = 'easy' | 'medium' | 'hard';

export interface FilterFinderOptions {
	filter: FilterChoice;
	difficulty: FilterDifficulty;
	roundCount: 3 | 5 | 10;
}

export const DEFAULT_OPTIONS: FilterFinderOptions = {
	filter: 'highpass',
	difficulty: 'medium',
	roundCount: 5
};

export const FILTER_CONFIG: Record<FilterChoice, { label: string }> = {
	highpass: { label: 'High-pass' },
	lowpass: { label: 'Low-pass' },
	mixed: { label: 'Mixed' }
};

/** Where cutoffs live, tuned for rock/metal: guitar/bass HPFs vs. top-end LPFs. */
export const RANGE: Record<PassType, { min: number; max: number }> = {
	highpass: { min: 40, max: 1600 },
	lowpass: { min: 2000, max: 16000 }
};

/** Octave-spaced cutoffs offered as buttons on Easy. */
export const STEPS: Record<PassType, number[]> = {
	highpass: [63, 125, 250, 500, 1000],
	lowpass: [2000, 4000, 8000, 16000]
};

export const DIFFICULTY_CONFIG: Record<
	FilterDifficulty,
	{ label: string; input: 'buttons' | 'strip'; errorMarginOctaves: number; slope: PassSlope }
> = {
	easy: { label: 'Easy', input: 'buttons', errorMarginOctaves: 0.75, slope: 24 },
	medium: { label: 'Medium', input: 'strip', errorMarginOctaves: 0.5, slope: 24 },
	hard: { label: 'Hard', input: 'strip', errorMarginOctaves: 1 / 3, slope: 12 }
};

export const ROUND_COUNT_OPTIONS = [3, 5, 10] as const;

export interface FilterRound extends SampleRound<number> {
	type: PassType;
	targetFreq: number;
	slope: PassSlope;
}

function randomFrom<T>(arr: readonly T[]): T {
	return arr[Math.floor(Math.random() * arr.length)];
}

export function pickCutoff(
	sample: Pick<SampleEntry, 'spectrum'>,
	input: 'buttons' | 'strip',
	type: PassType
): number {
	if (input === 'buttons') return randomFrom(audibleCutoffs(sample, STEPS[type], type));
	const { min, max } = RANGE[type];
	const grid = audibleCutoffs(sample, logGrid(min, max, 6), type);
	const jitter = 2 ** ((Math.random() - 0.5) / 6); // ± half a grid step
	return Math.round(Math.min(max, Math.max(min, randomFrom(grid) * jitter)));
}

export function createFilterFinderConfig(opts: FilterFinderOptions = DEFAULT_OPTIONS) {
	const diff = DIFFICULTY_CONFIG[opts.difficulty];

	return defineGame<FilterRound, number>({
		id: 'filter-finder',
		roundCount: opts.roundCount,
		generateRound: () => {
			const sample = pickSample();
			const type: PassType =
				opts.filter === 'mixed' ? randomFrom(['highpass', 'lowpass'] as const) : opts.filter;
			return {
				type,
				targetFreq: pickCutoff(sample, diff.input, type),
				slope: diff.slope,
				sampleUrl: sample.url,
				guess: null,
				result: 'pending'
			};
		},
		scoreGuess: (round, guess) => freqScore(round.targetFreq, guess, diff.errorMarginOctaves),
		passThreshold: 0.5,
		evaluateGuess: (round, guess) =>
			Math.abs(Math.log2(guess / round.targetFreq)) <= diff.errorMarginOctaves
	});
}
