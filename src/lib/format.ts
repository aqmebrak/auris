export function formatFreq(hz: number): string {
	if (hz >= 1000) return `${(hz / 1000).toFixed(1)} kHz`;
	return `${Math.round(hz)} Hz`;
}

/** Format attack/release time in ms (short). */
export function formatAttack(ms: number): string {
	return ms < 1 ? `${ms} ms` : `${ms} ms`;
}
export function formatRelease(ms: number): string {
	return ms >= 1000 ? `${ms / 1000} s` : `${ms} ms`;
}
export function formatRatio(r: number): string {
	return r >= 20 ? '∞:1' : `${r}:1`;
}
export function formatMakeup(db: number): string {
	return db === 0 ? '0 dB' : `+${db} dB`;
}

/** Format a dB value as "+6 dB", "-3 dB", "0 dB". */
export function formatDb(db: number): string {
	if (db === 0) return '0 dB';
	return `${db > 0 ? '+' : ''}${db} dB`;
}

/** Format a pan value (-1 to +1) as "L50", "C", "R75" etc. */
export function formatPan(pan: number): string {
	if (Math.abs(pan) < 0.01) return 'C';
	const side = pan < 0 ? 'L' : 'R';
	return `${side}${Math.round(Math.abs(pan) * 100)}`;
}
