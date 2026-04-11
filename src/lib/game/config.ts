export type DifficultyConfig = {
	gainRange: number;
	qMin: number;
	qMax: number;
	errorMargin: number;
};

export const DIFFICULTY_CONFIG: Record<'easy' | 'medium' | 'hard', DifficultyConfig> = {
	easy: { gainRange: 3, qMin: 0.5, qMax: 1, errorMargin: 0.15 },
	medium: { gainRange: 5, qMin: 0.5, qMax: 3, errorMargin: 0.1 },
	hard: { gainRange: 10, qMin: 0.5, qMax: 10, errorMargin: 0.05 }
};
