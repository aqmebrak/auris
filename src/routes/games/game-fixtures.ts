import type { Page } from '@playwright/test';

export async function clickCenter(page: Page, role: 'slider') {
	const box = (await page.getByRole(role).first().boundingBox())!;
	await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
}

export interface Game {
	name: string;
	path: string;
	hasAB: boolean;
	/** Difficulty button to click; defaults to Easy. */
	difficulty?: string;
	setup?: (page: Page) => Promise<void>;
	answer: (page: Page) => Promise<void>;
}

const dynamics = (mode: string, answer: Game['answer']): Game => ({
	name: `dynamics-${mode}`,
	path: '/games/dynamics',
	hasAB: true,
	setup: (page: Page) => page.getByRole('button', { name: mode, exact: true }).click(),
	answer
});
const clickFirst = (name: RegExp) => (page: Page) =>
	page.getByRole('button', { name }).first().click();

export const GAMES: Game[] = [
	dynamics('Detect', clickFirst(/^Clip 1$/)),
	dynamics('Ratio', clickFirst(/^(\d+(\.\d+)?|∞):1$/)),
	dynamics('Attack', clickFirst(/^\d+ ms$/)),
	dynamics('Release', clickFirst(/^\d+ ms$/)),
	dynamics('Match', (page: Page) => page.getByRole('button', { name: 'SUBMIT' }).click()),
	{
		name: 'freq-id-easy-buttons',
		path: '/games/frequency-id',
		hasAB: true,
		answer: clickFirst(/Hz$/)
	},
	{
		name: 'filter-finder-easy-buttons',
		path: '/games/filter-finder',
		hasAB: true,
		answer: clickFirst(/Hz$/)
	},
	{
		name: 'filter-finder-mixed-strip',
		path: '/games/filter-finder',
		hasAB: true,
		difficulty: 'Medium',
		setup: (page: Page) => page.getByRole('button', { name: 'Mixed', exact: true }).click(),
		answer: (page: Page) => clickCenter(page, 'slider')
	},
	{
		name: 'stereo-width',
		path: '/games/stereo-width',
		hasAB: true,
		answer: clickFirst(/^(Mono|\d+%)$/)
	},
	{
		name: 'panning-easy-buttons',
		path: '/games/panning',
		hasAB: false,
		answer: clickFirst(/^([LR]\d+|C)$/)
	},
	{
		name: 'panning-strip',
		path: '/games/panning',
		hasAB: false,
		difficulty: 'Medium',
		answer: (page: Page) => clickCenter(page, 'slider')
	},
	{
		name: 'db-change',
		path: '/games/db-change',
		hasAB: true,
		answer: (page: Page) => page.getByRole('button', { name: /dB/ }).first().click()
	},
	{
		name: 'eq-matching',
		path: '/games/eq-matching',
		hasAB: true,
		answer: (page: Page) => page.getByRole('button', { name: 'SUBMIT' }).click()
	},
	{
		name: 'eq-guess',
		path: '/games/eq-guess',
		hasAB: true,
		answer: (page: Page) => page.getByRole('button', { name: /Hz/ }).first().click()
	}
];
