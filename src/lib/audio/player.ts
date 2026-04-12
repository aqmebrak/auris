/**
 * AudioPlayer — owns the AudioContext, decodes & caches buffers.
 * Game-agnostic: knows nothing about effect graphs or A/B routing.
 * SSR-safe: every method no-ops when `window` is undefined.
 */

export class AudioPlayer {
	private ctx: AudioContext | null = null;
	private bufferCache = new Map<string, AudioBuffer>();
	private _currentBuffer: AudioBuffer | null = null;

	/** Returns (creating if needed) the shared AudioContext. Throws in SSR. */
	getContext(): AudioContext {
		if (typeof window === 'undefined') {
			throw new Error('AudioContext not available in SSR');
		}
		if (!this.ctx) {
			this.ctx = new AudioContext();
		}
		return this.ctx;
	}

	get currentBuffer(): AudioBuffer | null {
		return this._currentBuffer;
	}

	/** Fetches, decodes, and caches the sample at `url`. */
	async load(url: string): Promise<void> {
		if (typeof window === 'undefined') return;
		const ctx = this.getContext();

		const cached = this.bufferCache.get(url);
		if (cached) {
			this._currentBuffer = cached;
			return;
		}

		const response = await fetch(url);
		const arrayBuffer = await response.arrayBuffer();
		const decoded = await ctx.decodeAudioData(arrayBuffer);
		this.bufferCache.set(url, decoded);
		this._currentBuffer = decoded;
	}

	/** Suspends the underlying context (pauses all sources). */
	pause(): void {
		if (this.ctx?.state === 'running') {
			this.ctx.suspend();
		}
	}

	/** Resumes a suspended context. */
	resume(): void {
		if (this.ctx?.state === 'suspended') {
			this.ctx.resume();
		}
	}

	get isContextRunning(): boolean {
		return this.ctx?.state === 'running';
	}

	destroy(): void {
		if (this.ctx) {
			this.ctx.close();
			this.ctx = null;
		}
		this.bufferCache.clear();
		this._currentBuffer = null;
	}
}
