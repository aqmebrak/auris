/**
 * Frequency ID — find where an EQ bell is applied.
 * Plugs into the generic game engine: `createGameStore(createFreqIdConfig(options))`.
 *
 * Easy picks one of the octave bands (boost only, wide Q); Medium and Hard use
 * the continuous strip (cuts allowed, narrower Q). Scored by octave error:
 * 1 at the exact frequency, 0.5 at the error margin, 0 at twice the margin.
 */

import { defineGame } from '$lib/game/config.js';
import type { SampleRound } from '$lib/game/types.js';
import { audibleFreqs, pickSample, type SampleEntry } from '$lib/audio/library.js';
import { logGrid } from '$lib/audio/eq-math.js';

export interface FreqIdRound extends SampleRound<number> {
	targetFreq: number;
	gainDb: number;
	q: number;
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

/** Octave-spaced band centres offered as buttons on Easy. */
export const OCTAVE_BANDS = [125, 250, 500, 1000, 2000, 4000, 8000] as const;

export const DIFFICULTY_CONFIG: Record<
	Difficulty,
	{
		label: string;
		/** 'buttons' = pick an octave band; 'strip' = click anywhere on the log scale. */
		input: 'buttons' | 'strip';
		errorMarginOctaves: number;
		gainOptions: number[];
		allowCuts: boolean;
		qOptions: number[];
	}
> = {
	easy: {
		label: 'Easy',
		input: 'buttons',
		errorMarginOctaves: 0.75,
		gainOptions: [12],
		allowCuts: false,
		qOptions: [1.4]
	},
	medium: {
		label: 'Medium',
		input: 'strip',
		errorMarginOctaves: 0.5,
		gainOptions: [9, 12],
		allowCuts: true,
		qOptions: [2]
	},
	hard: {
		label: 'Hard',
		input: 'strip',
		errorMarginOctaves: 1 / 3,
		gainOptions: [6, 9, 12],
		allowCuts: true,
		qOptions: [2.5, 3.2, 4]
	}
};

export const ZONE_CONFIG: Record<FreqZone, { label: string; min: number; max: number }> = {
	full: { label: 'Full (75–10k)', min: 75, max: 10000 },
	lows: { label: 'Lows (75–500)', min: 75, max: 500 },
	mids: { label: 'Mids (200–5k)', min: 200, max: 5000 },
	highs: { label: 'Highs (1k–10k)', min: 1000, max: 10000 }
};

export const ROUND_COUNT_OPTIONS = [3, 5, 10] as const;

/** Octave bands inside a zone (the Easy buttons). */
export function bandsInZone(zone: FreqZone): number[] {
	const { min, max } = ZONE_CONFIG[zone];
	return OCTAVE_BANDS.filter((f) => f >= min && f <= max);
}

/** 1 at the exact frequency, 0.5 at the margin, 0 at twice the margin. */
export function freqScore(target: number, guess: number, marginOctaves: number): number {
	const err = Math.abs(Math.log2(guess / target));
	return Math.max(0, 1 - err / (2 * marginOctaves));
}

/**
 * Target frequency the sample can reveal: an audible octave band (Easy) or a
 * random point on the log scale restricted to audible regions (strip).
 */
export function pickTargetFreq(
	sample: Pick<SampleEntry, 'spectrum'>,
	input: 'buttons' | 'strip',
	zoneKey: FreqZone,
	kind: 'boost' | 'cut'
): number {
	if (input === 'buttons') return randomFrom(audibleFreqs(sample, bandsInZone(zoneKey), kind));
	const { min, max } = ZONE_CONFIG[zoneKey];
	const grid = audibleFreqs(sample, logGrid(min, max, 6), kind);
	const jitter = 2 ** ((Math.random() - 0.5) / 6); // ± half a grid step
	return Math.round(Math.min(max, Math.max(min, randomFrom(grid) * jitter)));
}

function randomFrom<T>(arr: readonly T[]): T {
	return arr[Math.floor(Math.random() * arr.length)];
}

export function createFreqIdConfig(opts: FreqIdOptions = DEFAULT_OPTIONS) {
	const diff = DIFFICULTY_CONFIG[opts.difficulty];

	return defineGame<FreqIdRound, number>({
		id: 'freq-id',
		roundCount: opts.roundCount,
		generateRound: () => {
			const sample = pickSample();
			const gainMag = randomFrom(diff.gainOptions);
			const cut = diff.allowCuts && Math.random() < 0.5;
			return {
				targetFreq: pickTargetFreq(sample, diff.input, opts.zone, cut ? 'cut' : 'boost'),
				gainDb: cut ? -gainMag : gainMag,
				q: randomFrom(diff.qOptions),
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

/** Default error margin for FreqStrip display when no difficulty is selected yet. */
export const ERROR_MARGIN_OCTAVES = DIFFICULTY_CONFIG.medium.errorMarginOctaves;
