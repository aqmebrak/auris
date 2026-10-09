/**
 * An `AudioChain` exposed as a `Playable` that also remembers the loaded
 * sample's average spectrum, so a game can cancel the loudness change its
 * effect causes (`compensationFromResponse`) and keep A/B level-matched.
 */

import type { AudioChain } from './chain.js';
import type { Playable } from './playable.js';
import type { AudioPlayer } from './player.js';
import { averageSpectrum, monoMix, type BandSpectrum } from './spectrum.js';

export function createCompensatedPlayable(
	chain: AudioChain,
	player: AudioPlayer,
	opts: {
		/** Play (and analyse) the channel average. */
		mono?: boolean;
		onDestroy?: () => void;
	} = {}
): { playable: Playable; spectrum: () => BandSpectrum | null } {
	let spectrum: BandSpectrum | null = null;

	const playable: Playable = {
		async load(url) {
			await chain.load(url, { mono: opts.mono });
			const buffer = player.currentBuffer;
			spectrum = buffer ? averageSpectrum(monoMix(buffer), buffer.sampleRate) : null;
		},
		preload: (url) => chain.preload(url),
		play: (mode) => chain.play(mode),
		stop: () => chain.stop(),
		pause: () => chain.pause(),
		resume: () => chain.resume(),
		setMode: (mode) => chain.setMode(mode),
		destroy() {
			chain.destroy();
			opts.onDestroy?.();
		}
	};

	return { playable, spectrum: () => spectrum };
}
