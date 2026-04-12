/**
 * Frequency ID audio — assembles an `AudioChain` with a single peaking EQ.
 * The returned `setFilter` shortcut routes to the underlying `PeakingEqHandle`.
 */

import { AudioPlayer } from '$lib/audio/player.js';
import { AudioChain } from '$lib/audio/chain.js';
import { createPeakingEq, type PeakingEqHandle } from '$lib/audio/effects.js';

export interface FreqIdAudio {
	chain: AudioChain;
	setFilter(freq: number, gainDb: number, q?: number): void;
	destroy(): void;
}

export function createFreqIdAudio(): FreqIdAudio {
	const player = new AudioPlayer();
	let peaking: PeakingEqHandle | null = null;

	const chain = new AudioChain(player, [
		(ctx) => {
			peaking = createPeakingEq(ctx, { freq: 1000, gainDb: 0, q: 2.5 });
			return peaking;
		}
	]);

	return {
		chain,
		setFilter(freq, gainDb, q = 2.5) {
			peaking?.setFilter(freq, gainDb, q);
		},
		destroy() {
			chain.destroy();
			peaking = null;
		}
	};
}
