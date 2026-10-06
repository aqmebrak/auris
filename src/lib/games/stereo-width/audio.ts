/**
 * Stereo Width audio — M/S width control followed by a loudness-compensation
 * gain. A = original, B = width-adjusted. Scaling the side signal by `w`
 * changes power by (1 + w²·r) / (1 + r) with r = side/mid power ratio, which is
 * cancelled so only the *width* differs.
 */

import { AudioPlayer } from '$lib/audio/player.js';
import { AudioChain } from '$lib/audio/chain.js';
import type { Playable } from '$lib/audio/playable.js';
import {
	createGain,
	createStereoWidth,
	type GainHandle,
	type StereoWidthHandle
} from '$lib/audio/effects.js';

export interface StereoWidthAudio {
	playable: Playable;
	/** `sideDb` = the sample's side/mid energy ratio (from the library). */
	setWidth(width: number, sideDb: number): void;
}

/** dB to apply so a side scaled by `width` keeps the overall level. */
export function widthCompensationDb(width: number, sideDb: number): number {
	const r = Math.pow(10, sideDb / 10);
	return -10 * Math.log10((1 + width * width * r) / (1 + r));
}

export function createStereoWidthAudio(): StereoWidthAudio {
	const player = new AudioPlayer();
	let stage: StereoWidthHandle | null = null;
	let compensation: GainHandle | null = null;

	const chain = new AudioChain(player, [
		(ctx) => (stage = createStereoWidth(ctx)),
		(ctx) => (compensation = createGain(ctx, 0))
	]);

	const playable: Playable = {
		load: (url) => chain.load(url),
		preload: (url) => chain.preload(url),
		play: (mode) => chain.play(mode),
		stop: () => chain.stop(),
		pause: () => chain.pause(),
		resume: () => chain.resume(),
		setMode: (mode) => chain.setMode(mode),
		destroy() {
			chain.destroy();
			stage = null;
			compensation = null;
		}
	};

	return {
		playable,
		setWidth(width, sideDb) {
			stage?.setWidth(width);
			compensation?.setGain(widthCompensationDb(width, sideDb));
		}
	};
}
