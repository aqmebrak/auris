import { describe, it, expect } from 'vitest';
import {
	entryAccuracy,
	recommend,
	suggestDifficulty,
	summarize,
	type GameSummary
} from './stats.js';
import type { StatsHistoryEntry } from '$lib/stores/stats-store.svelte.js';

const entry = (
	over: Partial<StatsHistoryEntry> & { meta?: Record<string, unknown> }
): StatsHistoryEntry => ({
	timestamp: '2026-01-01T00:00:00.000Z',
	score: 0,
	...over
});
const at = (difficulty: string, accuracy: number, mode?: string) =>
	entry({ accuracy, meta: { difficulty, ...(mode ? { mode } : {}) } });

describe('entryAccuracy', () => {
	it('prefers the recorded accuracy', () => {
		expect(entryAccuracy(entry({ score: 1, accuracy: 73, meta: { roundCount: 5 } }))).toBe(73);
	});
	it('falls back to score / roundCount for legacy entries', () => {
		expect(entryAccuracy(entry({ score: 4, meta: { roundCount: 5 } }))).toBe(80);
	});
	it('is null when nothing can be derived', () => {
		expect(entryAccuracy(entry({ score: 3 }))).toBeNull();
	});
});

describe('summarize', () => {
	it('is empty for no history', () => {
		expect(summarize([])).toEqual({
			sessions: 0,
			recentAvg: null,
			bestAccuracy: null,
			lastPlayed: null,
			trend: []
		});
	});

	it('averages the last 5, tracks best, caps the trend at 12', () => {
		const history = Array.from({ length: 14 }, (_, i) =>
			entry({
				accuracy: i < 9 ? 100 : 50,
				timestamp: `2026-01-${String(i + 1).padStart(2, '0')}T00:00:00.000Z`
			})
		);
		const s = summarize(history);
		expect(s.sessions).toBe(14);
		expect(s.recentAvg).toBe(50);
		expect(s.bestAccuracy).toBe(100);
		expect(s.trend).toHaveLength(12);
		expect(s.lastPlayed).toBe('2026-01-14T00:00:00.000Z');
	});
});

describe('suggestDifficulty', () => {
	it('needs at least two sessions at the current difficulty', () => {
		expect(suggestDifficulty([at('medium', 100)], { difficulty: 'medium' })).toBeNull();
	});

	it('suggests harder at ≥85% over the last 3 same-difficulty sessions', () => {
		const s = suggestDifficulty(
			[at('medium', 40), at('medium', 90), at('medium', 95), at('medium', 85)],
			{ difficulty: 'medium' }
		);
		expect(s).toMatchObject({ direction: 'harder', to: 'hard', sessions: 3 });
		expect(s!.avg).toBe(90);
	});

	it('suggests easier at ≤50%', () => {
		expect(
			suggestDifficulty([at('hard', 40), at('hard', 50)], { difficulty: 'hard' })
		).toMatchObject({
			direction: 'easier',
			to: 'medium'
		});
	});

	it('does not go beyond the ends, and ignores other difficulties', () => {
		expect(
			suggestDifficulty([at('hard', 100), at('hard', 100)], { difficulty: 'hard' })
		).toBeNull();
		expect(suggestDifficulty([at('easy', 10), at('easy', 10)], { difficulty: 'easy' })).toBeNull();
		expect(
			suggestDifficulty([at('easy', 100), at('easy', 100)], { difficulty: 'medium' })
		).toBeNull();
	});

	it('keeps modes separate when a mode is given', () => {
		const history = [
			at('medium', 95, 'ratio'),
			at('medium', 95, 'ratio'),
			at('medium', 20, 'match')
		];
		expect(suggestDifficulty(history, { difficulty: 'medium', mode: 'ratio' })?.direction).toBe(
			'harder'
		);
		expect(suggestDifficulty(history, { difficulty: 'medium', mode: 'match' })).toBeNull();
	});

	it('stays quiet in the middle band', () => {
		expect(
			suggestDifficulty([at('medium', 70), at('medium', 65)], { difficulty: 'medium' })
		).toBeNull();
	});
});

describe('recommend', () => {
	const sum = (sessions: number, recentAvg: number | null): GameSummary => ({
		sessions,
		recentAvg,
		bestAccuracy: recentAvg,
		lastPlayed: null,
		trend: []
	});

	it('starts with the first unplayed game', () => {
		expect(recommend(['a', 'b', 'c'], { a: sum(3, 90), b: sum(0, null), c: sum(0, null) })).toEqual(
			{
				kind: 'start',
				gameId: 'b'
			}
		);
	});

	it('otherwise picks the weakest recent average', () => {
		expect(recommend(['a', 'b', 'c'], { a: sum(3, 90), b: sum(2, 40), c: sum(1, 70) })).toEqual({
			kind: 'weakest',
			gameId: 'b',
			avg: 40
		});
	});

	it('is null when there is nothing to base it on', () => {
		expect(recommend([], {})).toBeNull();
		expect(recommend(['a'], { a: sum(2, null) })).toBeNull();
	});
});
