/**
 * Panning ID audio — `AudioChain` of mono-sum → stereo panner. Summing to mono
 * first makes the panner place one source (a stereo mix through a panner is
 * just a balance control). B mode = panned signal; the game only plays B.
 */

import { AudioPlayer } from '$lib/audio/player.js';
import { AudioChain } from '$lib/audio/chain.js';
import { createMonoSum, createPanner, type PannerHandle } from '$lib/audio/effects.js';

export interface PanningAudio {
	chain: AudioChain;
	setPan(pan: number): void;
	destroy(): void;
}

export function createPanningAudio(): PanningAudio {
	const player = new AudioPlayer();
	let panner: PannerHandle | null = null;

	const chain = new AudioChain(player, [
		(ctx) => createMonoSum(ctx),
		(ctx) => {
			panner = createPanner(ctx, 0);
			return panner;
		}
	]);

	return {
		chain,
		setPan(pan) {
			panner?.setPan(pan);
		},
		destroy() {
			chain.destroy();
			panner = null;
		}
	};
}
