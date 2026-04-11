/**
 * FrequencyIdEngine — Web Audio API engine for the Frequency ID exercise.
 * SSR-safe: all AudioContext usage is guarded with typeof window !== 'undefined'.
 *
 * Graph topology:
 *   A mode: source → destination           (filter bypassed via disconnect/reconnect)
 *   B mode: source → filter → destination  (BiquadFilterNode type "peaking")
 */
export class FrequencyIdEngine {
	private ctx: AudioContext | null = null;
	private buffer: AudioBuffer | null = null;
	private filter: BiquadFilterNode | null = null;
	private sourceNode: AudioBufferSourceNode | null = null;
	private currentMode: 'A' | 'B' = 'B';

	private getContext(): AudioContext {
		if (typeof window === 'undefined') {
			throw new Error('AudioContext not available in SSR');
		}
		if (!this.ctx) {
			this.ctx = new AudioContext();
			this.filter = this.ctx.createBiquadFilter();
			this.filter.type = 'peaking';
		}
		return this.ctx;
	}

	async load(url: string): Promise<void> {
		if (typeof window === 'undefined') return;
		const ctx = this.getContext();
		const response = await fetch(url);
		const arrayBuffer = await response.arrayBuffer();
		this.buffer = await ctx.decodeAudioData(arrayBuffer);
	}

	/** FR-11: creates a new AudioBufferSourceNode on every play() call */
	play(mode: 'A' | 'B'): void {
		if (typeof window === 'undefined') return;
		if (!this.buffer) return;

		this.stop();

		const ctx = this.getContext();
		// Resume if suspended (browsers suspend AudioContext before user gesture)
		if (ctx.state === 'suspended') {
			ctx.resume();
		}

		const source = ctx.createBufferSource();
		source.buffer = this.buffer;
		source.loop = true;

		this.currentMode = mode;
		this.sourceNode = source;

		this._connect(source, mode);
		source.start();
	}

	stop(): void {
		if (this.sourceNode) {
			try {
				this.sourceNode.stop();
			} catch {
				// already stopped
			}
			this.sourceNode.disconnect();
			this.sourceNode = null;
		}
	}

	/** Updates BiquadFilter params in real-time */
	setFilter(freq: number, gainDb: number, q: number): void {
		if (!this.filter) return;
		this.filter.frequency.value = freq;
		this.filter.gain.value = gainDb;
		this.filter.Q.value = q;
	}

	/** FR-1: switches routing without restarting audio */
	setMode(mode: 'A' | 'B'): void {
		if (typeof window === 'undefined') return;
		if (this.currentMode === mode) return;
		this.currentMode = mode;

		if (!this.sourceNode) return;
		// Ensure context is initialized before reconnecting
		this.getContext();

		// Disconnect everything and reconnect in new topology
		this.sourceNode.disconnect();
		if (this.filter) this.filter.disconnect();

		this._connect(this.sourceNode, mode);
	}

	private _connect(source: AudioBufferSourceNode, mode: 'A' | 'B'): void {
		const ctx = this.getContext();
		if (mode === 'A' || !this.filter) {
			// A mode: source → destination (filter not in path)
			source.connect(ctx.destination);
		} else {
			// B mode: source → filter → destination
			source.connect(this.filter);
			this.filter.connect(ctx.destination);
		}
	}

	destroy(): void {
		this.stop();
		if (this.ctx) {
			this.ctx.close();
			this.ctx = null;
			this.filter = null;
		}
	}
}
