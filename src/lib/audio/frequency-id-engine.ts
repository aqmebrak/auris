/**
 * FrequencyIdEngine — Web Audio API engine for the Frequency ID exercise.
 * SSR-safe: all AudioContext usage is guarded with typeof window !== 'undefined'.
 *
 * Graph topology:
 *   A mode: source → destination           (filter bypassed)
 *   B mode: source → filter → destination  (BiquadFilterNode type "peaking")
 */

export const SAMPLES = [
	'/audio/568755__badoink__rockin_140.wav',
	'/audio/614732__bainmack__metal_song_short15.wav',
	'/audio/566057__badoink__industrial-metal-fusion-120.wav',
	'/audio/400993__theflakesmaster__drumbeat-120-bpm.wav',
	'/audio/535231__badoink__sex-in-the-suburbs.wav',
	'/audio/569299__badoink__rock-seq-170.wav',
	'/audio/528906__johntrap__people-that-need-housing-loop-t130.wav'
] as const;

export function pickTrack(): string {
	return SAMPLES[Math.floor(Math.random() * SAMPLES.length)];
}

export class FrequencyIdEngine {
	private ctx: AudioContext | null = null;
	private bufferCache = new Map<string, AudioBuffer>();
	private currentBuffer: AudioBuffer | null = null;
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

	/** Loads a sample URL, caches the decoded buffer, and sets it as the current buffer. */
	async load(url: string): Promise<void> {
		if (typeof window === 'undefined') return;
		const ctx = this.getContext();

		const cached = this.bufferCache.get(url);
		if (cached) {
			this.currentBuffer = cached;
			return;
		}

		const response = await fetch(url);
		const arrayBuffer = await response.arrayBuffer();
		const decoded = await ctx.decodeAudioData(arrayBuffer);
		this.bufferCache.set(url, decoded);
		this.currentBuffer = decoded;
	}

	/** Starts a new source node. */
	play(mode: 'A' | 'B'): void {
		if (typeof window === 'undefined') return;
		if (!this.currentBuffer) return;

		this.stop();

		const ctx = this.getContext();
		if (ctx.state === 'suspended') {
			ctx.resume();
		}

		const source = ctx.createBufferSource();
		source.buffer = this.currentBuffer;
		source.loop = true;

		this.currentMode = mode;
		this.sourceNode = source;

		this._connect(source, mode);
		source.start();
	}

	/** Pauses playback without tearing down the source node (context suspended). */
	pause(): void {
		if (!this.ctx) return;
		if (this.ctx.state === 'running') {
			this.ctx.suspend();
		}
	}

	/** Resumes a paused context. */
	resume(): void {
		if (!this.ctx) return;
		if (this.ctx.state === 'suspended') {
			this.ctx.resume();
		}
	}

	get isPlaying(): boolean {
		return this.sourceNode !== null && this.ctx?.state === 'running';
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
		if (!this.filter) {
			// Ensure filter exists even if called before play
			this.getContext();
		}
		if (!this.filter) return;
		this.filter.frequency.value = freq;
		this.filter.gain.value = gainDb;
		this.filter.Q.value = q;
	}

	/** Switches routing (dry vs filtered) without restarting audio */
	setMode(mode: 'A' | 'B'): void {
		if (typeof window === 'undefined') return;
		if (this.currentMode === mode) return;
		this.currentMode = mode;

		if (!this.sourceNode) return;
		this.getContext();

		this.sourceNode.disconnect();
		if (this.filter) this.filter.disconnect();

		this._connect(this.sourceNode, mode);
	}

	private _connect(source: AudioBufferSourceNode, mode: 'A' | 'B'): void {
		const ctx = this.getContext();
		if (mode === 'A' || !this.filter) {
			source.connect(ctx.destination);
		} else {
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
		this.bufferCache.clear();
		this.currentBuffer = null;
	}
}
