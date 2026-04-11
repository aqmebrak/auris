import type { Difficulty, GameSession, Round } from './types.js';
import { DIFFICULTY_CONFIG } from './config.js';

function generateRound(difficulty: Difficulty): Round {
	const config = DIFFICULTY_CONFIG[difficulty];

	// FR-2: log-space frequency 80Hz–10kHz
	const targetFreq = Math.round(80 * Math.pow(10000 / 80, Math.random()));

	// FR-3: gain with random sign, clamped so |gainDb| >= 1
	let targetGainDb = config.gainRange * Math.random() * (Math.random() > 0.5 ? 1 : -1);
	if (Math.abs(targetGainDb) < 1) {
		targetGainDb = targetGainDb >= 0 ? 1 : -1;
	}

	// FR-4: linear Q in [qMin, qMax]
	const targetQ = config.qMin + Math.random() * (config.qMax - config.qMin);

	return {
		targetFreq,
		targetGainDb,
		targetQ,
		userFreq: null,
		userGainDb: null,
		userQ: null,
		result: 'pending',
		errorMarginPct: config.errorMargin
	};
}

export function createGameSession(difficulty: Difficulty): GameSession {
	const rounds: Round[] = Array.from({ length: 5 }, () => generateRound(difficulty));
	return {
		difficulty,
		rounds,
		currentRoundIndex: 0,
		score: 0,
		startedAt: new Date().toISOString(),
		endedAt: null
	};
}

// FR-5: correctness check
export function evaluateGuess(round: Round, userFreq: number): 'correct' | 'incorrect' {
	const ratio = Math.abs(userFreq - round.targetFreq) / round.targetFreq;
	return ratio <= round.errorMarginPct ? 'correct' : 'incorrect';
}
