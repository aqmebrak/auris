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

export function submitGuess<TR extends RoundBase<TG>, TG>(
	session: GameSession<TR>,
	config: GameConfig<TR, TG>,
	guess: NoInfer<TG>
): GameSession<TR> {
	const rounds = session.rounds.map((r, i) => {
		if (i !== session.currentRound) return r;
		const correct = config.evaluateGuess(r, guess);
		return {
			...r,
			guess,
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
