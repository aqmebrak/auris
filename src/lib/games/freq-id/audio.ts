/**
 * Frequency ID audio — an `AudioChain` with a peaking EQ followed by a
 * loudness-compensation gain. A = dry, B = EQ'd; the compensation cancels the
 * EQ's estimated loudness change for the loaded sample, so the answer has to
 * come from timbre, not from "that part got louder".
 */

import { AudioPlayer } from '$lib/audio/player.js';
import { AudioChain } from '$lib/audio/chain.js';
import type { Playable } from '$lib/audio/playable.js';
import { createCompensatedPlayable } from '$lib/audio/compensated-chain.js';
import {
	createGain,
	createPeakingEq,
	type GainHandle,
	type PeakingEqHandle
} from '$lib/audio/effects.js';
import { compensationGainDb } from '$lib/audio/spectrum.js';

export interface FreqIdAudio {
	playable: Playable;
	setFilter(freq: number, gainDb: number, q: number): void;
}

export function createFreqIdAudio(): FreqIdAudio {
	const player = new AudioPlayer();
	let peaking: PeakingEqHandle | null = null;
	let compensation: GainHandle | null = null;

	const chain = new AudioChain(player, [
		(ctx) => (peaking = createPeakingEq(ctx, { freq: 1000, gainDb: 0, q: 2 })),
		(ctx) => (compensation = createGain(ctx, 0))
	]);
	const { playable, spectrum } = createCompensatedPlayable(chain, player, () => {
		peaking = null;
		compensation = null;
	});

	return {
		playable,
		setFilter(freq, gainDb, q) {
			peaking?.setFilter(freq, gainDb, q);
			compensation?.setGain(compensationGainDb(spectrum(), [{ freq, gainDb, q }]));
		}
	};
}
