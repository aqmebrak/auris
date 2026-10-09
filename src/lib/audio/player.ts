/**
 * AudioPlayer — owns the AudioContext, decodes & caches buffers.
 * Game-agnostic: knows nothing about effect graphs or A/B routing.
 * SSR-safe: every method no-ops when `window` is undefined.
 */

import { monoMix } from './spectrum.js';

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

	private pending = new Map<string, Promise<AudioBuffer>>();

	/** Fetches + decodes `url` once; concurrent callers share the same request. */
	private fetchBuffer(url: string): Promise<AudioBuffer> {
		const cached = this.bufferCache.get(url);
		if (cached) return Promise.resolve(cached);
		let request = this.pending.get(url);
		if (!request) {
			const ctx = this.getContext();
			request = fetch(url)
				.then((r) => r.arrayBuffer())
				.then((data) => ctx.decodeAudioData(data))
				.then((decoded) => {
					this.bufferCache.set(url, decoded);
					return decoded;
				})
				.finally(() => this.pending.delete(url));
			this.pending.set(url, request);
		}
		return request;
	}

	private monoCache = new Map<string, AudioBuffer>();

	/** Channel-average of a multichannel buffer, cached per url. */
	private toMono(url: string, buffer: AudioBuffer): AudioBuffer {
		if (buffer.numberOfChannels === 1) return buffer;
		let mono = this.monoCache.get(url);
		if (!mono) {
			mono = this.getContext().createBuffer(1, buffer.length, buffer.sampleRate);
			mono.copyToChannel(monoMix(buffer), 0);
			this.monoCache.set(url, mono);
		}
		return mono;
	}

	/**
	 * Fetches, decodes, and caches the sample at `url`, making it current.
	 * `mono` plays the channel average instead (e.g. so a stereo→mono fold-down
	 * doesn't differ between the A and B paths).
	 */
	async load(url: string, opts: { mono?: boolean } = {}): Promise<void> {
		if (typeof window === 'undefined') return;
		const buffer = await this.fetchBuffer(url);
		this._currentBuffer = opts.mono ? this.toMono(url, buffer) : buffer;
	}

	/** Warms the cache (e.g. next round's sample) without changing the current buffer. */
	async preload(url: string): Promise<void> {
		if (typeof window === 'undefined') return;
		await this.fetchBuffer(url);
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
		this.pending.clear();
		this.monoCache.clear();
		this._currentBuffer = null;
	}
}
