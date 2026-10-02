import { describe, it, expect } from 'vitest';
import {
	DIFFICULTY_CONFIG,
	createEqGuessConfig,
	eqConfigsEqual,
	generateDistractor,
	generateTarget,
	type EqGuessDifficulty
} from './config.js';

const DIFFICULTIES: EqGuessDifficulty[] = ['easy', 'medium', 'hard'];
const RUNS = 200;

describe('eq-guess generation', () => {
	for (const difficulty of DIFFICULTIES) {
		describe(difficulty, () => {
			const { bandCount, gainPool } = DIFFICULTY_CONFIG[difficulty];

			it('distractor differs from target and keeps band count', () => {
				for (let i = 0; i < RUNS; i++) {
					const target = generateTarget(bandCount, gainPool);
					const distractor = generateDistractor(target, difficulty);
					expect(distractor).toHaveLength(target.length);
					expect(eqConfigsEqual(target, distractor)).toBe(false);
				}
			});

			it('distractor frequencies stay distinct and sorted', () => {
				for (let i = 0; i < RUNS; i++) {
					const d = generateDistractor(generateTarget(bandCount, gainPool), difficulty);
					const freqs = d.map((b) => b.freq);
					expect(new Set(freqs).size).toBe(freqs.length);
					expect(freqs).toEqual([...freqs].sort((a, b) => a - b));
				}
			});
		});
	}

	it('boost/cut pattern is not a tell on easy/medium (same sign multiset)', () => {
		for (const difficulty of ['easy', 'medium'] as const) {
			const { bandCount, gainPool } = DIFFICULTY_CONFIG[difficulty];
			for (let i = 0; i < RUNS; i++) {
				const target = generateTarget(bandCount, gainPool);
				const d = generateDistractor(target, difficulty);
				const signs = (eq: typeof target) => eq.map((b) => Math.sign(b.gainDb)).sort();
				expect(signs(d)).toEqual(signs(target));
			}
		}
	});

	it('target does not always start with a boost', () => {
		const { bandCount, gainPool } = DIFFICULTY_CONFIG.medium;
		const firstSigns = new Set<number>();
		for (let i = 0; i < RUNS; i++) {
			firstSigns.add(Math.sign(generateTarget(bandCount, gainPool)[0].gainDb));
		}
		expect(firstSigns.size).toBe(2);
	});

	it('scores the target option correct and the distractor wrong', () => {
		for (const difficulty of DIFFICULTIES) {
			const config = createEqGuessConfig({ difficulty, roundCount: 3 });
			for (let i = 0; i < 50; i++) {
				const round = config.generateRound();
				const wrong = round.options.find((o) => !eqConfigsEqual(o, round.targetEq))!;
				expect(config.evaluateGuess(round, round.targetEq)).toBe(true);
				expect(config.evaluateGuess(round, wrong)).toBe(false);
			}
		}
	});
});
