import { randomChoice, clamp } from '$lib/audio/utils.js';
import { settings } from '$lib/stores/settings.svelte.js';
import { scores } from '$lib/stores/scores.svelte.js';
import type { Exercise, AnswerResult, Difficulty, EQParams } from '$lib/exercises/types.js';

export interface EQDifficultyConfig {
	bands: number[];
	gainRange: [number, number];
	Q: number;
	requireBoostCut: boolean;
	requireGain: boolean;
	gainTolerance: number;
}

export const DIFFICULTY_CONFIG: Record<Difficulty, EQDifficultyConfig> = {
	easy: {
		bands: [250, 1000, 4000],
		gainRange: [-6, 6],
		Q: 1.0,
		requireBoostCut: false,
		requireGain: false,
		gainTolerance: 0
	},
	medium: {
		bands: [125, 250, 500, 1000, 2000, 4000, 8000],
		gainRange: [-6, 6],
		Q: 2.0,
		requireBoostCut: true,
		requireGain: false,
		gainTolerance: 0
	},
	hard: {
		bands: [125, 250, 500, 1000, 2000, 4000, 8000],
		gainRange: [-9, 9],
		Q: 4.0,
		requireBoostCut: true,
		requireGain: true,
		gainTolerance: 3
	}
};

const BASE_POINTS: Record<Difficulty, number> = { easy: 10, medium: 20, hard: 30 };

export function generateExercise(difficulty: Difficulty, sampleId?: string): Exercise {
	const config = DIFFICULTY_CONFIG[difficulty];
	const frequencyHz = randomChoice(config.bands);

	const gainPool: number[] = [];
	for (let g = config.gainRange[0]; g <= config.gainRange[1]; g++) {
		if (g !== 0) gainPool.push(g);
	}
	const gainDb = randomChoice(gainPool);
	const boostOrCut: 'boost' | 'cut' = gainDb > 0 ? 'boost' : 'cut';

	let question: string;
	if (config.requireGain) {
		question = 'Which frequency was adjusted in B, by how much, and boost or cut?';
	} else if (config.requireBoostCut) {
		question = 'Which frequency was adjusted in B, and was it boosted or cut?';
	} else {
		question = 'Which frequency was adjusted in version B?';
	}

	return {
		id: crypto.randomUUID(),
		module: 'eq',
		difficulty,
		sampleId: sampleId ?? settings.preferredSample,
		timestamp: Date.now(),
		params: { type: 'eq', frequencyHz, gainDb, Q: config.Q },
		question,
		correctAnswer: { type: 'eq', frequencyHz, gainDb, boostOrCut }
	};
}

export function evaluateAnswer(
	exercise: Exercise,
	userFrequency: number,
	userBoostOrCut?: 'boost' | 'cut',
	userGainDb?: number
): AnswerResult {
	const params = exercise.params as EQParams;
	const config = DIFFICULTY_CONFIG[exercise.difficulty];
	const correctBoostCut: 'boost' | 'cut' = params.gainDb > 0 ? 'boost' : 'cut';

	const fieldScores: number[] = [];

	// Frequency: binary
	fieldScores.push(userFrequency === params.frequencyHz ? 1 : 0);

	// Boost/cut: binary, if required
	if (config.requireBoostCut) {
		fieldScores.push(userBoostOrCut === correctBoostCut ? 1 : 0);
	}

	// Gain: continuous within tolerance, if required
	if (config.requireGain) {
		const gainAcc = clamp(
			1 - Math.abs((userGainDb ?? 0) - params.gainDb) / config.gainTolerance,
			0,
			1
		);
		fieldScores.push(gainAcc);
	}

	const accuracy = fieldScores.reduce((a, b) => a + b, 0) / fieldScores.length;
	const correct = accuracy >= 0.8;
	const currentStreak = scores.getModuleScore('eq').currentStreak;
	const streakBonus = Math.min(currentStreak, 10) * 2;
	const points = Math.round(BASE_POINTS[exercise.difficulty] * accuracy + streakBonus);

	return {
		correct,
		accuracy,
		exerciseId: exercise.id,
		moduleId: 'eq',
		difficulty: exercise.difficulty,
		userAnswer: {
			type: 'eq',
			frequencyHz: userFrequency,
			gainDb: userGainDb ?? params.gainDb,
			boostOrCut: userBoostOrCut
		},
		correctAnswer: exercise.correctAnswer,
		points
	};
}
