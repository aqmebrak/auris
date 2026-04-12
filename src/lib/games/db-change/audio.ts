/**
 * dB Change audio — AudioChain with a GainNode.
 * A mode = dry (bypass). B mode = gain applied.
 */

import { AudioPlayer } from '$lib/audio/player.js';
import { AudioChain } from '$lib/audio/chain.js';
import { createGain, type GainHandle } from '$lib/audio/effects.js';

export interface DbChangeAudio {
	chain: AudioChain;
	setGain(db: number): void;
	destroy(): void;
}

export function createDbChangeAudio(): DbChangeAudio {
	const player = new AudioPlayer();
	let gain: GainHandle | null = null;

	const chain = new AudioChain(player, [
		(ctx) => {
			gain = createGain(ctx, 0);
			return gain;
		}
	]);

	return {
		chain,
		setGain(db) {
			gain?.setGain(db);
		},
		destroy() {
			chain.destroy();
			gain = null;
		}
	};
}
