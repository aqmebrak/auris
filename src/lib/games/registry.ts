/**
 * Every playable game, in one place. The dashboard, progress stats and tests
 * read from here — add a new game by appending an entry (and its route).
 */

export type GameCategory = 'eq' | 'dynamics' | 'space' | 'level';

export interface GameInfo {
	/** Stats namespace (`auris:stats:{id}`) — the id each game passes to its controller. */
	id: string;
	title: string;
	description: string;
	href: string;
	category: GameCategory;
}

export const CATEGORIES: Record<GameCategory, { label: string; blurb: string }> = {
	eq: { label: 'EQ & Filters', blurb: 'Frequency, tone and filtering' },
	dynamics: { label: 'Dynamics', blurb: 'Compression behaviour' },
	space: { label: 'Stereo & Space', blurb: 'Panning, width and phase' },
	level: { label: 'Level', blurb: 'Gain and balance' }
};

export const GAMES: GameInfo[] = [
	{
		id: 'freq-id',
		title: 'Frequency ID',
		description: 'Identify the boosted or cut frequency',
		href: '/games/frequency-id',
		category: 'eq'
	},
	{
		id: 'eq-matching',
		title: 'EQ Matching',
		description: 'Match the EQ curve by ear',
		href: '/games/eq-matching',
		category: 'eq'
	},
	{
		id: 'eq-guess',
		title: 'EQ Guess',
		description: 'Identify which EQ was applied by ear',
		href: '/games/eq-guess',
		category: 'eq'
	},
	{
		id: 'filter-finder',
		title: 'Filter Finder',
		description: 'Find the cutoff of a high-pass or low-pass filter',
		href: '/games/filter-finder',
		category: 'eq'
	},
	{
		id: 'dynamics',
		title: 'Dynamics',
		description: 'Detect compression, then identify ratio, attack and release',
		href: '/games/dynamics',
		category: 'dynamics'
	},
	{
		id: 'panning',
		title: 'Panning',
		description: 'Guess where the signal is panned in the stereo field',
		href: '/games/panning',
		category: 'space'
	},
	{
		id: 'stereo-width',
		title: 'Stereo Width',
		description: 'Judge how much wider or narrower the stereo image has been made',
		href: '/games/stereo-width',
		category: 'space'
	},
	{
		id: 'phase-comb',
		title: 'Phase / Comb',
		description: 'Hear comb filtering and polarity-flipped copies',
		href: '/games/phase-comb',
		category: 'space'
	},
	{
		id: 'db-change',
		title: 'Level Change',
		description: 'Identify how much gain was applied to the signal',
		href: '/games/db-change',
		category: 'level'
	}
];

export function gamesByCategory(): { category: GameCategory; games: GameInfo[] }[] {
	return (Object.keys(CATEGORIES) as GameCategory[])
		.map((category) => ({ category, games: GAMES.filter((g) => g.category === category) }))
		.filter((g) => g.games.length > 0);
}
