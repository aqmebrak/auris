import type { ModuleId, Difficulty, ModuleScore, AnswerResult, SessionRecord } from '$lib/exercises/types.js';
import { settings } from './settings.svelte.js';

const MODULE_IDS: ModuleId[] = ['decibel', 'eq', 'panning', 'compression'];

function zeroScore(moduleId: ModuleId): ModuleScore {
	return {
		moduleId,
		totalAttempts: 0,
		correctAttempts: 0,
		currentStreak: 0,
		bestStreak: 0,
		totalPoints: 0,
		history: [],
		perDifficulty: {
			easy: { attempts: 0, correct: 0 },
			medium: { attempts: 0, correct: 0 },
			hard: { attempts: 0, correct: 0 }
		}
	};
}

function loadModules(): Record<ModuleId, ModuleScore> {
	const empty = () =>
		Object.fromEntries(MODULE_IDS.map((id) => [id, zeroScore(id)])) as Record<
			ModuleId,
			ModuleScore
		>;
	try {
		const raw = localStorage.getItem('auris_state');
		if (!raw) return empty();
		const parsed = JSON.parse(raw);
		// Schema version migration: unknown version → reset to zero scores
		if (typeof parsed.version === 'number' && parsed.version !== 1) return empty();
		const stored = parsed?.modules ?? {};
		const result = empty();
		for (const id of MODULE_IDS) {
			if (stored[id]) result[id] = stored[id];
		}
		return result;
	} catch {
		return empty();
	}
}

let modules = $state<Record<ModuleId, ModuleScore>>(loadModules());

// Single persistence effect: reads both scores and settings so it fires on any change to either.
// $effect.root() is required for module-level effects (no component context).
$effect.root(() => {
	$effect(() => {
		const snapshot = JSON.stringify({ version: 1, modules, settings: settings.value });
		localStorage.setItem('auris_state', snapshot);
	});
});

export function recordAnswer(result: AnswerResult): void {
	const mod = modules[result.moduleId];

	mod.totalAttempts += 1;

	if (result.accuracy >= 0.8) {
		mod.correctAttempts += 1;
		mod.currentStreak += 1;
		if (mod.currentStreak > mod.bestStreak) {
			mod.bestStreak = mod.currentStreak;
		}
	} else if (result.accuracy < 0.5) {
		mod.currentStreak = 0;
	}
	// 0.5 <= accuracy < 0.8: streak unchanged

	mod.totalPoints += result.points;

	const record: SessionRecord = {
		timestamp: Date.now(),
		difficulty: result.difficulty,
		attempts: 1,
		correct: result.accuracy >= 0.8 ? 1 : 0,
		points: result.points
	};
	mod.history.push(record);
	if (mod.history.length > 50) {
		mod.history = mod.history.slice(-50);
	}

	mod.perDifficulty[result.difficulty].attempts += 1;
	if (result.accuracy >= 0.8) {
		mod.perDifficulty[result.difficulty].correct += 1;
	}
}

export function getModuleScore(moduleId: ModuleId): ModuleScore {
	return modules[moduleId] ?? zeroScore(moduleId);
}

export function resetModule(moduleId: ModuleId): void {
	modules[moduleId] = zeroScore(moduleId);
}

export function getAccuracy(moduleId: ModuleId, difficulty?: Difficulty): number {
	const mod = modules[moduleId];
	if (!mod) return 0;
	if (difficulty) {
		const d = mod.perDifficulty[difficulty];
		return d.attempts === 0 ? 0 : d.correct / d.attempts;
	}
	return mod.totalAttempts === 0 ? 0 : mod.correctAttempts / mod.totalAttempts;
}

export function getLastNAccuracy(moduleId: ModuleId, n: number): number {
	const mod = modules[moduleId];
	if (!mod || mod.history.length === 0) return 0;
	const last = mod.history.slice(-n);
	const totalAttempts = last.reduce((sum, r) => sum + r.attempts, 0);
	const totalCorrect = last.reduce((sum, r) => sum + r.correct, 0);
	return totalAttempts === 0 ? 0 : totalCorrect / totalAttempts;
}

export const scores = {
	get modules() {
		return modules;
	},
	recordAnswer,
	getModuleScore,
	resetModule,
	getAccuracy,
	getLastNAccuracy
};
