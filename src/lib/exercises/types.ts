export type Difficulty = 'easy' | 'medium' | 'hard';

export type ModuleId = 'decibel' | 'eq' | 'panning' | 'compression';

export interface DecibelParams {
	type: 'decibel';
	gainDb: number;
}

export interface EQParams {
	type: 'eq';
	frequencyHz: number;
	gainDb: number;
	Q: number;
}

export interface PanningParams {
	type: 'panning';
	pan: number;
}

export interface CompressionParams {
	type: 'compression';
	threshold: number;
	ratio: number;
	knee: number;
	attack: number;
	release: number;
}

export type ExerciseParams = DecibelParams | EQParams | PanningParams | CompressionParams;

export interface Exercise {
	id: string;
	module: ModuleId;
	difficulty: Difficulty;
	sampleId: string;
	timestamp: number;
	params: ExerciseParams;
	question: string;
	correctAnswer: AnswerValue;
}

export type AnswerValue =
	| { type: 'decibel'; gainDb: number }
	| { type: 'eq'; frequencyHz: number; gainDb: number; boostOrCut?: 'boost' | 'cut' }
	| { type: 'panning'; pan: number }
	| { type: 'compression'; detected?: boolean; ratio?: number; threshold?: number };

export interface AnswerResult {
	correct: boolean;
	accuracy: number;
	exerciseId: string;
	moduleId: ModuleId;
	difficulty: Difficulty;
	userAnswer: AnswerValue;
	correctAnswer: AnswerValue;
	points: number;
}

export interface SessionRecord {
	timestamp: number;
	difficulty: Difficulty;
	attempts: number;
	correct: number;
	points: number;
}

export interface ModuleScore {
	moduleId: ModuleId;
	totalAttempts: number;
	correctAttempts: number;
	currentStreak: number;
	bestStreak: number;
	totalPoints: number;
	history: SessionRecord[];
	perDifficulty: Record<Difficulty, { attempts: number; correct: number }>;
}

export interface UserSettings {
	masterVolume: number;
	preferredSample: string;
	difficulties: Record<ModuleId, Difficulty>;
	autoAdvanceDifficulty: boolean;
	headphonesNoticeDismissed: boolean;
}

export interface AurisState {
	version: number;
	modules: Record<ModuleId, ModuleScore>;
	settings: UserSettings;
}
