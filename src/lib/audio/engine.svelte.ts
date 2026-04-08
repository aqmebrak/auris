import { SvelteMap } from 'svelte/reactivity';
import { clamp } from './utils.js';
import type { EffectChain } from './effects.js';

let isPlaying = $state(false);
let currentMode = $state<'A' | 'B'>('A');
let isLoaded = $state(false);

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let currentSource: AudioBufferSourceNode | null = null;
const bufferCache = new SvelteMap<string, AudioBuffer>();
let userVolume = 1;

function getOrCreateContext(): AudioContext {
	if (!ctx) {
		ctx = new AudioContext();
		masterGain = ctx.createGain();
		masterGain.gain.value = userVolume;
		masterGain.connect(ctx.destination);
	}
	return ctx;
}

function stopCurrentSource(): void {
	if (currentSource) {
		try {
			currentSource.stop();
		} catch {
			// Already stopped
		}
		currentSource = null;
	}
}

export async function loadSamples(sampleIds: string[]): Promise<void> {
	const context = getOrCreateContext();
	await Promise.all(
		sampleIds.map(async (id) => {
			if (!bufferCache.has(id)) {
				const response = await fetch(`/samples/${id}`);
				const arrayBuffer = await response.arrayBuffer();
				const audioBuffer = await context.decodeAudioData(arrayBuffer);
				bufferCache.set(id, audioBuffer);
			}
		})
	);
	isLoaded = true;
}

export function play(sampleId: string): void {
	const context = getOrCreateContext();
	context.resume();
	stopCurrentSource();

	const buffer = bufferCache.get(sampleId);
	if (!buffer) return;

	const source = context.createBufferSource();
	source.buffer = buffer;
	source.loop = true;
	source.connect(masterGain!);
	source.start(0);

	currentSource = source;
	isPlaying = true;
	currentMode = 'A';
}

export function playWithEffect(
	sampleId: string,
	buildEffect: (ctx: AudioContext) => EffectChain
): void {
	const context = getOrCreateContext();
	context.resume();
	stopCurrentSource();

	const buffer = bufferCache.get(sampleId);
	if (!buffer) return;

	const chain = buildEffect(context);
	const source = context.createBufferSource();
	source.buffer = buffer;
	source.loop = true;
	source.connect(chain.input);
	chain.output.connect(masterGain!);
	source.start(0);

	currentSource = source;
	isPlaying = true;
	currentMode = 'B';
}

export function stop(): void {
	if (!masterGain || !ctx) return;

	const now = ctx.currentTime;
	masterGain.gain.cancelScheduledValues(now);
	masterGain.gain.setValueAtTime(masterGain.gain.value, now);
	masterGain.gain.linearRampToValueAtTime(0, now + 0.005);

	setTimeout(() => {
		stopCurrentSource();
		if (masterGain && ctx) {
			masterGain.gain.setValueAtTime(userVolume, ctx.currentTime);
		}
		isPlaying = false;
	}, 6);
}

export function toggleAB(
	sampleId: string,
	buildEffect: (ctx: AudioContext) => EffectChain
): void {
	if (currentMode === 'A') {
		playWithEffect(sampleId, buildEffect);
	} else {
		play(sampleId);
	}
}

export function setVolume(value: number): void {
	userVolume = clamp(value, 0, 1);
	if (masterGain) {
		masterGain.gain.value = userVolume;
	}
}

export const audioEngine = {
	get isPlaying() {
		return isPlaying;
	},
	get currentMode() {
		return currentMode;
	},
	get isLoaded() {
		return isLoaded;
	},
	loadSamples,
	play,
	playWithEffect,
	stop,
	toggleAB,
	setVolume
};
