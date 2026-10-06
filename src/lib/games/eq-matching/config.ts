/**
 * EQ Matching — dial in the target EQ by ear.
 * User adjusts N peaking EQ bands (Hz, Gain, and on Hard Q) to match the hidden
 * target. Scored by how closely the resulting frequency response matches
 * (`matchScore`), so near misses earn partial credit.
 * Easy = 1 band, Medium = 2, Hard = 3 (+ Q).
 */

import { defineGame } from '$lib/game/config.js';
import type { RoundBase } from '$lib/game/types.js';
import { audibleFreqs, pickSample, type SampleEntry } from '$lib/audio/library.js';
import { matchScore } from '$lib/audio/eq-math.js';

export interface EqBand {
	freq: number; // Hz
	gainDb: number; // dB (never 0)
	q: number;
}

export type EqMatchingDifficulty = 'easy' | 'medium' | 'hard';

export interface EqMatchingOptions {
	difficulty: EqMatchingDifficulty;
	roundCount: 3 | 5 | 10;
}

export const DEFAULT_OPTIONS: EqMatchingOptions = {
	difficulty: 'medium',
	roundCount: 5
};

export const ROUND_COUNT_OPTIONS = [3, 5, 10] as const;

export const FREQ_STEPS = [125, 250, 500, 1000, 2000, 4000, 8000] as const; // 75–10k range only
export const GAIN_STEPS = [-12, -6, -3, -2, 2, 3, 6, 12] as const; // full set, no 0
export const Q_STEPS = [1, 1.5, 2, 3] as const;

export const MAX_BANDS = 3;

/** Q used when the player can't adjust it (easy/medium). */
export const Q_FIXED = 1.5;

export const DIFFICULTY_CONFIG: Record<
	EqMatchingDifficulty,
	{
		label: string;
		bandCount: number;
		gainPool: readonly number[];
		/** Hard exposes the Q knob; otherwise Q is fixed at `Q_FIXED`. */
		qEditable: boolean;
		/** Match score (0..1) needed to count the round as correct. */
		passThreshold: number;
	}
> = {
	easy: {
		label: 'Easy',
		bandCount: 1,
		gainPool: [-12, -6, 6, 12],
		qEditable: false,
		passThreshold: 0.7
	},
	medium: {
		label: 'Medium',
		bandCount: 2,
		gainPool: [-12, -6, -3, 3, 6, 12],
		qEditable: false,
		passThreshold: 0.8
	},
	hard: {
		label: 'Hard',
		bandCount: 3,
		gainPool: GAIN_STEPS,
		qEditable: true,
		passThreshold: 0.9
	}
};

// Starting user band positions spread across the frequency range
const DEFAULT_FREQS: Record<number, number[]> = {
	1: [1000],
	2: [250, 4000],
	3: [250, 1000, 4000]
};

export function defaultBands(bandCount: number): EqBand[] {
	const freqs = DEFAULT_FREQS[bandCount] ?? DEFAULT_FREQS[1];
	return freqs.map((freq) => ({ freq, gainDb: 6, q: Q_FIXED })); // +6 dB (in all difficulty pools)
}

export interface EqMatchingRound extends RoundBase<EqBand[]> {
	targetBands: EqBand[];
	sampleUrl: string;
}

function randomFrom<T>(arr: readonly T[]): T {
	return arr[Math.floor(Math.random() * arr.length)];
}

export function generateTarget(
	bandCount: number,
	gainPool: readonly number[],
	qEditable: boolean,
	sample?: Pick<SampleEntry, 'spectrum'>
): EqBand[] {
	const remaining: number[] = [...FREQ_STEPS];
	const bands: EqBand[] = [];
	for (let i = 0; i < bandCount; i++) {
		const gainDb = randomFrom(gainPool);
		const freq = randomFrom(audibleFreqs(sample, remaining, gainDb > 0 ? 'boost' : 'cut'));
		remaining.splice(remaining.indexOf(freq), 1);
		bands.push({ freq, gainDb, q: qEditable ? randomFrom(Q_STEPS) : Q_FIXED });
	}
	return bands.sort((a, b) => a.freq - b.freq);
}

export function createEqMatchingConfig(opts: EqMatchingOptions = DEFAULT_OPTIONS) {
	const { bandCount, gainPool, qEditable, passThreshold } = DIFFICULTY_CONFIG[opts.difficulty];

	return defineGame<EqMatchingRound, EqBand[]>({
		id: 'eq-matching',
		roundCount: opts.roundCount,
		generateRound: () => {
			const sample = pickSample();
			return {
				targetBands: generateTarget(bandCount, gainPool, qEditable, sample),
				sampleUrl: sample.url,
				guess: null,
				result: 'pending'
			};
		},
		scoreGuess: (round, guess) => matchScore(round.targetBands, guess),
		passThreshold,
		evaluateGuess: (round, guess) => matchScore(round.targetBands, guess) >= passThreshold
	});
}
