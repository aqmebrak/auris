// AudioEngine — pink noise with parametric EQ
// SSR guard: all AudioContext usage gated on typeof window !== 'undefined'

export class AudioEngine {
	private ctx: AudioContext | null = null;
	private source: AudioBufferSourceNode | null = null;
	private filter: BiquadFilterNode | null = null;
	private stopTimeout: ReturnType<typeof setTimeout> | null = null;
	private _isPlaying = false;

	init(): void {
		if (typeof window === 'undefined') return;
		if (this.ctx) return;
		this.ctx = new AudioContext();
	}

	play(freq: number, gainDb: number): void {
		if (typeof window === 'undefined') return;
		this.stop();
		this.init();
		const ctx = this.ctx!;

		// Generate pink noise buffer (1 second, looping)
		const sampleRate = ctx.sampleRate;
		const frameCount = sampleRate; // 1 second
		const buffer = ctx.createBuffer(1, frameCount, sampleRate);
		const data = buffer.getChannelData(0);

		// Paul Kellet's pink noise algorithm
		let b0 = 0,
			b1 = 0,
			b2 = 0,
			b3 = 0,
			b4 = 0,
			b5 = 0,
			b6 = 0;
		for (let i = 0; i < frameCount; i++) {
			const white = Math.random() * 2 - 1;
			b0 = 0.99886 * b0 + white * 0.0555179;
			b1 = 0.99332 * b1 + white * 0.0750759;
			b2 = 0.969 * b2 + white * 0.153852;
			b3 = 0.8665 * b3 + white * 0.3104856;
			b4 = 0.55 * b4 + white * 0.5329522;
			b5 = -0.7616 * b5 - white * 0.016898;
			data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) / 7;
			b6 = white * 0.115926;
		}

		// Source node (looping pink noise)
		const source = ctx.createBufferSource();
		source.buffer = buffer;
		source.loop = true;

		// Peaking EQ filter
		const eqFilter = ctx.createBiquadFilter();
		eqFilter.type = 'peaking';
		eqFilter.frequency.value = freq;
		eqFilter.gain.value = gainDb;
		eqFilter.Q.value = 2.5;

		source.connect(eqFilter);
		eqFilter.connect(ctx.destination);
		source.start();

		this.source = source;
		this.filter = eqFilter;
		this._isPlaying = true;

		// Auto-stop after 3 seconds
		this.stopTimeout = setTimeout(() => {
			this.stop();
		}, 3000);
	}

	stop(): void {
		if (this.stopTimeout !== null) {
			clearTimeout(this.stopTimeout);
			this.stopTimeout = null;
		}
		if (this.source) {
			try {
				this.source.stop();
				this.source.disconnect();
			} catch {
				// ignore if already stopped
			}
			this.source = null;
		}
		if (this.filter) {
			try {
				this.filter.disconnect();
			} catch {
				// ignore
			}
			this.filter = null;
		}
		this._isPlaying = false;
	}

	get isPlaying(): boolean {
		return this._isPlaying;
	}
}

export const audioEngine = new AudioEngine();
