/**
 * Pure progress helpers over a game's stats history (see `stats-store`).
 * Handles entries recorded before graded scoring (no `accuracy`).
 */

import type { StatsHistoryEntry } from '$lib/stores/stats-store.svelte.js';

export type DifficultyName = 'easy' | 'medium' | 'hard';
const LADDER: DifficultyName[] = ['easy', 'medium', 'hard'];

/** Session accuracy 0..100, or null when it can't be derived. */
export function entryAccuracy(entry: StatsHistoryEntry): number | null {
	if (typeof entry.accuracy === 'number') return entry.accuracy;
	const rounds = entry.meta?.roundCount;
	if (typeof rounds === 'number' && rounds > 0) return Math.round((entry.score / rounds) * 100);
	return null;
}

export interface GameSummary {
	sessions: number;
	/** Mean accuracy of the last 5 sessions. */
	recentAvg: number | null;
	bestAccuracy: number | null;
	lastPlayed: string | null;
	/** Accuracies of up to the last 12 sessions, oldest → newest (for the sparkline). */
	trend: number[];
}

const mean = (xs: number[]) =>
	xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : null;

export function summarize(history: StatsHistoryEntry[]): GameSummary {
	const accuracies = history.map(entryAccuracy).filter((a): a is number => a !== null);
	return {
		sessions: history.length,
		recentAvg: mean(accuracies.slice(-5)),
		bestAccuracy: accuracies.length ? Math.max(...accuracies) : null,
		lastPlayed: history.length ? history[history.length - 1].timestamp : null,
		trend: accuracies.slice(-12)
	};
}

export interface DifficultySuggestion {
	direction: 'harder' | 'easier';
	to: DifficultyName;
	/** Mean accuracy over the sessions it is based on. */
	avg: number;
	sessions: number;
}

export const SUGGEST_HARDER_AT = 85;
export const SUGGEST_EASIER_AT = 50;

/**
 * Suggests a step up/down from the last 3 sessions played at `difficulty`
 * (and `mode`, for games with modes). Needs at least 2 such sessions.
 */
export function suggestDifficulty(
	history: StatsHistoryEntry[],
	current: { difficulty: string; mode?: string }
): DifficultySuggestion | null {
	const idx = LADDER.indexOf(current.difficulty as DifficultyName);
	if (idx < 0) return null;
	const accuracies = history
		.filter(
			(e) =>
				e.meta?.difficulty === current.difficulty &&
				(current.mode === undefined || e.meta?.mode === current.mode)
		)
		.map(entryAccuracy)
		.filter((a): a is number => a !== null)
		.slice(-3);
	if (accuracies.length < 2) return null;
	const avg = mean(accuracies)!;
	if (avg >= SUGGEST_HARDER_AT && idx < LADDER.length - 1)
		return { direction: 'harder', to: LADDER[idx + 1], avg, sessions: accuracies.length };
	if (avg <= SUGGEST_EASIER_AT && idx > 0)
		return { direction: 'easier', to: LADDER[idx - 1], avg, sessions: accuracies.length };
	return null;
}

export type Recommendation =
	{ kind: 'start'; gameId: string } | { kind: 'weakest'; gameId: string; avg: number };

/**
 * What to practise next: a game never played if any (first in registry order),
 * otherwise the one with the lowest recent average. Null with no games.
 */
export function recommend(
	order: string[],
	summaries: Record<string, GameSummary>
): Recommendation | null {
	const unplayed = order.find((id) => (summaries[id]?.sessions ?? 0) === 0);
	if (unplayed) return { kind: 'start', gameId: unplayed };
	let worst: { gameId: string; avg: number } | null = null;
	for (const id of order) {
		const avg = summaries[id]?.recentAvg;
		if (avg !== null && avg !== undefined && (!worst || avg < worst.avg))
			worst = { gameId: id, avg };
	}
	return worst ? { kind: 'weakest', ...worst } : null;
}
