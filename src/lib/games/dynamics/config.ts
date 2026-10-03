/**
 * Dynamics — five compression drills in one game (replaces Compressorist).
 *   detect  which of two clips is compressed
 *   ratio   identify the ratio       (original vs compressed)
 *   attack  identify the attack      (original vs compressed)
 *   release identify the release     (original vs compressed)
 *   match   dial in ratio/attack/release to match a hidden target (graded)
 * Threshold is relative to each sample's level and makeup gain is automatic
 * (see `DynamicsAudio`), so there is never a loudness cue.
 */

import { defineGame } from '$lib/game/config.js';
import type { SampleRound } from '$lib/game/types.js';
import { pickTrack } from '$lib/audio/samples.js';
import { formatAttack, formatRatio, formatRelease } from '$lib/format.js';
import type { CompSpec, PathSpec } from './audio.js';

export type DynamicsMode = 'detect' | 'ratio' | 'attack' | 'release' | 'match';
export type DynamicsDifficulty = 'easy' | 'medium' | 'hard';
export type DynamicsGuess = number | CompSpec;

export interface DynamicsOptions {
	mode: DynamicsMode;
	difficulty: DynamicsDifficulty;
	roundCount: 3 | 5 | 10;
}

export const DEFAULT_OPTIONS: DynamicsOptions = {
	mode: 'detect',
	difficulty: 'medium',
	roundCount: 5
};

export const ROUND_COUNT_OPTIONS = [3, 5, 10] as const;

export const MODE_CONFIG: Record<DynamicsMode, { label: string; intro: string }> = {
	detect: { label: 'Detect', intro: 'One clip is compressed, the other is not. Which is which?' },
	ratio: { label: 'Ratio', intro: 'Compare Original and Compressed. Identify the ratio.' },
	attack: { label: 'Attack', intro: 'Compare Original and Compressed. Identify the attack time.' },
	release: {
		label: 'Release',
		intro: 'Compare Original and Compressed. Identify the release time.'
	},
	match: {
		label: 'Match',
		intro: 'Set ratio, attack and release so Your settings sound like the Target.'
	}
};

/** Difficulty knobs shared by all modes. Threshold offset is dB relative to sample RMS. */
export const DIFFICULTY_CONFIG: Record<
	DynamicsDifficulty,
	{
		label: string;
		thresholdOffsetDb: number;
		/** Ratio of the compressed clip in detect mode. */
		detectRatio: number;
		ratios: number[];
		attacks: number[];
		releases: number[];
		/** Match mode: min mean score (0..1) to count as correct. */
		passThreshold: number;
	}
> = {
	easy: {
		label: 'Easy',
		thresholdOffsetDb: -8,
		detectRatio: 10,
		ratios: [2, 10],
		attacks: [1, 50],
		releases: [50, 800],
		passThreshold: 0.5
	},
	medium: {
		label: 'Medium',
		thresholdOffsetDb: -6,
		detectRatio: 4,
		ratios: [2, 4, 10],
		attacks: [1, 10, 50],
		releases: [50, 200, 800],
		passThreshold: 0.67
	},
	hard: {
		label: 'Hard',
		thresholdOffsetDb: -4,
		detectRatio: 2,
		ratios: [2, 3, 4, 6, 10],
		attacks: [1, 3, 10, 30, 100],
		releases: [50, 100, 200, 400, 800],
		passThreshold: 0.83
	}
};

/** Fixed values for the parameters a drill is *not* asking about. */
const FIXED = { attackMs: 10, releaseMs: 150, ratio: 6 };

export interface DynamicsRound extends SampleRound<DynamicsGuess> {
	mode: DynamicsMode;
	/** What each side of the A/B toggle plays; `null` = original. */
	a: PathSpec;
	b: PathSpec;
	thresholdOffsetDb: number;
	/** Quiz modes: the correct choice value. Match mode: the hidden target. */
	answer: DynamicsGuess;
	/** Quiz modes: selectable values. Empty in match mode. */
	choices: number[];
}

export function modeSideLabels(mode: DynamicsMode): Record<'A' | 'B', string> {
	if (mode === 'detect') return { A: 'Clip 1', B: 'Clip 2' };
	if (mode === 'match') return { A: 'Your settings', B: 'Target' };
	return { A: 'Original', B: 'Compressed' };
}

export function choiceLabel(mode: DynamicsMode, value: number): string {
	if (mode === 'detect') return `Clip ${value + 1}`;
	if (mode === 'ratio') return formatRatio(value);
	if (mode === 'attack') return formatAttack(value);
	return formatRelease(value);
}

/** Steps the match-mode knobs can take. Targets are drawn from the same lists. */
export const MATCH_STEPS: Record<
	DynamicsDifficulty,
	{ ratios: number[]; attacks: number[]; releases: number[] }
> = {
	easy: { ratios: [2, 4, 10], attacks: [1, 10, 50], releases: [50, 200, 800] },
	medium: {
		ratios: [2, 3, 4, 6, 10],
		attacks: [1, 3, 10, 30, 100],
		releases: [50, 100, 200, 400, 800]
	},
	hard: {
		ratios: [1.5, 2, 3, 4, 6, 10, 20],
		attacks: [1, 2, 5, 10, 20, 50, 100],
		releases: [50, 100, 200, 400, 800]
	}
};

export function defaultSpec(difficulty: DynamicsDifficulty): CompSpec {
	const s = MATCH_STEPS[difficulty];
	return {
		ratio: s.ratios[Math.floor(s.ratios.length / 2)],
		attackMs: s.attacks[Math.floor(s.attacks.length / 2)],
		releaseMs: s.releases[Math.floor(s.releases.length / 2)]
	};
}

/** 1 = same step, 0.5 = adjacent step, 0 = further. */
function stepScore(steps: number[], target: number, guess: number): number {
	const dist = Math.abs(steps.indexOf(target) - steps.indexOf(guess));
	return dist === 0 ? 1 : dist === 1 ? 0.5 : 0;
}

export function matchSpecScore(
	difficulty: DynamicsDifficulty,
	target: CompSpec,
	guess: CompSpec
): number {
	const s = MATCH_STEPS[difficulty];
	return (
		(stepScore(s.ratios, target.ratio, guess.ratio) +
			stepScore(s.attacks, target.attackMs, guess.attackMs) +
			stepScore(s.releases, target.releaseMs, guess.releaseMs)) /
		3
	);
}

function randomFrom<T>(arr: readonly T[]): T {
	return arr[Math.floor(Math.random() * arr.length)];
}

export function createDynamicsConfig(opts: DynamicsOptions = DEFAULT_OPTIONS) {
	const diff = DIFFICULTY_CONFIG[opts.difficulty];
	const steps = MATCH_STEPS[opts.difficulty];

	function generate(): DynamicsRound {
		const base = {
			mode: opts.mode,
			thresholdOffsetDb: diff.thresholdOffsetDb,
			sampleUrl: pickTrack(),
			guess: null,
			result: 'pending' as const
		};
		switch (opts.mode) {
			case 'detect': {
				const compressed: CompSpec = {
					ratio: diff.detectRatio,
					attackMs: FIXED.attackMs,
					releaseMs: FIXED.releaseMs
				};
				const answer = Math.random() < 0.5 ? 0 : 1; // index of the compressed clip
				return {
					...base,
					a: answer === 0 ? compressed : null,
					b: answer === 1 ? compressed : null,
					answer,
					choices: [0, 1]
				};
			}
			case 'ratio': {
				const ratio = randomFrom(diff.ratios);
				return {
					...base,
					a: null,
					b: { ...FIXED_SPEC, ratio },
					answer: ratio,
					choices: diff.ratios
				};
			}
			case 'attack': {
				const attackMs = randomFrom(diff.attacks);
				return {
					...base,
					a: null,
					b: { ...FIXED_SPEC, attackMs },
					answer: attackMs,
					choices: diff.attacks
				};
			}
			case 'release': {
				const releaseMs = randomFrom(diff.releases);
				return {
					...base,
					a: null,
					b: { ...FIXED_SPEC, releaseMs },
					answer: releaseMs,
					choices: diff.releases
				};
			}
			case 'match': {
				const target: CompSpec = {
					ratio: randomFrom(steps.ratios),
					attackMs: randomFrom(steps.attacks),
					releaseMs: randomFrom(steps.releases)
				};
				return { ...base, a: defaultSpec(opts.difficulty), b: target, answer: target, choices: [] };
			}
		}
	}

	const isMatch = opts.mode === 'match';

	return defineGame<DynamicsRound, DynamicsGuess>({
		id: 'dynamics',
		roundCount: opts.roundCount,
		generateRound: generate,
		evaluateGuess: (round, guess) =>
			typeof guess === 'number'
				? guess === round.answer
				: matchSpecScore(opts.difficulty, round.answer as CompSpec, guess) >= diff.passThreshold,
		...(isMatch && {
			scoreGuess: (round: DynamicsRound, guess: DynamicsGuess) =>
				typeof guess === 'number'
					? 0
					: matchSpecScore(opts.difficulty, round.answer as CompSpec, guess),
			passThreshold: diff.passThreshold
		})
	});
}

const FIXED_SPEC: CompSpec = {
	ratio: FIXED.ratio,
	attackMs: FIXED.attackMs,
	releaseMs: FIXED.releaseMs
};
