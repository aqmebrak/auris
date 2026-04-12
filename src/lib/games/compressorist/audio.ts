/**
 * Compressorist audio — dual parallel compression chains on one AudioContext.
 * A mode = user's compression (live-adjustable knobs).
 * B mode = target compression (hidden).
 * NOT using AudioChain — both paths are effected, not dry vs effected.
 */

import { AudioPlayer } from '$lib/audio/player.js';
import type { CompressionParams } from './config.js';

const FIXED_THRESHOLD = -24; // dBFS
const FIXED_KNEE = 6; // dB

function applyParams(comp: DynamicsCompressorNode, gain: GainNode, p: CompressionParams): void {
	comp.attack.value = p.attack / 1000;
	comp.release.value = p.release / 1000;
	comp.ratio.value = p.ratio;
	gain.gain.value = Math.pow(10, p.makeup / 20);
}

export class CompressoristAudio {
	private player: AudioPlayer;
	private ctx: AudioContext | null = null;
	private source: AudioBufferSourceNode | null = null;
	private mode: 'A' | 'B' = 'B';

	private userComp: DynamicsCompressorNode | null = null;
	private userGain: GainNode | null = null;
	private targetComp: DynamicsCompressorNode | null = null;
	private targetGain: GainNode | null = null;

	private _userParams: CompressionParams | null = null;
	private _targetParams: CompressionParams | null = null;

	constructor() {
		this.player = new AudioPlayer();
	}

	private ensureContext(): AudioContext {
		if (!this.ctx) {
			this.ctx = this.player.getContext();
			this.buildGraph();
		}
		return this.ctx;
	}

	private buildGraph(): void {
		const ctx = this.ctx!;

		this.userComp = ctx.createDynamicsCompressor();
		this.userComp.threshold.value = FIXED_THRESHOLD;
		this.userComp.knee.value = FIXED_KNEE;

		this.targetComp = ctx.createDynamicsCompressor();
		this.targetComp.threshold.value = FIXED_THRESHOLD;
		this.targetComp.knee.value = FIXED_KNEE;

		this.userGain = ctx.createGain();
		this.targetGain = ctx.createGain();

		this.userComp.connect(this.userGain);
		this.userGain.connect(ctx.destination);

		this.targetComp.connect(this.targetGain);
		this.targetGain.connect(ctx.destination);

		// Apply pending params if already set
		if (this._userParams) applyParams(this.userComp, this.userGain, this._userParams);
		if (this._targetParams) applyParams(this.targetComp, this.targetGain, this._targetParams);
	}

	async load(url: string): Promise<void> {
		if (typeof window === 'undefined') return;
		await this.player.load(url);
		this.ensureContext();
	}

	setUserParams(p: CompressionParams): void {
		this._userParams = p;
		if (this.userComp && this.userGain) {
			applyParams(this.userComp, this.userGain, p);
		}
	}

	setTargetParams(p: CompressionParams): void {
		this._targetParams = p;
		if (this.targetComp && this.targetGain) {
			applyParams(this.targetComp, this.targetGain, p);
		}
	}

	play(): void {
		if (typeof window === 'undefined') return;
		const ctx = this.ensureContext();
		const buffer = this.player.currentBuffer;
		if (!buffer) return;

		if (ctx.state === 'suspended') ctx.resume();

		this.stop();
		const src = ctx.createBufferSource();
		src.buffer = buffer;
		src.loop = true;
		src.connect(this.mode === 'A' ? this.userComp! : this.targetComp!);
		src.start();
		this.source = src;
	}

	setMode(mode: 'A' | 'B'): void {
		if (mode === this.mode) return;
		this.mode = mode;
		if (!this.source) return;
		// Reconnect source to new compressor path
		this.source.disconnect();
		this.source.connect(mode === 'A' ? this.userComp! : this.targetComp!);
	}

	pause(): void {
		this.player.pause();
	}

	resume(): void {
		this.player.resume();
	}

	stop(): void {
		if (this.source) {
			try {
				this.source.stop();
			} catch {
				// already stopped
			}
			this.source.disconnect();
			this.source = null;
		}
	}

	/** Returns current gain reduction in dB (0 = no compression, negative = reducing). */
	getReduction(): number {
		const comp = this.mode === 'A' ? this.userComp : this.targetComp;
		return comp?.reduction ?? 0;
	}

	destroy(): void {
		this.stop();
		this.player.destroy();
		this.ctx = null;
		this.userComp = null;
		this.userGain = null;
		this.targetComp = null;
		this.targetGain = null;
	}
}
