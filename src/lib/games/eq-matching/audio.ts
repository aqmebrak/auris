/**
 * EQ Matching audio — dual parallel peaking-EQ chains on one AudioContext.
 * A mode = user's EQ (live-adjustable knobs).
 * B mode = target EQ (hidden).
 * Both paths are effected — mirrors CompressoristAudio pattern.
 */

import { AudioPlayer } from '$lib/audio/player.js';
import type { EqBand } from './config.js';
import { MAX_BANDS } from './config.js';

function applyBand(filter: BiquadFilterNode, band: EqBand): void {
	filter.frequency.value = band.freq;
	filter.gain.value = band.gainDb;
	filter.Q.value = band.q;
}

export class EqMatchingAudio {
	private player: AudioPlayer;
	private ctx: AudioContext | null = null;
	private source: AudioBufferSourceNode | null = null;
	private mode: 'A' | 'B' = 'B';

	private userFilters: BiquadFilterNode[] = [];
	private targetFilters: BiquadFilterNode[] = [];

	private _userBands: EqBand[] | null = null;
	private _targetBands: EqBand[] | null = null;

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

		for (let i = 0; i < MAX_BANDS; i++) {
			const uf = ctx.createBiquadFilter();
			uf.type = 'peaking';
			uf.frequency.value = 1000;
			uf.gain.value = 0;
			uf.Q.value = 1.5;
			this.userFilters.push(uf);

			const tf = ctx.createBiquadFilter();
			tf.type = 'peaking';
			tf.frequency.value = 1000;
			tf.gain.value = 0;
			tf.Q.value = 1.5;
			this.targetFilters.push(tf);
		}

		// Wire user path in series → destination
		for (let i = 0; i < MAX_BANDS - 1; i++) {
			this.userFilters[i].connect(this.userFilters[i + 1]);
		}
		this.userFilters[MAX_BANDS - 1].connect(ctx.destination);

		// Wire target path in series → destination
		for (let i = 0; i < MAX_BANDS - 1; i++) {
			this.targetFilters[i].connect(this.targetFilters[i + 1]);
		}
		this.targetFilters[MAX_BANDS - 1].connect(ctx.destination);

		// Apply pending bands if already set
		if (this._userBands) this._applyUserBands(this._userBands);
		if (this._targetBands) this._applyTargetBands(this._targetBands);
	}

	private _applyUserBands(bands: EqBand[]): void {
		for (let i = 0; i < MAX_BANDS; i++) {
			const f = this.userFilters[i];
			if (!f) continue;
			if (bands[i]) {
				applyBand(f, bands[i]);
			} else {
				f.gain.value = 0; // transparent
			}
		}
	}

	private _applyTargetBands(bands: EqBand[]): void {
		for (let i = 0; i < MAX_BANDS; i++) {
			const f = this.targetFilters[i];
			if (!f) continue;
			if (bands[i]) {
				applyBand(f, bands[i]);
			} else {
				f.gain.value = 0;
			}
		}
	}

	async load(url: string): Promise<void> {
		if (typeof window === 'undefined') return;
		await this.player.load(url);
		this.ensureContext();
	}

	setUserBands(bands: EqBand[]): void {
		this._userBands = bands;
		if (this.userFilters.length) this._applyUserBands(bands);
	}

	setTargetBands(bands: EqBand[]): void {
		this._targetBands = bands;
		if (this.targetFilters.length) this._applyTargetBands(bands);
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
		src.connect(this.mode === 'A' ? this.userFilters[0] : this.targetFilters[0]);
		src.start();
		this.source = src;
	}

	setMode(mode: 'A' | 'B'): void {
		if (mode === this.mode) return;
		this.mode = mode;
		if (!this.source) return;
		this.source.disconnect();
		this.source.connect(mode === 'A' ? this.userFilters[0] : this.targetFilters[0]);
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

	destroy(): void {
		this.stop();
		this.player.destroy();
		this.ctx = null;
		this.userFilters = [];
		this.targetFilters = [];
	}
}
