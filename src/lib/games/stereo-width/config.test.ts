import { describe, it, expect } from 'vitest';
import {
	DIFFICULTY_CONFIG,
	MIN_SIDE_DB,
	createStereoWidthConfig,
	formatWidth,
	type WidthDifficulty
} from './config.js';
import { widthCompensationDb } from './audio.js';
import { SAMPLE_LIBRARY } from '$lib/audio/library.js';

const DIFFS: WidthDifficulty[] = ['easy', 'medium', 'hard'];

describe('stereo-width rounds', () => {
	it('answer is one of the choices; only stereo samples with real side content are used', () => {
		const eligible = SAMPLE_LIBRARY.filter(
			(s) => s.channels === 2 && (s.sideDb ?? -Infinity) >= MIN_SIDE_DB
		);
		expect(eligible.length).toBeGreaterThan(0); // library has usable material
		for (const difficulty of DIFFS) {
			const config = createStereoWidthConfig({ difficulty, roundCount: 5 });
			for (let i = 0; i < 200; i++) {
				const r = config.generateRound();
				expect(DIFFICULTY_CONFIG[difficulty].choices).toContain(r.width);
				expect(r.sideDb).toBeGreaterThanOrEqual(MIN_SIDE_DB);
				expect(eligible.map((s) => s.url)).toContain(r.sampleUrl);
				expect(config.evaluateGuess(r, r.width)).toBe(true);
				const wrong = DIFFICULTY_CONFIG[difficulty].choices.find((c) => c !== r.width)!;
				expect(config.evaluateGuess(r, wrong)).toBe(false);
			}
		}
	});

	it('formats widths', () => {
		expect(formatWidth(0)).toBe('Mono');
		expect(formatWidth(0.75)).toBe('75%');
		expect(formatWidth(3)).toBe('300%');
	});
});

describe('widthCompensationDb', () => {
	it('is 0 at width 1 and for a signal with no side', () => {
		expect(widthCompensationDb(1, -10)).toBeCloseTo(0, 10);
		expect(widthCompensationDb(3, -60)).toBeCloseTo(0, 2);
	});

	it('turns the level up when narrowing and down when widening', () => {
		expect(widthCompensationDb(0, -3)).toBeGreaterThan(0);
		expect(widthCompensationDb(3, -3)).toBeLessThan(0);
	});

	it('equal side and mid (0 dB): mono loses half the power → +3 dB', () => {
		expect(widthCompensationDb(0, 0)).toBeCloseTo(3.01, 1);
	});
});
