export type Difficulty = 'easy' | 'medium' | 'hard';

export type GameState =
	| 'idle'
	| 'selecting_difficulty'
	| 'round_active'
	| 'round_result'
	| 'game_over';

export type Round = {
	targetFreq: number;
	targetGainDb: number;
	targetQ: number;
	userFreq: number | null;
	userGainDb: number | null;
	userQ: number | null;
	result: 'correct' | 'incorrect' | 'pending';
	errorMarginPct: number;
};

export type GameSession = {
	difficulty: Difficulty;
	rounds: Round[];
	currentRoundIndex: number;
	score: number;
	startedAt: string;
	endedAt: string | null;
};

export type GameResult = {
	timestamp: string;
	difficulty: Difficulty;
	score: number;
	rounds: Round[];
};
