/**
 * Frequency ID game — config + round type.
 * Plugs into the generic game engine: `createGameStore(freqIdConfig)`.
 */

import { defineGame } from '$lib/game/config.js';
import type { RoundBase } from '$lib/game/types.js';
import { pickTrack } from '$lib/audio/samples.js';

export interface FreqIdRound extends RoundBase<number> {
	targetFreq: number;
	gainDb: number;
	sampleUrl: string;
}

export const ERROR_MARGIN_OCTAVES = 1 / 3;

const FREQ_MIN = 20;
const FREQ_MAX = 20000;

export const freqIdConfig = defineGame<FreqIdRound, number>({
	id: 'freq-id',
	roundCount: 5,
	generateRound: () => ({
		targetFreq: Math.round(FREQ_MIN * Math.pow(FREQ_MAX / FREQ_MIN, Math.random())),
		gainDb: Math.random() < 0.5 ? 12 : -12,
		sampleUrl: pickTrack(),
		guess: null,
		result: 'pending'
	}),
	evaluateGuess: (round, guess) =>
		Math.abs(Math.log2(guess / round.targetFreq)) <= ERROR_MARGIN_OCTAVES
});
