import { describe, it, expect } from 'vitest';
import {
	DIFFICULTY_CONFIG,
	MATCH_STEPS,
	createDynamicsConfig,
	defaultSpec,
	matchSpecScore,
	type DynamicsDifficulty,
	type DynamicsMode
} from './config.js';
import type { CompSpec } from './audio.js';

const DIFFS: DynamicsDifficulty[] = ['easy', 'medium', 'hard'];
const QUIZ: DynamicsMode[] = ['detect', 'ratio', 'attack', 'release'];
const RUNS = 100;
const make = (mode: DynamicsMode, difficulty: DynamicsDifficulty) =>
	createDynamicsConfig({ mode, difficulty, roundCount: 5 });

describe('quiz modes', () => {
	for (const mode of QUIZ) {
		it(`${mode}: answer is among choices; right guess passes, a wrong one fails`, () => {
			for (const difficulty of DIFFS) {
				const config = make(mode, difficulty);
				for (let i = 0; i < RUNS; i++) {
					const r = config.generateRound();
					expect(r.choices).toContain(r.answer);
					expect(config.evaluateGuess(r, r.answer)).toBe(true);
					const wrong = r.choices.find((c) => c !== r.answer)!;
					expect(config.evaluateGuess(r, wrong)).toBe(false);
					expect(config.scoreGuess).toBeUndefined();
				}
			}
		});
	}

	it('detect: exactly one clip is compressed and the answer points at it', () => {
		for (const difficulty of DIFFS) {
			const config = make('detect', difficulty);
			const seen = new Set<number>();
			for (let i = 0; i < RUNS; i++) {
				const r = config.generateRound();
				expect((r.a === null) !== (r.b === null)).toBe(true);
				expect(r.answer === 0 ? r.a : r.b).not.toBeNull();
				expect(r.answer === 0 ? r.b : r.a).toBeNull();
				seen.add(r.answer as number);
			}
			expect(seen.size).toBe(2); // position is randomised
		}
	});

	it('ratio/attack/release: original on A, compressed on B carrying the answer', () => {
		const field = { ratio: 'ratio', attack: 'attackMs', release: 'releaseMs' } as const;
		for (const mode of ['ratio', 'attack', 'release'] as const) {
			for (const difficulty of DIFFS) {
				const r = make(mode, difficulty).generateRound();
				expect(r.a).toBeNull();
				expect(r.b![field[mode]]).toBe(r.answer);
			}
		}
	});

	it('uses the difficulty threshold offset', () => {
		for (const difficulty of DIFFS) {
			expect(make('ratio', difficulty).generateRound().thresholdOffsetDb).toBe(
				DIFFICULTY_CONFIG[difficulty].thresholdOffsetDb
			);
		}
	});
});

describe('match mode', () => {
	it('targets come from the knob steps; user starts mid-range', () => {
		for (const difficulty of DIFFS) {
			const r = make('match', difficulty).generateRound();
			const t = r.answer as CompSpec;
			expect(MATCH_STEPS[difficulty].ratios).toContain(t.ratio);
			expect(MATCH_STEPS[difficulty].attacks).toContain(t.attackMs);
			expect(MATCH_STEPS[difficulty].releases).toContain(t.releaseMs);
			expect(r.a).toEqual(defaultSpec(difficulty));
		}
	});

	it('scores 1 exact, 0.5 per adjacent step, 0 further', () => {
		const d: DynamicsDifficulty = 'medium';
		const s = MATCH_STEPS[d];
		const target: CompSpec = {
			ratio: s.ratios[2],
			attackMs: s.attacks[2],
			releaseMs: s.releases[2]
		};
		expect(matchSpecScore(d, target, target)).toBe(1);
		expect(matchSpecScore(d, target, { ...target, ratio: s.ratios[3] })).toBeCloseTo(5 / 6);
		expect(matchSpecScore(d, target, { ...target, ratio: s.ratios[4] })).toBeCloseTo(2 / 3);
		expect(
			matchSpecScore(d, target, {
				ratio: s.ratios[0],
				attackMs: s.attacks[0],
				releaseMs: s.releases[0]
			})
		).toBe(0);
	});

	it('graded config passes exact matches and verdict follows the threshold', () => {
		for (const difficulty of DIFFS) {
			const config = make('match', difficulty);
			const s = MATCH_STEPS[difficulty];
			const farthest = (steps: number[], v: number) =>
				Math.abs(steps.indexOf(v) - 0) >= Math.abs(steps.indexOf(v) - (steps.length - 1))
					? steps[0]
					: steps[steps.length - 1];
			for (let i = 0; i < RUNS; i++) {
				const r = config.generateRound();
				const target = r.answer as CompSpec;
				expect(config.scoreGuess!(r, target)).toBe(1);
				expect(config.evaluateGuess(r, target)).toBe(true);
				const far: CompSpec = {
					ratio: farthest(s.ratios, target.ratio),
					attackMs: farthest(s.attacks, target.attackMs),
					releaseMs: farthest(s.releases, target.releaseMs)
				};
				const score = config.scoreGuess!(r, far);
				expect(score).toBeLessThan(1);
				expect(config.evaluateGuess(r, far)).toBe(
					score >= DIFFICULTY_CONFIG[difficulty].passThreshold
				);
			}
		}
	});

	it('hard: wrong by two steps on every parameter fails', () => {
		const s = MATCH_STEPS.hard;
		const target: CompSpec = {
			ratio: s.ratios[1],
			attackMs: s.attacks[1],
			releaseMs: s.releases[1]
		};
		const guess: CompSpec = {
			ratio: s.ratios[3],
			attackMs: s.attacks[3],
			releaseMs: s.releases[3]
		};
		expect(matchSpecScore('hard', target, guess)).toBe(0);
	});
});
