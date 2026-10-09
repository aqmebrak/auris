/**
 * Phase/Comb audio — a mono-summed source (so A and B put the same signal in
 * both ears) through a delayed-copy comb, then a loudness-compensation gain
 * computed from the sample's spectrum. A = mono original, B = comb.
 */

import { AudioPlayer } from '$lib/audio/player.js';
import { AudioChain } from '$lib/audio/chain.js';
import type { Playable } from '$lib/audio/playable.js';
import { createCompensatedPlayable } from '$lib/audio/compensated-chain.js';
import { createComb, createGain, type CombHandle, type GainHandle } from '$lib/audio/effects.js';
import { combResponseDb } from '$lib/audio/eq-math.js';
import { compensationFromResponse } from '$lib/audio/spectrum.js';
import type { Polarity } from './config.js';

export interface PhaseCombAudio {
	playable: Playable;
	setComb(delayMs: number, polarity: Polarity): void;
}

export function createPhaseCombAudio(): PhaseCombAudio {
	const player = new AudioPlayer();
	let comb: CombHandle | null = null;
	let compensation: GainHandle | null = null;

	const chain = new AudioChain(player, [
		(ctx) => (comb = createComb(ctx)),
		(ctx) => (compensation = createGain(ctx, 0))
	]);
	// Mono source: the A/B difference is the delayed copy only, not a stereo fold-down
	const { playable, spectrum } = createCompensatedPlayable(chain, player, {
		mono: true,
		onDestroy: () => {
			comb = null;
			compensation = null;
		}
	});

	return {
		playable,
		setComb(delayMs, polarity) {
			comb?.set(delayMs, polarity);
			compensation?.setGain(
				compensationFromResponse(spectrum(), (f) => combResponseDb(f, delayMs, polarity))
			);
		}
	};
}
