export type AurisStats = {
	sessionsPlayed: number;
	bestScore: number;
	lastPlayed: string | null;
	freqIdGamesPlayed: number;
	freqIdBestScore: number | null;
};

const STATS_KEY = 'auris:stats';

const FREQ_ID_HISTORY_KEY = 'auris_freq_id_history';

const defaults: AurisStats = {
	sessionsPlayed: 0,
	bestScore: 0,
	lastPlayed: null,
	freqIdGamesPlayed: 0,
	freqIdBestScore: null
};

function getFreqIdStats(): { freqIdGamesPlayed: number; freqIdBestScore: number | null } {
	if (typeof window === 'undefined') return { freqIdGamesPlayed: 0, freqIdBestScore: null };
	try {
		const raw = localStorage.getItem(FREQ_ID_HISTORY_KEY);
		if (!raw) return { freqIdGamesPlayed: 0, freqIdBestScore: null };
		const history = JSON.parse(raw) as Array<{ score: number }>;
		if (!Array.isArray(history) || history.length === 0) {
			return { freqIdGamesPlayed: 0, freqIdBestScore: null };
		}
		const best = Math.max(...history.map((h) => h.score));
		return { freqIdGamesPlayed: history.length, freqIdBestScore: best };
	} catch {
		return { freqIdGamesPlayed: 0, freqIdBestScore: null };
	}
}

export function getStats(): AurisStats {
	if (typeof window === 'undefined') return { ...defaults };
	try {
		const raw = localStorage.getItem(STATS_KEY);
		const freqId = getFreqIdStats();
		if (!raw) return { ...defaults, ...freqId };
		const parsed = JSON.parse(raw) as AurisStats;
		if (
			typeof parsed.sessionsPlayed !== 'number' ||
			typeof parsed.bestScore !== 'number' ||
			(parsed.lastPlayed !== null && typeof parsed.lastPlayed !== 'string')
		) {
			return { ...defaults, ...freqId };
		}
		return { ...parsed, ...freqId };
	} catch {
		return { ...defaults };
	}
}

export function saveStats(stats: AurisStats): void {
	if (typeof window === 'undefined') return;
	localStorage.setItem(STATS_KEY, JSON.stringify(stats));
}
