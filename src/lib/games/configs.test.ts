import { describe, it, expect } from 'vitest';
import {
	createFreqIdConfig,
	ZONE_CONFIG,
	DIFFICULTY_CONFIG as FREQ_DIFF,
	OCTAVE_BANDS,
	bandsInZone
} from './freq-id/config.js';
import {
	createPanningConfig,
	ZONE_CONFIG as PAN_ZONE,
	DIFFICULTY_CONFIG as PAN_DIFF,
	positionsInZone
} from './panning/config.js';
import { createDbChangeConfig, DIFFICULTY_CONFIG as DB_DIFF } from './db-change/config.js';
import {
	createEqMatchingConfig,
	DIFFICULTY_CONFIG as EQM_DIFF,
	Q_FIXED,
	Q_STEPS
} from './eq-matching/config.js';

const DIFFS = ['easy', 'medium', 'hard'] as const;
const RUNS = 100;

describe('freq-id', () => {
	const zones = Object.keys(ZONE_CONFIG) as (keyof typeof ZONE_CONFIG)[];

	it('rounds respect zone, gain, Q and the difficulty rules', () => {
		for (const difficulty of DIFFS) {
			for (const zone of zones) {
				const config = createFreqIdConfig({ difficulty, zone, roundCount: 5 });
				const { min, max } = ZONE_CONFIG[zone];
				const d = FREQ_DIFF[difficulty];
				for (let i = 0; i < RUNS; i++) {
					const r = config.generateRound();
					expect(r.targetFreq).toBeGreaterThanOrEqual(min);
					expect(r.targetFreq).toBeLessThanOrEqual(max);
					expect(d.gainOptions).toContain(Math.abs(r.gainDb));
					expect(d.qOptions).toContain(r.q);
					if (!d.allowCuts) expect(r.gainDb).toBeGreaterThan(0);
					if (d.input === 'buttons') expect(OCTAVE_BANDS).toContain(r.targetFreq as never);
				}
			}
		}
	});

	it('Easy offers at least one band per zone and always includes the target', () => {
		for (const zone of zones) {
			const bands = bandsInZone(zone);
			expect(bands.length).toBeGreaterThan(0);
			const config = createFreqIdConfig({ difficulty: 'easy', zone, roundCount: 5 });
			for (let i = 0; i < RUNS; i++) expect(bands).toContain(config.generateRound().targetFreq);
		}
	});

	it('scores 1 exact, 0.5 at the margin, 0 at twice the margin; passes at the margin', () => {
		for (const difficulty of DIFFS) {
			const config = createFreqIdConfig({ difficulty, zone: 'full', roundCount: 5 });
			const m = FREQ_DIFF[difficulty].errorMarginOctaves;
			const r = config.generateRound();
			expect(config.scoreGuess!(r, r.targetFreq)).toBe(1);
			expect(config.scoreGuess!(r, r.targetFreq * 2 ** (m * 0.9))).toBeGreaterThan(0.5);
			expect(config.scoreGuess!(r, r.targetFreq * 2 ** (m * 1.1))).toBeLessThan(0.5);
			expect(config.scoreGuess!(r, r.targetFreq * 2 ** (m * 2))).toBeCloseTo(0, 10);
			expect(config.evaluateGuess(r, r.targetFreq * 2 ** (m * 0.9))).toBe(true);
			expect(config.evaluateGuess(r, r.targetFreq * 2 ** (m * 1.1))).toBe(false);
		}
	});

	it('Easy: the adjacent octave band is wrong but earns partial credit', () => {
		const config = createFreqIdConfig({ difficulty: 'easy', zone: 'full', roundCount: 5 });
		const r = { ...config.generateRound(), targetFreq: 1000 };
		expect(config.evaluateGuess(r, 2000)).toBe(false);
		expect(config.scoreGuess!(r, 2000)).toBeGreaterThan(0);
	});
});

describe('panning', () => {
	const zones = Object.keys(PAN_ZONE) as (keyof typeof PAN_ZONE)[];

	it('targets stay in zone; Easy snaps to positions, others stay off-center', () => {
		for (const difficulty of DIFFS) {
			for (const zone of zones) {
				const config = createPanningConfig({ difficulty, zone, roundCount: 5 });
				const { min, max } = PAN_ZONE[zone];
				for (let i = 0; i < RUNS; i++) {
					const r = config.generateRound();
					expect(r.targetPan).toBeGreaterThanOrEqual(min);
					expect(r.targetPan).toBeLessThanOrEqual(max);
					if (difficulty === 'easy') expect(positionsInZone(zone)).toContain(r.targetPan);
					else expect(Math.abs(r.targetPan)).toBeGreaterThanOrEqual(0.1);
					expect(config.evaluateGuess(r, r.targetPan)).toBe(true);
				}
			}
		}
	});

	it('scores by distance: 1 exact, 0.5 at the margin, 0 at twice the margin', () => {
		for (const difficulty of DIFFS) {
			const config = createPanningConfig({ difficulty, zone: 'full', roundCount: 5 });
			const m = PAN_DIFF[difficulty].errorMarginPan;
			const r = { ...config.generateRound(), targetPan: 0.2 };
			expect(config.scoreGuess!(r, 0.2)).toBe(1);
			expect(config.scoreGuess!(r, 0.2 + m)).toBeCloseTo(0.5, 10);
			expect(config.scoreGuess!(r, 0.2 + 2 * m)).toBeCloseTo(0, 10);
			expect(config.evaluateGuess(r, 0.2 + m * 0.9)).toBe(true);
			expect(config.evaluateGuess(r, 0.2 + m * 1.1)).toBe(false);
		}
	});

	it('Easy: the neighbouring position is wrong but earns partial credit', () => {
		const config = createPanningConfig({ difficulty: 'easy', zone: 'full', roundCount: 5 });
		const r = { ...config.generateRound(), targetPan: 0 };
		expect(config.evaluateGuess(r, 0.5)).toBe(false);
		expect(config.scoreGuess!(r, 0.5)).toBeGreaterThan(0);
	});
});

describe('db-change', () => {
	it('options contain the target and a distinct distractor from the pool', () => {
		for (const difficulty of DIFFS) {
			const config = createDbChangeConfig({ difficulty, roundCount: 5 });
			const pool = DB_DIFF[difficulty].pool;
			for (let i = 0; i < RUNS; i++) {
				const r = config.generateRound();
				expect(r.options).toContain(r.targetDb);
				expect(r.options[0]).not.toBe(r.options[1]);
				expect(r.options.every((o) => pool.includes(Math.abs(o)))).toBe(true);
				expect(config.evaluateGuess(r, r.targetDb)).toBe(true);
			}
		}
	});
});

describe('eq-matching', () => {
	it('targets have bandCount distinct freqs, gains from the pool, exact match passes', () => {
		for (const difficulty of DIFFS) {
			const config = createEqMatchingConfig({ difficulty, roundCount: 5 });
			const { bandCount, gainPool } = EQM_DIFF[difficulty];
			for (let i = 0; i < RUNS; i++) {
				const r = config.generateRound();
				expect(r.targetBands).toHaveLength(bandCount);
				expect(new Set(r.targetBands.map((b) => b.freq)).size).toBe(bandCount);
				expect(r.targetBands.every((b) => gainPool.includes(b.gainDb))).toBe(true);
				expect(config.evaluateGuess(r, r.targetBands)).toBe(true);
			}
		}
	});
});

describe('eq-matching scoring', () => {
	it('Q is fixed unless the difficulty exposes it', () => {
		for (const difficulty of DIFFS) {
			const config = createEqMatchingConfig({ difficulty, roundCount: 5 });
			for (let i = 0; i < RUNS; i++) {
				for (const band of config.generateRound().targetBands) {
					if (EQM_DIFF[difficulty].qEditable) expect(Q_STEPS).toContain(band.q);
					else expect(band.q).toBe(Q_FIXED);
				}
			}
		}
	});

	it('grades: exact = 1, nothing applied = 0, passes only at the threshold', () => {
		const config = createEqMatchingConfig({ difficulty: 'easy', roundCount: 5 });
		for (let i = 0; i < RUNS; i++) {
			const r = config.generateRound();
			expect(config.scoreGuess!(r, r.targetBands)).toBe(1);
			expect(config.scoreGuess!(r, [])).toBe(0);
			expect(config.evaluateGuess(r, r.targetBands)).toBe(true);
			expect(config.evaluateGuess(r, [])).toBe(false);
		}
	});

	it('right band, wrong gain earns partial credit', () => {
		const config = createEqMatchingConfig({ difficulty: 'easy', roundCount: 5 });
		const r = config.generateRound();
		const half = r.targetBands.map((b) => ({ ...b, gainDb: b.gainDb / 2 }));
		const score = config.scoreGuess!(r, half);
		expect(score).toBeGreaterThan(0.5);
		expect(score).toBeLessThan(1);
	});
});
