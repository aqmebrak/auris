import { describe, it, expect } from 'vitest';
import { keyToAction } from './keys.js';

const ev = (key: string, extra: Record<string, unknown> = {}) =>
	({ key, ctrlKey: false, metaKey: false, altKey: false, target: null, ...extra }) as never;

describe('keyToAction', () => {
	it('space toggles playback only while playing', () => {
		expect(keyToAction(ev(' '), 'playing', true)).toBe('playPause');
		expect(keyToAction(ev(' '), 'idle', true)).toBeNull();
	});

	it('A/B switch modes when the game has A/B', () => {
		expect(keyToAction(ev('a'), 'playing', true)).toBe('modeA');
		expect(keyToAction(ev('B'), 'playing', true)).toBe('modeB');
		expect(keyToAction(ev('a'), 'playing', false)).toBeNull();
	});

	it('enter confirms in idle and roundResult only', () => {
		expect(keyToAction(ev('Enter'), 'idle', true)).toBe('confirm');
		expect(keyToAction(ev('Enter'), 'roundResult', true)).toBe('confirm');
		expect(keyToAction(ev('Enter'), 'playing', true)).toBeNull();
		expect(keyToAction(ev('Enter'), 'gameOver', true)).toBeNull();
	});

	it('ignores modifier combos and interactive targets', () => {
		expect(keyToAction(ev(' ', { ctrlKey: true }), 'playing', true)).toBeNull();
		const button = { closest: () => ({}) } as unknown as Element;
		expect(keyToAction(ev(' ', { target: button }), 'playing', true)).toBeNull();
	});
});
