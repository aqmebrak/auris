import { dbToLinear } from './utils.js';
import type { CompressionParams } from '$lib/exercises/types.js';

export interface EffectChain {
	/** The node that receives audio from the source. */
	input: AudioNode;
	/** The node that should connect to masterGain. */
	output: AudioNode;
}

export function createGainEffect(ctx: AudioContext, gainDb: number): EffectChain {
	const gain = ctx.createGain();
	gain.gain.value = dbToLinear(gainDb);
	return { input: gain, output: gain };
}

export function createEQEffect(
	ctx: AudioContext,
	frequencyHz: number,
	gainDb: number,
	Q: number
): EffectChain {
	const filter = ctx.createBiquadFilter();
	filter.type = 'peaking';
	filter.frequency.value = frequencyHz;
	filter.gain.value = gainDb;
	filter.Q.value = Q;
	return { input: filter, output: filter };
}

export function createPanEffect(ctx: AudioContext, pan: number): EffectChain {
	const panner = ctx.createStereoPanner();
	panner.pan.value = pan;
	return { input: panner, output: panner };
}

export function createCompressorEffect(ctx: AudioContext, params: CompressionParams): EffectChain {
	const compressor = ctx.createDynamicsCompressor();
	compressor.threshold.value = params.threshold;
	compressor.ratio.value = params.ratio;
	compressor.knee.value = params.knee;
	compressor.attack.value = params.attack;
	compressor.release.value = params.release;

	const makeupGain = ctx.createGain();
	makeupGain.gain.value = 1;
	compressor.connect(makeupGain);

	// Apply makeup gain after 100ms once compressor.reduction has settled
	setTimeout(() => {
		const reduction = compressor.reduction;
		makeupGain.gain.value = dbToLinear(-reduction);
	}, 100);

	return { input: compressor, output: makeupGain };
}
