export function formatFreq(hz: number): string {
	if (hz >= 1000) return `${(hz / 1000).toFixed(1)} kHz`;
	return `${Math.round(hz)} Hz`;
}

/** Format a pan value (-1 to +1) as "L50", "C", "R75" etc. */
export function formatPan(pan: number): string {
	if (Math.abs(pan) < 0.01) return 'C';
	const side = pan < 0 ? 'L' : 'R';
	return `${side}${Math.round(Math.abs(pan) * 100)}`;
}
