#!/usr/bin/env node
/**
 * Generates placeholder audio samples for Auris.
 * Produces valid WAV data saved with .mp3 extension.
 * decodeAudioData reads magic bytes, not extension, so browsers handle these correctly.
 *
 * Replace with real CC0 recordings from freesound.org when available.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SAMPLE_RATE = 44100;
const NUM_CHANNELS = 2;
const BIT_DEPTH = 16;

function writeWav(filename, samples) {
	const dataSize = samples.length * NUM_CHANNELS * (BIT_DEPTH / 8);
	const buf = Buffer.alloc(44 + dataSize);

	buf.write('RIFF', 0);
	buf.writeUInt32LE(36 + dataSize, 4);
	buf.write('WAVE', 8);
	buf.write('fmt ', 12);
	buf.writeUInt32LE(16, 16);
	buf.writeUInt16LE(1, 20); // PCM
	buf.writeUInt16LE(NUM_CHANNELS, 22);
	buf.writeUInt32LE(SAMPLE_RATE, 24);
	buf.writeUInt32LE(SAMPLE_RATE * NUM_CHANNELS * (BIT_DEPTH / 8), 28);
	buf.writeUInt16LE(NUM_CHANNELS * (BIT_DEPTH / 8), 32);
	buf.writeUInt16LE(BIT_DEPTH, 34);
	buf.write('data', 36);
	buf.writeUInt32LE(dataSize, 40);

	let offset = 44;
	for (let i = 0; i < samples.length; i++) {
		const val = Math.round(Math.max(-1, Math.min(1, samples[i])) * 32767);
		buf.writeInt16LE(val, offset); // left
		buf.writeInt16LE(val, offset + 2); // right
		offset += 4;
	}

	fs.writeFileSync(filename, buf);
	console.log(`  ${path.basename(filename)} — ${(buf.length / 1024).toFixed(0)} KB`);
}

// Pink noise — Voss-McCartney algorithm
function generatePinkNoise(durationSecs) {
	const n = Math.floor(SAMPLE_RATE * durationSecs);
	const s = new Float32Array(n);
	let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
	for (let i = 0; i < n; i++) {
		const w = Math.random() * 2 - 1;
		b0 = 0.99886 * b0 + w * 0.0555179;
		b1 = 0.99332 * b1 + w * 0.0750759;
		b2 = 0.96900 * b2 + w * 0.1538520;
		b3 = 0.86650 * b3 + w * 0.3104856;
		b4 = 0.55000 * b4 + w * 0.5329522;
		b5 = -0.7616 * b5 - w * 0.0168980;
		s[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) / 9;
		b6 = w * 0.115926;
	}
	return s;
}

// Drum loop — kick + snare at 120 BPM
function generateDrumLoop(durationSecs) {
	const n = Math.floor(SAMPLE_RATE * durationSecs);
	const s = new Float32Array(n);
	const beatSamples = Math.floor(SAMPLE_RATE * 0.5); // 120 BPM → 0.5s/beat

	for (let i = 0; i < n; i++) {
		const beat = i % beatSamples;
		const t = beat / SAMPLE_RATE;
		// Kick: pitch-drops from 160Hz → 60Hz with fast decay
		const kickEnv = Math.exp(-t * 20);
		const kickFreq = 160 * Math.exp(-t * 60) + 60;
		s[i] = kickEnv * 0.7 * Math.sin(2 * Math.PI * kickFreq * t);
		// Snare on beat 2 of each pair (at half-beat position)
		const snareStart = Math.floor(beatSamples / 2);
		const snareLen = Math.floor(beatSamples * 0.12);
		if (beat >= snareStart && beat < snareStart + snareLen) {
			const st = (beat - snareStart) / SAMPLE_RATE;
			s[i] += Math.exp(-st * 40) * 0.4 * (Math.random() * 2 - 1);
		}
	}
	return s;
}

// Guitar loop — harmonic stack on A2 (110 Hz), pluck envelope
function generateGuitarLoop(durationSecs) {
	const n = Math.floor(SAMPLE_RATE * durationSecs);
	const s = new Float32Array(n);
	const pluckPeriod = SAMPLE_RATE; // re-pluck every second

	for (let i = 0; i < n; i++) {
		const t = i / SAMPLE_RATE;
		const pos = i % pluckPeriod;
		const env = Math.exp(-(pos / SAMPLE_RATE) * 4);
		s[i] =
			env *
			(0.40 * Math.sin(2 * Math.PI * 110 * t) +
				0.25 * Math.sin(2 * Math.PI * 220 * t) +
				0.15 * Math.sin(2 * Math.PI * 330 * t) +
				0.08 * Math.sin(2 * Math.PI * 440 * t) +
				0.04 * Math.sin(2 * Math.PI * 550 * t));
	}
	return s;
}

// Voice-like — buzz + formants with slow prosody modulation
function generateVoice(fundamental, durationSecs) {
	const n = Math.floor(SAMPLE_RATE * durationSecs);
	const s = new Float32Array(n);
	const f1 = fundamental * 6;
	const f2 = fundamental * 10;
	const f3 = fundamental * 14;

	for (let i = 0; i < n; i++) {
		const t = i / SAMPLE_RATE;
		const prosody = 0.7 + 0.3 * Math.sin(2 * Math.PI * 0.3 * t);
		s[i] =
			prosody *
			(0.30 * Math.sin(2 * Math.PI * fundamental * t) +
				0.10 * Math.sin(2 * Math.PI * f1 * t + 0.3) +
				0.07 * Math.sin(2 * Math.PI * f2 * t + 0.6) +
				0.05 * Math.sin(2 * Math.PI * f3 * t + 0.9));
	}
	return s;
}

const outDir = path.join(__dirname, '..', 'static', 'samples');
fs.mkdirSync(outDir, { recursive: true });

console.log('Generating placeholder audio samples...');
writeWav(path.join(outDir, 'pink-noise.mp3'), generatePinkNoise(10));
writeWav(path.join(outDir, 'drums-loop.mp3'), generateDrumLoop(8));
writeWav(path.join(outDir, 'guitar-loop.mp3'), generateGuitarLoop(8));
writeWav(path.join(outDir, 'speech-male.mp3'), generateVoice(120, 10));
writeWav(path.join(outDir, 'speech-female.mp3'), generateVoice(220, 10));

console.log('\nDone. Files are WAV data with .mp3 extension.');
console.log('decodeAudioData reads RIFF magic bytes, not extension.');
console.log('Replace with real CC0 recordings from freesound.org when ready.');
