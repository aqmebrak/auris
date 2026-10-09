/**
 * Phase / Comb — hear what a delayed copy does to a signal.
 * B = x + polarity · x(t − delay), A = x, both mono (the same signal in both
 * ears, so the only difference is the delayed copy).
 *   type   comb (same polarity: hollow, notches at odd multiples of 1/(2d))
 *          vs polarity-flipped copy (thin, notches at 0 and multiples of 1/d)
 *   delay  identify the delay of a comb
 */

import { defineGame } from '$lib/game/config.js';
import type { SampleRound } from '$lib/game/types.js';
import { pickTrack } from '$lib/audio/samples.js';

export type PhaseMode = 'type' | 'delay';
export type PhaseDifficulty = 'easy' | 'medium' | 'hard';
export type Polarity = 1 | -1;

export interface PhaseCombOptions {
	mode: PhaseMode;
	difficulty: PhaseDifficulty;
	roundCount: 3 | 5 | 10;
}

export const DEFAULT_OPTIONS: PhaseCombOptions = {
	mode: 'type',
	difficulty: 'medium',
	roundCount: 5
};

export const MODE_CONFIG: Record<PhaseMode, { label: string; intro: string }> = {
	type: {
		label: 'Type',
		intro:
			'Compare Original with the version that has a delayed copy mixed in. Is the copy in phase (comb filter, hollow) or polarity-flipped (thin, low end cancels)?'
	},
	delay: {
		label: 'Delay',
		intro:
			'The Adjusted version has a delayed copy mixed in (comb filter). The longer the delay, the lower the first notch. Pick the delay.'
	}
};

export const DIFFICULTY_CONFIG: Record<
	PhaseDifficulty,
	{ label: string; typeDelays: number[]; delayChoices: number[] }
> = {
	easy: { label: 'Easy', typeDelays: [1, 2, 3], delayChoices: [0.5, 2, 5] },
	medium: { label: 'Medium', typeDelays: [0.5, 1, 2], delayChoices: [0.2, 0.5, 1, 2, 5] },
	hard: { label: 'Hard', typeDelays: [0.1, 0.2, 0.4], delayChoices: [0.1, 0.2, 0.3, 0.5, 1, 2] }
};

export const ROUND_COUNT_OPTIONS = [3, 5, 10] as const;

/** Type-mode choices: the polarity of the delayed copy. */
export const POLARITY_CHOICES: readonly Polarity[] = [1, -1];

export const polarityLabel = (p: number) => (p === 1 ? 'In phase (comb)' : 'Polarity flipped');
export const formatDelay = (ms: number) => `${ms} ms`;

export function choicesFor(mode: PhaseMode, difficulty: PhaseDifficulty): number[] {
	return mode === 'type' ? [...POLARITY_CHOICES] : DIFFICULTY_CONFIG[difficulty].delayChoices;
}

export function choiceLabel(mode: PhaseMode, value: number): string {
	return mode === 'type' ? polarityLabel(value) : formatDelay(value);
}

export interface PhaseCombRound extends SampleRound<number> {
	mode: PhaseMode;
	delayMs: number;
	polarity: Polarity;
	/** Type mode: the polarity (1 | −1). Delay mode: the delay in ms. */
	answer: number;
}

function randomFrom<T>(arr: readonly T[]): T {
	return arr[Math.floor(Math.random() * arr.length)];
}

export function createPhaseCombConfig(opts: PhaseCombOptions = DEFAULT_OPTIONS) {
	const diff = DIFFICULTY_CONFIG[opts.difficulty];

	return defineGame<PhaseCombRound, number>({
		id: 'phase-comb',
		roundCount: opts.roundCount,
		generateRound: () => {
			const base = { sampleUrl: pickTrack(), guess: null, result: 'pending' as const };
			if (opts.mode === 'type') {
				const polarity = randomFrom(POLARITY_CHOICES);
				return {
					...base,
					mode: 'type',
					delayMs: randomFrom(diff.typeDelays),
					polarity,
					answer: polarity
				};
			}
			const delayMs = randomFrom(diff.delayChoices);
			return { ...base, mode: 'delay', delayMs, polarity: 1, answer: delayMs };
		},
		evaluateGuess: (round, guess) => guess === round.answer
	});
}
