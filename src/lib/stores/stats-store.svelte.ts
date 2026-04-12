/**
 * Per-game stats persistence. Namespaced by `gameId` in localStorage under
 * key `auris:stats:{gameId}`. SSR-safe.
 */

export interface StatsHistoryEntry {
	timestamp: string;
	score: number;
	/** Game-specific extra data (e.g. per-round results for heatmaps). */
	meta?: Record<string, unknown>;
}

export interface GameStats {
	gamesPlayed: number;
	bestScore: number;
	lastPlayed: string | null;
	history: StatsHistoryEntry[];
}

const defaults: GameStats = {
	gamesPlayed: 0,
	bestScore: 0,
	lastPlayed: null,
	history: []
};

function storageKey(gameId: string): string {
	return `auris:stats:${gameId}`;
}

function load(gameId: string): GameStats {
	if (typeof window === 'undefined') return { ...defaults, history: [] };
	try {
		const raw = localStorage.getItem(storageKey(gameId));
		if (!raw) return { ...defaults, history: [] };
		const parsed = JSON.parse(raw) as GameStats;
		if (
			typeof parsed.gamesPlayed !== 'number' ||
			typeof parsed.bestScore !== 'number' ||
			(parsed.lastPlayed !== null && typeof parsed.lastPlayed !== 'string') ||
			!Array.isArray(parsed.history)
		) {
			return { ...defaults, history: [] };
		}
		return parsed;
	} catch {
		return { ...defaults, history: [] };
	}
}

function persist(gameId: string, stats: GameStats): void {
	if (typeof window === 'undefined') return;
	try {
		localStorage.setItem(storageKey(gameId), JSON.stringify(stats));
	} catch {
		// quota exceeded or private mode — silently drop
	}
}

function nowIso(): string {
	return new Date().toISOString();
}

export function createStatsStore(gameId: string) {
	let stats = $state<GameStats>(load(gameId));

	return {
		get stats(): GameStats {
			return stats;
		},
		get gamesPlayed(): number {
			return stats.gamesPlayed;
		},
		get bestScore(): number {
			return stats.bestScore;
		},
		get lastPlayed(): string | null {
			return stats.lastPlayed;
		},
		get history(): StatsHistoryEntry[] {
			return stats.history;
		},
		/** Refreshes state from localStorage — call after `browser` becomes true. */
		refresh(): void {
			stats = load(gameId);
		},
		/** Appends a completed session and updates aggregates. */
		record(score: number, meta?: Record<string, unknown>): void {
			const timestamp = nowIso();
			stats = {
				gamesPlayed: stats.gamesPlayed + 1,
				bestScore: Math.max(stats.bestScore, score),
				lastPlayed: timestamp,
				history: [...stats.history, { timestamp, score, ...(meta ? { meta } : {}) }]
			};
			persist(gameId, stats);
		},
		reset(): void {
			stats = { ...defaults, history: [] };
			persist(gameId, stats);
		}
	};
}

export type StatsStore = ReturnType<typeof createStatsStore>;
