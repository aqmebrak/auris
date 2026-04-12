/**
 * EQ Guess audio — AudioChain with MAX_BANDS peaking EQ filters in series.
 * A = dry (bypass), B = EQ'd signal.
 * Unused filter slots are set to 0 dB gain (transparent).
 */

import { AudioPlayer } from '$lib/audio/player.js';
import { AudioChain } from '$lib/audio/chain.js';
import { createPeakingEq, type PeakingEqHandle } from '$lib/audio/effects.js';
import type { EqBand } from './config.js';
import { Q_DEFAULT } from './config.js';

const MAX_BANDS = 4;

export interface EqGuessAudio {
	chain: AudioChain;
	setFilters(bands: EqBand[]): void;
	destroy(): void;
}

export function createEqGuessAudio(): EqGuessAudio {
	const player = new AudioPlayer();
	const handles: PeakingEqHandle[] = [];

	const factories = Array.from({ length: MAX_BANDS }, () => (ctx: AudioContext) => {
		const h = createPeakingEq(ctx, { freq: 1000, gainDb: 0, q: Q_DEFAULT });
		handles.push(h);
		return h;
	});

	const chain = new AudioChain(player, factories);

	return {
		chain,
		setFilters(bands: EqBand[]) {
			for (let i = 0; i < MAX_BANDS; i++) {
				const b = bands[i];
				handles[i]?.setFilter(b?.freq ?? 1000, b?.gainDb ?? 0, b?.q ?? Q_DEFAULT);
			}
		},
		destroy() {
			chain.destroy();
			handles.length = 0;
		}
	};
}
