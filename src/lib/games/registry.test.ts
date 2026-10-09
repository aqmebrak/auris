import { describe, it, expect } from 'vitest';
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { CATEGORIES, GAMES, gamesByCategory } from './registry.js';

const ROUTES = join(process.cwd(), 'src/routes/games');

describe('game registry', () => {
	it('ids and hrefs are unique', () => {
		expect(new Set(GAMES.map((g) => g.id)).size).toBe(GAMES.length);
		expect(new Set(GAMES.map((g) => g.href)).size).toBe(GAMES.length);
	});

	it('every game has a route page', () => {
		for (const g of GAMES) {
			expect(existsSync(join(ROUTES, g.href.replace('/games/', ''), '+page.svelte')), g.href).toBe(
				true
			);
		}
	});

	it('every route page is registered (nothing playable is missing from the dashboard)', () => {
		const dirs = readdirSync(ROUTES, { withFileTypes: true })
			.filter((d) => d.isDirectory() && existsSync(join(ROUTES, d.name, '+page.svelte')))
			.map((d) => `/games/${d.name}`);
		expect(dirs.sort()).toEqual(GAMES.map((g) => g.href).sort());
	});

	it('groups by category, covering all games', () => {
		const grouped = gamesByCategory();
		expect(grouped.flatMap((g) => g.games)).toHaveLength(GAMES.length);
		for (const g of grouped) expect(CATEGORIES[g.category]).toBeDefined();
	});
});
