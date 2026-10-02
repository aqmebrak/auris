/**
 * Pure, game-agnostic session helpers.
 * No side effects — operate on immutable `GameSession<TRound>` values.
 */

import type { GameConfig, GameSession, RoundBase } from './types.js';

export function createSession<TR extends RoundBase<TG>, TG>(
	config: GameConfig<TR, TG>
): GameSession<TR> {
	return {
		rounds: Array.from({ length: config.roundCount }, () => config.generateRound()),
		currentRound: 0,
		phase: 'idle'
	};
}

export function startRound<TR extends RoundBase<TG>, TG>(
	session: GameSession<TR>
): GameSession<TR> {
	return { ...session, phase: 'playing' };
}

function gradeGuess<TR extends RoundBase<TG>, TG>(
	config: GameConfig<TR, TG>,
	round: TR,
	guess: TG
): { score: number; correct: boolean } {
	if (config.scoreGuess) {
		const score = Math.min(1, Math.max(0, config.scoreGuess(round, guess)));
		return { score, correct: score >= (config.passThreshold ?? 1) };
	}
	const correct = config.evaluateGuess(round, guess);
	return { score: correct ? 1 : 0, correct };
}

export function submitGuess<TR extends RoundBase<TG>, TG>(
	session: GameSession<TR>,
	config: GameConfig<TR, TG>,
	guess: NoInfer<TG>
): GameSession<TR> {
	const rounds = session.rounds.map((r, i) => {
		if (i !== session.currentRound) return r;
		const { score, correct } = gradeGuess(config, r, guess);
		return {
			...r,
			guess,
			score,
			result: correct ? 'correct' : 'wrong'
		} as TR;
	});
	return { ...session, rounds, phase: 'roundResult' };
}

export function nextRound<TR extends RoundBase<TG>, TG>(
	session: GameSession<TR>,
	config: GameConfig<TR, TG>
): GameSession<TR> {
	const nextIdx = session.currentRound + 1;
	if (nextIdx >= config.roundCount) {
		return { ...session, phase: 'gameOver' };
	}
	return { ...session, currentRound: nextIdx, phase: 'idle' };
}

export function scoreSession<TR extends RoundBase<TG>, TG>(session: GameSession<TR>): number {
	return session.rounds.filter((r) => (r as RoundBase<TG>).result === 'correct').length;
}

/** Mean closeness over answered rounds, as a 0..100 percentage. */
export function accuracySession<TR extends RoundBase<TG>, TG>(session: GameSession<TR>): number {
	const answered = session.rounds.filter((r) => (r as RoundBase<TG>).result !== 'pending');
	if (answered.length === 0) return 0;
	const sum = answered.reduce((acc, r) => acc + ((r as RoundBase<TG>).score ?? 0), 0);
	return Math.round((sum / answered.length) * 100);
}
