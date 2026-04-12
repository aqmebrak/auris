/**
 * Effect node factories. Each factory takes an `AudioContext` and returns an
 * `EffectHandle` with `input`/`output` that an `AudioChain` can wire in series.
 *
 * Handles may expose additional methods (e.g. `setFilter`) for type-safe param
 * tweaking — the chain does not care about those extras.
 */

export interface EffectHandle {
	input: AudioNode;
	output: AudioNode;
}

export interface PeakingEqHandle extends EffectHandle {
	setFilter(freq: number, gainDb: number, q: number): void;
}

export function createPeakingEq(
	ctx: AudioContext,
	initial: { freq: number; gainDb: number; q: number }
): PeakingEqHandle {
	const filter = ctx.createBiquadFilter();
	filter.type = 'peaking';
	filter.frequency.value = initial.freq;
	filter.gain.value = initial.gainDb;
	filter.Q.value = initial.q;

	return {
		input: filter,
		output: filter,
		setFilter(freq, gainDb, q) {
			filter.frequency.value = freq;
			filter.gain.value = gainDb;
			filter.Q.value = q;
		}
	};
}

export interface CompressorHandle extends EffectHandle {
	node: DynamicsCompressorNode;
}

export function createCompressor(
	ctx: AudioContext,
	params: {
		threshold?: number;
		knee?: number;
		ratio?: number;
		attack?: number;
		release?: number;
	} = {}
): CompressorHandle {
	const comp = ctx.createDynamicsCompressor();
	if (params.threshold !== undefined) comp.threshold.value = params.threshold;
	if (params.knee !== undefined) comp.knee.value = params.knee;
	if (params.ratio !== undefined) comp.ratio.value = params.ratio;
	if (params.attack !== undefined) comp.attack.value = params.attack;
	if (params.release !== undefined) comp.release.value = params.release;
	return { input: comp, output: comp, node: comp };
}

export interface PannerHandle extends EffectHandle {
	setPan(pan: number): void;
}

export interface GainHandle extends EffectHandle {
	setGain(db: number): void;
}

export function createGain(ctx: AudioContext, initialDb = 0): GainHandle {
	const node = ctx.createGain();
	node.gain.value = Math.pow(10, initialDb / 20);
	return {
		input: node,
		output: node,
		setGain(db) {
			node.gain.value = Math.pow(10, db / 20);
		}
	};
}

export function createPanner(ctx: AudioContext, initialPan = 0): PannerHandle {
	const panner = ctx.createStereoPanner();
	panner.pan.value = initialPan;
	return {
		input: panner,
		output: panner,
		setPan(pan) {
			panner.pan.value = pan;
		}
	};
}
