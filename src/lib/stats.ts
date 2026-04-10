export type AurisStats = {
	sessionsPlayed: number;
	bestScore: number;
	lastPlayed: string | null;
};

const STATS_KEY = 'auris:stats';

const defaults: AurisStats = {
	sessionsPlayed: 0,
	bestScore: 0,
	lastPlayed: null
};

export function getStats(): AurisStats {
	if (typeof window === 'undefined') return { ...defaults };
	try {
		const raw = localStorage.getItem(STATS_KEY);
		if (!raw) return { ...defaults };
		const parsed = JSON.parse(raw) as AurisStats;
		if (
			typeof parsed.sessionsPlayed !== 'number' ||
			typeof parsed.bestScore !== 'number' ||
			(parsed.lastPlayed !== null && typeof parsed.lastPlayed !== 'string')
		) {
			return { ...defaults };
		}
		return parsed;
	} catch {
		return { ...defaults };
	}
}

export function saveStats(stats: AurisStats): void {
	if (typeof window === 'undefined') return;
	localStorage.setItem(STATS_KEY, JSON.stringify(stats));
}
