// Game logic for Frequency ID exercise
// Pure functions — no side effects

export type RoundResult = 'correct' | 'wrong' | 'pending';

export type Round = {
	targetFreq: number;
	gainDb: number;
	guess: number | null;
	result: RoundResult;
};

export type GameState = {
	rounds: Round[];
	currentRound: number;
	phase: 'idle' | 'playing' | 'guessing' | 'roundResult' | 'gameOver';
};

export const ERROR_MARGIN_OCTAVES = 1 / 3;

export function newGame(): GameState {
	const rounds: Round[] = Array.from({ length: 5 }, () => ({
		targetFreq: Math.round(20 * Math.pow(20000 / 20, Math.random())),
		gainDb: Math.random() < 0.5 ? 12 : -12,
		guess: null,
		result: 'pending' as RoundResult
	}));
	return {
		rounds,
		currentRound: 0,
		phase: 'idle'
	};
}

export function startRound(state: GameState): GameState {
	return { ...state, phase: 'playing' };
}

export function markPlaying(state: GameState): GameState {
	return { ...state, phase: 'guessing' };
}

export function submitGuess(state: GameState, guess: number): GameState {
	const rounds = state.rounds.map((r, i) => {
		if (i !== state.currentRound) return r;
		const isCorrect = Math.abs(Math.log2(guess / r.targetFreq)) <= ERROR_MARGIN_OCTAVES;
		return {
			...r,
			guess,
			result: (isCorrect ? 'correct' : 'wrong') as RoundResult
		};
	});
	return { ...state, rounds, phase: 'roundResult' };
}

export function nextRound(state: GameState): GameState {
	const nextIdx = state.currentRound + 1;
	if (nextIdx >= 5) {
		return { ...state, phase: 'gameOver' };
	}
	return { ...state, currentRound: nextIdx, phase: 'idle' };
}

export function scoreCorrect(state: GameState): number {
	return state.rounds.filter((r) => r.result === 'correct').length;
}
