/**
 * Panning ID audio — assembles an `AudioChain` with a single stereo panner.
 * A mode = center (dry). B mode = panned signal.
 */

import { AudioPlayer } from '$lib/audio/player.js';
import { AudioChain } from '$lib/audio/chain.js';
import { createPanner, type PannerHandle } from '$lib/audio/effects.js';

export interface PanningAudio {
	chain: AudioChain;
	setPan(pan: number): void;
	destroy(): void;
}

export function createPanningAudio(): PanningAudio {
	const player = new AudioPlayer();
	let panner: PannerHandle | null = null;

	const chain = new AudioChain(player, [
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
