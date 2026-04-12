/**
 * AudioChain — wraps an `AudioPlayer` + an ordered list of effects and adds
 * A/B routing (dry source vs source-through-effects).
 *
 *   A mode: source → ctx.destination
 *   B mode: source → effects[0].input → … → effects[n].output → ctx.destination
 *
 * Effects are built lazily on `load()` (the first point where a real
 * AudioContext exists in the browser). Game-specific helpers (e.g. freq-id)
 * keep a typed reference to the handles they care about so they can tweak
 * parameters without the chain knowing anything about their shape.
 */

import type { AudioPlayer } from './player.js';
import type { EffectHandle } from './effects.js';

export type EffectFactory = (ctx: AudioContext) => EffectHandle;

export class AudioChain {
	private player: AudioPlayer;
	private factories: EffectFactory[];
	private effects: EffectHandle[] = [];
	private built = false;
	private mode: 'A' | 'B' = 'B';
	private sourceNode: AudioBufferSourceNode | null = null;

	constructor(player: AudioPlayer, factories: EffectFactory[]) {
		this.player = player;
		this.factories = factories;
	}

	/** Loads the sample and eagerly builds the effect graph. */
	async load(url: string): Promise<void> {
		await this.player.load(url);
		this.build();
	}

	/** Builds effects once. No-op on subsequent calls / in SSR. */
	private build(): void {
		if (this.built) return;
		if (typeof window === 'undefined') return;
		const ctx = this.player.getContext();
		this.effects = this.factories.map((factory) => factory(ctx));

		// Chain effects in series and terminate at the destination.
		for (let i = 0; i < this.effects.length - 1; i++) {
			this.effects[i].output.connect(this.effects[i + 1].input);
		}
		if (this.effects.length > 0) {
			this.effects[this.effects.length - 1].output.connect(ctx.destination);
		}
		this.built = true;
	}

	private destinationFor(mode: 'A' | 'B'): AudioNode {
		const ctx = this.player.getContext();
		if (mode === 'A' || this.effects.length === 0) return ctx.destination;
		return this.effects[0].input;
	}

	play(mode: 'A' | 'B' = 'B'): void {
		if (typeof window === 'undefined') return;
		const buffer = this.player.currentBuffer;
		if (!buffer) return;

		const ctx = this.player.getContext();
		this.build();
		if (ctx.state === 'suspended') ctx.resume();

		this.stop();
		const source = ctx.createBufferSource();
		source.buffer = buffer;
		source.loop = true;
		this.mode = mode;
		source.connect(this.destinationFor(mode));
		source.start();
		this.sourceNode = source;
	}

	pause(): void {
		this.player.pause();
	}

	resume(): void {
		this.player.resume();
	}

	/** Switches between dry and effects-path without tearing down the source. */
	setMode(mode: 'A' | 'B'): void {
		if (typeof window === 'undefined') return;
		if (mode === this.mode) return;
		this.mode = mode;
		if (!this.sourceNode) return;
		this.sourceNode.disconnect();
		this.sourceNode.connect(this.destinationFor(mode));
	}

	stop(): void {
		if (this.sourceNode) {
			try {
				this.sourceNode.stop();
			} catch {
				// already stopped — safe to ignore
			}
			this.sourceNode.disconnect();
			this.sourceNode = null;
		}
	}

	get isPlaying(): boolean {
		return this.sourceNode !== null && this.player.isContextRunning;
	}

	destroy(): void {
		this.stop();
		this.effects = [];
		this.built = false;
		this.player.destroy();
	}
}
