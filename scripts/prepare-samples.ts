/**
 * pnpm samples [--force] [--only <substring>] [--reanalyze]
 *
 * Turns raw files in `samples-src/` (gitignored) into app-ready assets:
 *   - loudness-normalised to −18 LUFS / −1 dBTP (two-pass, linear, so loops keep their dynamics)
 *   - trimmed to ≤30 s, 44.1 kHz, FLAC (lossless and gapless — lossy codecs add priming gaps to loops)
 *   - written to `static/audio/{id}.flac`
 *   - analysed (channels, duration, loudness, 1/3-octave energy profile) into `src/lib/audio/library.json`
 * Credits/licence/tags come from `scripts/sample-meta.json`, keyed by sample id.
 * Files already processed (same size + mtime) are skipped unless --force.
 * --reanalyze recomputes the analysis (spectrum, stereo side/mid) from the committed FLACs only.
 */

import { execFile, spawn } from 'node:child_process';
import { promisify } from 'node:util';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import ffmpegPath from 'ffmpeg-static';
import { averageSpectrum } from '../src/lib/audio/spectrum.ts';
import { sideToMidDb } from '../src/lib/audio/loudness.ts';
import { parseSampleName, type SampleEntry } from '../src/lib/audio/library.ts';

const run = promisify(execFile);
const ROOT = resolve(import.meta.dirname, '..');
const SRC = join(ROOT, 'samples-src');
const OUT = join(ROOT, 'static/audio');
const MANIFEST = join(ROOT, 'src/lib/audio/library.json');
const META = join(ROOT, 'scripts/sample-meta.json');

const TARGET_LUFS = -18;
const TARGET_TP = -1;
const MAX_SECONDS = 30;
const RATE = 44100;
const EXTENSIONS = /\.(wav|aiff?|flac|mp3|ogg|m4a)$/i;

type Stored = SampleEntry & { srcStamp?: string };
type Meta = Record<string, { credit?: string; license?: string; tags?: string[] }>;

if (!ffmpegPath) throw new Error('ffmpeg-static did not provide a binary');
const ffmpeg: string = ffmpegPath;

async function ff(args: string[]): Promise<string> {
	try {
		const { stderr } = await run(ffmpeg, ['-hide_banner', '-nostdin', ...args], {
			maxBuffer: 64 * 1024 * 1024
		});
		return stderr;
	} catch (e) {
		// `ffmpeg -i file` with no output exits 1 but still prints the stream info
		const err = e as { stderr?: string };
		if (err.stderr) return err.stderr;
		throw e;
	}
}

function probe(stderr: string): { channels: 1 | 2; durationSec: number; trimmed: boolean } {
	const dur = /Duration: (\d+):(\d+):(\d+\.\d+)/.exec(stderr);
	const durationSec = dur ? +dur[1] * 3600 + +dur[2] * 60 + +dur[3] : 0;
	const mono = /Audio: [^\n]*, (mono|1 channels)/.test(stderr);
	return {
		channels: mono ? 1 : 2,
		durationSec: Math.min(durationSec, MAX_SECONDS),
		trimmed: durationSec > MAX_SECONDS
	};
}

interface Loudness {
	input_i: string;
	input_tp: string;
	input_lra: string;
	input_thresh: string;
	target_offset: string;
}

function parseLoudnorm(stderr: string): Loudness {
	const start = stderr.lastIndexOf('{');
	const end = stderr.lastIndexOf('}');
	if (start < 0 || end < start) throw new Error('could not read loudnorm output');
	return JSON.parse(stderr.slice(start, end + 1));
}

const LN = `I=${TARGET_LUFS}:TP=${TARGET_TP}:LRA=11`;

async function measure(file: string): Promise<Loudness> {
	const err = await ff([
		'-i',
		file,
		'-t',
		String(MAX_SECONDS),
		'-af',
		`loudnorm=${LN}:print_format=json`,
		'-f',
		'null',
		'-'
	]);
	return parseLoudnorm(err);
}

async function decodePcm(file: string, channels: 1 | 2): Promise<Float32Array> {
	return new Promise((res, rej) => {
		const chunks: Buffer[] = [];
		const p = spawn(
			ffmpeg,
			[
				'-hide_banner',
				'-nostdin',
				'-i',
				file,
				'-ac',
				String(channels),
				'-ar',
				String(RATE),
				'-f',
				'f32le',
				'-'
			],
			{ stdio: ['ignore', 'pipe', 'ignore'] }
		);
		p.stdout.on('data', (c: Buffer) => chunks.push(c));
		p.on('error', rej);
		p.on('close', () => {
			const buf = Buffer.concat(chunks);
			// copy: the Buffer's pool slice may not be 4-byte aligned
			const copy = new Float32Array(Math.floor(buf.length / 4));
			for (let i = 0; i < copy.length; i++) copy[i] = buf.readFloatLE(i * 4);
			res(copy);
		});
	});
}

/** Analysis that only needs the encoded FLAC (so it can be redone without the raw source). */
async function analyze(flac: string, channels: 1 | 2) {
	const spectrum = profile(await decodePcm(flac, 1));
	let sideDb: number | null = null;
	if (channels === 2) {
		const pcm = await decodePcm(flac, 2);
		const left = new Float32Array(pcm.length / 2);
		const right = new Float32Array(pcm.length / 2);
		for (let i = 0; i < left.length; i++) {
			left[i] = pcm[2 * i];
			right[i] = pcm[2 * i + 1];
		}
		sideDb = Math.round(sideToMidDb(left, right) * 10) / 10;
	}
	return { spectrum, sideDb };
}

function profile(samples: Float32Array): SampleEntry['spectrum'] {
	const { freqs, power } = averageSpectrum(samples, RATE, { perOctave: 3, frames: 32 });
	const max = Math.max(...power);
	const round = (n: number) => Math.round(n * 10) / 10;
	return {
		freqs: freqs.map(round),
		relDb: power.map((p) =>
			p > 0 && max > 0 ? Math.max(-120, round(10 * Math.log10(p / max))) : -120
		)
	};
}

async function process(file: string, id: string, force: boolean): Promise<Partial<Stored> | null> {
	const srcPath = join(SRC, file);
	const stamp = `${statSync(srcPath).size}-${Math.round(statSync(srcPath).mtimeMs)}`;
	const outPath = join(OUT, `${id}.flac`);
	const previous = (JSON.parse(readFileSync(MANIFEST, 'utf8')) as Stored[]).find(
		(s) => s.id === id
	);
	if (!force && previous?.srcStamp === stamp && existsSync(outPath)) return null;

	const { channels, durationSec, trimmed } = probe(await ff(['-i', srcPath]));
	const m = await measure(srcPath);
	// A cut at 30 s makes the loop seam jump; a 20 ms fade at both ends keeps it click-free
	const fades = trimmed ? `,afade=t=in:d=0.02,afade=t=out:st=${MAX_SECONDS - 0.02}:d=0.02` : '';
	const filter =
		`loudnorm=${LN}:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}` +
		`:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true${fades}`;
	await ff([
		'-y',
		'-i',
		srcPath,
		'-t',
		String(MAX_SECONDS),
		'-af',
		filter,
		'-ar',
		String(RATE),
		'-ac',
		String(channels),
		'-c:a',
		'flac',
		'-compression_level',
		'8',
		outPath
	]);

	const after = await measure(outPath);
	const { spectrum, sideDb } = await analyze(outPath, channels);
	return {
		channels,
		durationSec: Math.round(durationSec * 100) / 100,
		lufs: Math.round(+after.input_i * 10) / 10,
		spectrum,
		sideDb,
		srcStamp: stamp
	};
}

/** Recompute FLAC-derived analysis for every manifest entry (no raw sources needed). */
async function reanalyze() {
	const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8')) as Stored[];
	for (const entry of manifest) {
		const flac = join(OUT, `${entry.id}.flac`);
		if (!existsSync(flac)) {
			console.warn(`skip  ${entry.id}  (no ${flac})`);
			continue;
		}
		Object.assign(entry, await analyze(flac, entry.channels));
		console.log(`done  ${entry.id}  side/mid ${entry.sideDb ?? 'mono'} dB`);
	}
	writeFileSync(MANIFEST, JSON.stringify(manifest, null, '\t') + '\n');
}

async function main() {
	const args = process_argv();
	if (args.reanalyze) return reanalyze();
	mkdirSync(SRC, { recursive: true });
	mkdirSync(OUT, { recursive: true });
	if (!existsSync(MANIFEST)) writeFileSync(MANIFEST, '[]\n');
	const meta: Meta = existsSync(META) ? JSON.parse(readFileSync(META, 'utf8')) : {};
	const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8')) as Stored[];

	const files = readdirSync(SRC)
		.filter((f) => EXTENSIONS.test(f))
		.sort();
	if (files.length === 0)
		console.log(`No audio in ${SRC}. Drop raw files named {kind}_{source}_{bpm}_{name}.wav there.`);

	for (const file of files) {
		const parsed = parseSampleName(file);
		if (!parsed) {
			console.warn(`skip  ${file}  (name must be {kind}_{source}_{bpm}_{name}.ext)`);
			continue;
		}
		if (args.only && !file.includes(args.only)) continue;
		const result = await process(file, parsed.id, args.force);
		if (!result) {
			console.log(`ok    ${parsed.id}  (unchanged)`);
			continue;
		}
		const entry: Stored = {
			id: parsed.id,
			url: `/audio/${parsed.id}.flac`,
			kind: parsed.kind,
			source: parsed.source,
			bpm: parsed.bpm,
			name: parsed.name,
			...(result as Required<
				Pick<Stored, 'channels' | 'durationSec' | 'lufs' | 'spectrum' | 'srcStamp'>
			>),
			...meta[parsed.id]
		};
		const i = manifest.findIndex((s) => s.id === parsed.id);
		if (i >= 0) manifest[i] = entry;
		else manifest.push(entry);
		const quiet = entry.spectrum.freqs.filter((_, k) => entry.spectrum.relDb[k] < -30).length;
		console.log(
			`done  ${entry.id}  ${entry.channels === 1 ? 'mono' : 'stereo'}  ${entry.durationSec}s  ${entry.lufs} LUFS  (${quiet}/${entry.spectrum.freqs.length} bands below -30 dB)`
		);
	}

	manifest.sort((a, b) => a.id.localeCompare(b.id));
	writeFileSync(MANIFEST, JSON.stringify(manifest, null, '\t') + '\n');
	writeCredits(manifest);
	console.log(`\n${manifest.length} samples in library.json, credits in static/audio/CREDITS.md`);
}

function writeCredits(manifest: Stored[]) {
	const rows = manifest.map(
		(s) =>
			`- \`${s.id}\` — ${s.credit ?? 'no credit recorded'} (license: ${s.license ?? 'unknown'})`
	);
	writeFileSync(
		join(OUT, 'CREDITS.md'),
		`# Sample credits\n\nGenerated by \`pnpm samples\` from \`scripts/sample-meta.json\`.\n\n${rows.join('\n')}\n`
	);
}

function process_argv() {
	const argv = globalThis.process.argv.slice(2);
	const only = argv.indexOf('--only');
	return {
		force: argv.includes('--force'),
		reanalyze: argv.includes('--reanalyze'),
		only: only >= 0 ? argv[only + 1] : undefined
	};
}

main().catch((e) => {
	console.error(e);
	globalThis.process.exit(1);
});
