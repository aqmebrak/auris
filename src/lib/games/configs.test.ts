import { describe, it, expect } from 'vitest';
import {
	createFreqIdConfig,
	ZONE_CONFIG,
	DIFFICULTY_CONFIG as FREQ_DIFF
} from './freq-id/config.js';
import { createPanningConfig, ZONE_CONFIG as PAN_ZONE } from './panning/config.js';
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
	it('targets stay inside the zone, correct inside margin, wrong outside', () => {
		for (const difficulty of DIFFS) {
			for (const zone of Object.keys(ZONE_CONFIG) as (keyof typeof ZONE_CONFIG)[]) {
				const config = createFreqIdConfig({ difficulty, zone, roundCount: 5 });
				const { min, max } = ZONE_CONFIG[zone];
				const margin = FREQ_DIFF[difficulty].errorMarginOctaves;
				for (let i = 0; i < RUNS; i++) {
					const r = config.generateRound();
					expect(r.targetFreq).toBeGreaterThanOrEqual(min);
					expect(r.targetFreq).toBeLessThanOrEqual(max);
					expect(config.evaluateGuess(r, r.targetFreq)).toBe(true);
					expect(config.evaluateGuess(r, r.targetFreq * 2 ** (margin * 0.9))).toBe(true);
					expect(config.evaluateGuess(r, r.targetFreq * 2 ** (margin * 1.1))).toBe(false);
				}
			}
		}
	});
});

describe('panning', () => {
	it('targets stay in zone, off-center, exact guess correct', () => {
		for (const difficulty of DIFFS) {
			for (const zone of Object.keys(PAN_ZONE) as (keyof typeof PAN_ZONE)[]) {
				const config = createPanningConfig({ difficulty, zone, roundCount: 5 });
				const { min, max } = PAN_ZONE[zone];
				for (let i = 0; i < RUNS; i++) {
					const r = config.generateRound();
					expect(r.targetPan).toBeGreaterThanOrEqual(min);
					expect(r.targetPan).toBeLessThanOrEqual(max);
					expect(Math.abs(r.targetPan)).toBeGreaterThanOrEqual(0.1);
					expect(config.evaluateGuess(r, r.targetPan)).toBe(true);
				}
			}
		}
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
