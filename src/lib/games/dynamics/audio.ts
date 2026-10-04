/**
 * Dynamics audio — two parallel compressor worklets on one AudioContext.
 * Path A and path B are each either bypassed (`null`) or compressed with a
 * `CompSpec`; the source switches between them. Threshold is set relative to
 * the loaded sample's RMS and makeup gain is computed automatically, so the
 * two paths are loudness-matched and differ only in dynamics.
 */

import { AudioPlayer } from '$lib/audio/player.js';
import type { Playable, AbMode } from '$lib/audio/playable.js';
import { createCompressorNode, type CompressorNode } from '$lib/audio/compressor-node.js';
import {
	BYPASS,
	autoMakeupDb,
	thresholdFromLevel,
	type CompressorParams
} from '$lib/audio/compressor-dsp.js';

/** What the player/target controls — everything else is derived per sample. */
export interface CompSpec {
	ratio: number;
	attackMs: number;
	releaseMs: number;
}

export type PathSpec = CompSpec | null;

const KNEE_DB = 6;
const ANALYSIS_SECONDS = 6;

export class DynamicsAudio implements Playable {
	private player = new AudioPlayer();
	private ctx: AudioContext | null = null;
	private source: AudioBufferSourceNode | null = null;
	private mode: AbMode = 'B';
	private nodes: Record<AbMode, CompressorNode | null> = { A: null, B: null };
	private specs: Record<AbMode, PathSpec> = { A: null, B: null };
	private analysis: Float32Array[] = [];
	private thresholdOffsetDb = -4;

	async load(url: string): Promise<void> {
		if (typeof window === 'undefined') return;
		await this.player.load(url);
		const ctx = (this.ctx ??= this.player.getContext());
		if (!this.nodes.A) {
			for (const m of ['A', 'B'] as const) {
				const n = await createCompressorNode(ctx);
				n.node.connect(ctx.destination);
				this.nodes[m] = n;
			}
		}
		const buffer = this.player.currentBuffer!;
		const frames = Math.min(buffer.length, Math.round(ANALYSIS_SECONDS * buffer.sampleRate));
		this.analysis = Array.from({ length: buffer.numberOfChannels }, (_, c) =>
			buffer.getChannelData(c).subarray(0, frames)
		);
		this.applyAll();
	}

	preload(url: string): Promise<void> {
		return this.player.preload(url);
	}

	/** Threshold = sample RMS + offset (negative = compress more of the signal). */
	setThresholdOffset(db: number): void {
		this.thresholdOffsetDb = db;
		this.applyAll();
	}

	setPath(mode: AbMode, spec: PathSpec): void {
		this.specs[mode] = spec;
		this.apply(mode);
	}

	private apply(mode: AbMode): void {
		const node = this.nodes[mode];
		const spec = this.specs[mode];
		if (!node) return;
		if (!spec || this.analysis.length === 0) {
			node.setParams(BYPASS);
			return;
		}
		const base: Omit<CompressorParams, 'makeupDb'> = {
			thresholdDb: thresholdFromLevel(this.analysis, this.thresholdOffsetDb),
			ratio: spec.ratio,
			attackMs: spec.attackMs,
			releaseMs: spec.releaseMs,
			kneeDb: KNEE_DB
		};
		const makeupDb = autoMakeupDb(this.analysis, this.player.getContext().sampleRate, base);
		node.setParams({ ...base, makeupDb });
	}

	private applyAll(): void {
		this.apply('A');
		this.apply('B');
	}

	play(): void {
		if (typeof window === 'undefined' || !this.ctx) return;
		const buffer = this.player.currentBuffer;
		if (!buffer) return;
		if (this.ctx.state === 'suspended') this.ctx.resume();

		this.stop();
		const src = this.ctx.createBufferSource();
		src.buffer = buffer;
		src.loop = true;
		src.connect(this.nodes[this.mode]!.node);
		src.start();
		this.source = src;
	}

	setMode(mode: AbMode): void {
		if (mode === this.mode) return;
		this.mode = mode;
		if (!this.source) return;
		this.source.disconnect();
		this.source.connect(this.nodes[mode]!.node);
	}

	/** Gain reduction (dB) of the path currently heard. */
	getReduction(): number {
		return this.nodes[this.mode]?.reduction ?? 0;
	}

	pause(): void {
		this.player.pause();
	}

	resume(): void {
		this.player.resume();
	}

	stop(): void {
		if (!this.source) return;
		try {
			this.source.stop();
		} catch {
			// already stopped
		}
		this.source.disconnect();
		this.source = null;
	}

	destroy(): void {
		this.stop();
		this.player.destroy();
		this.ctx = null;
		this.nodes = { A: null, B: null };
	}
}
