import { randomChoice, clamp } from '$lib/audio/utils.js';
import { settings } from '$lib/stores/settings.svelte.js';
import { scores } from '$lib/stores/scores.svelte.js';
import type { Exercise, AnswerResult, Difficulty, DecibelParams } from '$lib/exercises/types.js';

// Generate hard values: all 0.5-step increments from -6 to +6, excluding 0
const hardValues: number[] = [];
for (let v = -6; v <= 6; v += 0.5) {
	if (v !== 0) hardValues.push(Math.round(v * 10) / 10);
}

export const DIFFICULTY_CONFIG: Record<Difficulty, { values: number[]; tolerance: number }> = {
	easy: { values: [3, 6, -3, -6], tolerance: 2 },
	medium: { values: [-6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6], tolerance: 1 },
	hard: { values: hardValues, tolerance: 0.5 }
};

const BASE_POINTS: Record<Difficulty, number> = { easy: 10, medium: 20, hard: 30 };

export function generateExercise(difficulty: Difficulty, sampleId?: string): Exercise {
	const gainDb = randomChoice(DIFFICULTY_CONFIG[difficulty].values);
	return {
		id: crypto.randomUUID(),
		module: 'decibel',
		difficulty,
		sampleId: sampleId ?? settings.preferredSample,
		timestamp: Date.now(),
		params: { type: 'decibel', gainDb },
		question: 'How many dB was the volume changed in version B?',
		correctAnswer: { type: 'decibel', gainDb }
	};
}

export function evaluateAnswer(exercise: Exercise, userAnswer: number): AnswerResult {
	const params = exercise.params as DecibelParams;
	const tolerance = DIFFICULTY_CONFIG[exercise.difficulty].tolerance;
	const accuracy = clamp(1 - Math.abs(userAnswer - params.gainDb) / tolerance, 0, 1);
	const correct = accuracy >= 0.8;
	const currentStreak = scores.getModuleScore('decibel').currentStreak;
	const streakBonus = Math.min(currentStreak, 10) * 2;
	const points = Math.round(BASE_POINTS[exercise.difficulty] * accuracy + streakBonus);

	return {
		correct,
		accuracy,
		exerciseId: exercise.id,
		moduleId: 'decibel',
		difficulty: exercise.difficulty,
		userAnswer: { type: 'decibel', gainDb: userAnswer },
		correctAnswer: exercise.correctAnswer,
		points
	};
}
