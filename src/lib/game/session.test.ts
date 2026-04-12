import { describe, it, expect } from 'vitest';
import { createSession, startRound, submitGuess, nextRound, scoreSession } from './session.js';
import type { GameConfig, RoundBase } from './types.js';

interface TestRound extends RoundBase<number> {
	target: number;
}

const config: GameConfig<TestRound, number> = {
	id: 'test',
	roundCount: 3,
	generateRound: () => ({ target: 100, guess: null, result: 'pending' }),
	evaluateGuess: (round, guess) => guess === round.target
};

describe('createSession', () => {
	it('generates roundCount rounds, starts idle at index 0', () => {
		const s = createSession(config);
		expect(s.rounds).toHaveLength(3);
		expect(s.currentRound).toBe(0);
		expect(s.phase).toBe('idle');
		expect(s.rounds.every((r) => r.result === 'pending' && r.guess === null)).toBe(true);
	});
});

describe('startRound', () => {
	it('transitions to playing without mutating rounds', () => {
		const s = createSession(config);
		const next = startRound(s);
		expect(next.phase).toBe('playing');
		expect(next.rounds).toBe(s.rounds);
	});
});

describe('submitGuess', () => {
	it('marks round correct when evaluateGuess returns true', () => {
		const s = startRound(createSession(config));
		const next = submitGuess(s, config, 100);
		expect(next.phase).toBe('roundResult');
		expect(next.rounds[0].result).toBe('correct');
		expect(next.rounds[0].guess).toBe(100);
	});

	it('marks round wrong when evaluateGuess returns false', () => {
		const s = startRound(createSession(config));
		const next = submitGuess(s, config, 42);
		expect(next.rounds[0].result).toBe('wrong');
		expect(next.rounds[0].guess).toBe(42);
	});

	it('does not mutate other rounds', () => {
		const s = startRound(createSession(config));
		const next = submitGuess(s, config, 100);
		expect(next.rounds[1].result).toBe('pending');
		expect(next.rounds[2].result).toBe('pending');
	});
});

describe('nextRound', () => {
	it('advances currentRound and returns to idle', () => {
		let s = submitGuess(startRound(createSession(config)), config, 100);
		s = nextRound(s, config);
		expect(s.currentRound).toBe(1);
		expect(s.phase).toBe('idle');
	});

	it('transitions to gameOver after final round', () => {
		let s = createSession(config);
		for (let i = 0; i < 3; i++) {
			s = submitGuess(startRound(s), config, 100);
			s = nextRound(s, config);
		}
		expect(s.phase).toBe('gameOver');
	});
});

describe('scoreSession', () => {
	it('counts correct rounds', () => {
		let s = createSession(config);
		s = submitGuess(startRound(s), config, 100);
		s = nextRound(s, config);
		s = submitGuess(startRound(s), config, 0);
		s = nextRound(s, config);
		s = submitGuess(startRound(s), config, 100);
		expect(scoreSession(s)).toBe(2);
	});
});
