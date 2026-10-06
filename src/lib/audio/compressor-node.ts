/**
 * Main-thread handle for the compressor AudioWorklet.
 * `createCompressorNode(ctx)` loads the module once per context.
 */

import workletUrl from './worklets/compressor.worklet.ts?worker&url';
import { BYPASS, type CompressorParams } from './compressor-dsp.js';

const loaded = new WeakSet<BaseAudioContext>();

export interface CompressorNode {
	node: AudioWorkletNode;
	setParams(p: CompressorParams): void;
	/** Latest reported gain reduction in dB (0 = none, negative = reducing). */
	readonly reduction: number;
}

export async function createCompressorNode(ctx: AudioContext): Promise<CompressorNode> {
	if (!loaded.has(ctx)) {
		await ctx.audioWorklet.addModule(workletUrl);
		loaded.add(ctx);
	}
	const node = new AudioWorkletNode(ctx, 'auris-compressor', {
		numberOfInputs: 1,
		numberOfOutputs: 1,
		outputChannelCount: [2],
		// Always run stereo-linked, even for mono samples
		channelCount: 2,
		channelCountMode: 'explicit'
	});
	let reduction = 0;
	node.port.onmessage = (e: MessageEvent<number>) => (reduction = e.data);
	node.port.postMessage(BYPASS);
	return {
		node,
		setParams: (p) => node.port.postMessage(p),
		get reduction() {
			return reduction;
		}
	};
}
