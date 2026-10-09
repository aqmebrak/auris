import { describe, it, expect } from 'vitest';
import {
	DIFFICULTY_CONFIG,
	POLARITY_CHOICES,
	choiceLabel,
	choicesFor,
	createPhaseCombConfig,
	type PhaseDifficulty,
	type PhaseMode
} from './config.js';

const DIFFS: PhaseDifficulty[] = ['easy', 'medium', 'hard'];
const MODES: PhaseMode[] = ['type', 'delay'];

describe('phase-comb rounds', () => {
	for (const mode of MODES) {
		it(`${mode}: answer is among the choices; right passes, wrong fails`, () => {
			for (const difficulty of DIFFS) {
				const config = createPhaseCombConfig({ mode, difficulty, roundCount: 5 });
				const choices = choicesFor(mode, difficulty);
				for (let i = 0; i < 200; i++) {
					const r = config.generateRound();
					expect(r.mode).toBe(mode);
					expect(choices).toContain(r.answer);
					expect(config.evaluateGuess(r, r.answer)).toBe(true);
					expect(
						config.evaluateGuess(
							r,
							choices.find((c) => c !== r.answer)!
						)
					).toBe(false);
				}
			}
		});
	}

	it('type mode: polarity is the answer, delay comes from the difficulty set, both polarities occur', () => {
		for (const difficulty of DIFFS) {
			const config = createPhaseCombConfig({ mode: 'type', difficulty, roundCount: 5 });
			const seen = new Set<number>();
			for (let i = 0; i < 200; i++) {
				const r = config.generateRound();
				expect(r.answer).toBe(r.polarity);
				expect(DIFFICULTY_CONFIG[difficulty].typeDelays).toContain(r.delayMs);
				seen.add(r.polarity);
			}
			expect([...seen].sort()).toEqual([...POLARITY_CHOICES].sort());
		}
	});

	it('delay mode: always an in-phase comb whose delay is the answer', () => {
		for (const difficulty of DIFFS) {
			const config = createPhaseCombConfig({ mode: 'delay', difficulty, roundCount: 5 });
			for (let i = 0; i < 100; i++) {
				const r = config.generateRound();
				expect(r.polarity).toBe(1);
				expect(r.answer).toBe(r.delayMs);
			}
		}
	});

	it('labels', () => {
		expect(choiceLabel('type', 1)).toMatch(/phase/i);
		expect(choiceLabel('type', -1)).toMatch(/flipped/i);
		expect(choiceLabel('delay', 0.5)).toBe('0.5 ms');
	});
});
