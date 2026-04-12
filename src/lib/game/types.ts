/**
 * Generic game engine — core types.
 * Game-agnostic: a game plugs in by providing a `GameConfig<TRound, TGuess>`.
 */

export type Phase = 'idle' | 'playing' | 'roundResult' | 'gameOver';

export type RoundResult = 'correct' | 'wrong' | 'pending';

/** Minimum shape every round must have. Games extend this with game-specific fields. */
export interface RoundBase<TGuess> {
	guess: TGuess | null;
	result: RoundResult;
}

export interface GameConfig<TRound extends RoundBase<TGuess>, TGuess> {
	/** Stable identifier used as the localStorage namespace. */
	id: string;
	/** Number of rounds per session. */
	roundCount: number;
	/** Produces a fresh round (with `guess: null`, `result: 'pending'`). */
	generateRound: () => TRound;
	/** Returns true if the guess is correct for this round. */
	evaluateGuess: (round: TRound, guess: TGuess) => boolean;
}

export interface GameSession<TRound> {
	rounds: TRound[];
	currentRound: number;
	phase: Phase;
}
