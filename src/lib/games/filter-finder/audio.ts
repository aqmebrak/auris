/**
 * Filter Finder audio — `AudioChain` of a high/low-pass followed by a
 * loudness-compensation gain. A = dry, B = filtered and level-matched.
 */

import { AudioPlayer } from '$lib/audio/player.js';
import { AudioChain } from '$lib/audio/chain.js';
import type { Playable } from '$lib/audio/playable.js';
import { createCompensatedPlayable } from '$lib/audio/compensated-chain.js';
import {
	createGain,
	createPassFilter,
	type GainHandle,
	type PassFilterHandle
} from '$lib/audio/effects.js';
import { passResponseDb, type PassSlope, type PassType } from '$lib/audio/eq-math.js';
import { compensationFromResponse } from '$lib/audio/spectrum.js';

export interface FilterFinderAudio {
	playable: Playable;
	setFilter(type: PassType, cutoff: number, slope: PassSlope): void;
}

export function createFilterFinderAudio(): FilterFinderAudio {
	const player = new AudioPlayer();
	let pass: PassFilterHandle | null = null;
	let compensation: GainHandle | null = null;

	const chain = new AudioChain(player, [
		(ctx) => {
			pass = createPassFilter(ctx);
			pass.set('highpass', 80, 24);
			return pass;
		},
		(ctx) => (compensation = createGain(ctx, 0))
	]);
	const { playable, spectrum } = createCompensatedPlayable(chain, player, {
		onDestroy: () => {
			pass = null;
			compensation = null;
		}
	});

	return {
		playable,
		setFilter(type, cutoff, slope) {
			pass?.set(type, cutoff, slope);
			compensation?.setGain(
				compensationFromResponse(spectrum(), (f) => passResponseDb(f, type, cutoff, slope))
			);
		}
	};
}
