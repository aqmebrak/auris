/**
 * Effect node factories. Each factory takes an `AudioContext` and returns an
 * `EffectHandle` with `input`/`output` that an `AudioChain` can wire in series.
 *
 * Handles may expose additional methods (e.g. `setFilter`) for type-safe param
 * tweaking — the chain does not care about those extras.
 */

import { PASS_STAGE_Q, qToDb, type PassSlope, type PassType } from './eq-math.js';

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

/** Sums the signal to mono (channel average), so a following panner places a single source. */
export function createMonoSum(ctx: AudioContext): EffectHandle {
	const node = ctx.createGain();
	node.channelCount = 1;
	node.channelCountMode = 'explicit';
	node.channelInterpretation = 'speakers';
	return { input: node, output: node };
}

export interface PassFilterHandle extends EffectHandle {
	set(type: PassType, cutoff: number, slope: PassSlope): void;
}

/**
 * High- or low-pass at 12 or 24 dB/oct (Butterworth): one biquad, or two in
 * series with the second one transparent (zero-gain peaking) for 12 dB/oct.
 */
export function createPassFilter(ctx: AudioContext): PassFilterHandle {
	const s1 = ctx.createBiquadFilter();
	const s2 = ctx.createBiquadFilter();
	s1.connect(s2);
	return {
		input: s1,
		output: s2,
		set(type, cutoff, slope) {
			const [q1, q2] = PASS_STAGE_Q[slope];
			s1.type = type;
			s1.frequency.value = cutoff;
			s1.Q.value = qToDb(q1); // Web Audio takes lowpass/highpass Q in dB
			if (q2 !== undefined) {
				s2.type = type;
				s2.frequency.value = cutoff;
				s2.Q.value = qToDb(q2);
			} else {
				s2.type = 'peaking';
				s2.gain.value = 0;
			}
		}
	};
}

export interface StereoWidthHandle extends EffectHandle {
	/** 0 = mono, 1 = unchanged, 2 = side doubled. */
	setWidth(width: number): void;
}

/**
 * Mid/side width control: M = (L+R)/2, S = (L−R)/2, out = M ± width·S.
 * Mono input is up-mixed to dual-mono (no side), so width has no effect on it.
 */
export function createStereoWidth(ctx: AudioContext): StereoWidthHandle {
	const input = ctx.createGain();
	input.channelCount = 2;
	input.channelCountMode = 'explicit';
	const splitter = ctx.createChannelSplitter(2);
	const merger = ctx.createChannelMerger(2);
	const mid = ctx.createGain();
	const side = ctx.createGain();
	const sideScaled = ctx.createGain();
	const sideInverted = ctx.createGain();
	sideInverted.gain.value = -1;

	const tap = (channel: 0 | 1, to: AudioNode, gain: number) => {
		const g = ctx.createGain();
		g.gain.value = gain;
		splitter.connect(g, channel);
		g.connect(to);
	};
	input.connect(splitter);
	tap(0, mid, 0.5);
	tap(1, mid, 0.5);
	tap(0, side, 0.5);
	tap(1, side, -0.5);
	side.connect(sideScaled);
	mid.connect(merger, 0, 0);
	mid.connect(merger, 0, 1);
	sideScaled.connect(merger, 0, 0);
	sideScaled.connect(sideInverted);
	sideInverted.connect(merger, 0, 1);

	return {
		input,
		output: merger,
		setWidth(width) {
			sideScaled.gain.value = width;
		}
	};
}
