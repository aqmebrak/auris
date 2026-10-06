import type { Phase } from './types.js';

export type KeyAction = 'playPause' | 'modeA' | 'modeB' | 'confirm';

const INTERACTIVE = 'button, a, input, select, textarea, [role="slider"], [contenteditable]';

/**
 * Maps a keydown to a game action, or null when the key should be left alone
 * (modifiers held, focus on an interactive element, or no action for the phase).
 */
export function keyToAction(
	e: Pick<KeyboardEvent, 'key' | 'ctrlKey' | 'metaKey' | 'altKey' | 'target'>,
	phase: Phase,
	hasAB: boolean
): KeyAction | null {
	if (e.ctrlKey || e.metaKey || e.altKey) return null;
	const target = e.target as Element | null;
	if (target?.closest?.(INTERACTIVE)) return null;

	if (e.key === 'Enter') return phase === 'idle' || phase === 'roundResult' ? 'confirm' : null;
	if (phase !== 'playing') return null;
	if (e.key === ' ') return 'playPause';
	if (!hasAB) return null;
	if (e.key === 'a' || e.key === 'A') return 'modeA';
	if (e.key === 'b' || e.key === 'B') return 'modeB';
	return null;
}
