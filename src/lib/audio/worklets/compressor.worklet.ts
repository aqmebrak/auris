/**
 * AudioWorklet wrapper around `CompressorDsp`. Bundled by Vite via
 * `?worker&url` (see `compressor-node.ts`). Runs in AudioWorkletGlobalScope.
 */

import { BYPASS, CompressorDsp, type CompressorParams } from '../compressor-dsp.js';

declare const sampleRate: number;
declare class AudioWorkletProcessor {
	readonly port: MessagePort;
	constructor();
}
declare function registerProcessor(name: string, ctor: new () => AudioWorkletProcessor): void;

const REPORT_EVERY = 8; // blocks of 128 frames → ~21 ms

class CompressorProcessor extends AudioWorkletProcessor {
	private dsp = new CompressorDsp(sampleRate, BYPASS);
	private blocks = 0;

	constructor() {
		super();
		this.port.onmessage = (e: MessageEvent<CompressorParams>) => this.dsp.setParams(e.data);
	}

	process(inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
		const input = inputs[0];
		const output = outputs[0];
		if (input && input.length > 0) {
			this.dsp.process(input, output);
			if (++this.blocks % REPORT_EVERY === 0) this.port.postMessage(this.dsp.reduction);
		}
		return true;
	}
}

registerProcessor('auris-compressor', CompressorProcessor);
