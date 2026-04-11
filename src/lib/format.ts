export function formatFreq(hz: number): string {
	if (hz >= 1000) return `${(hz / 1000).toFixed(1)} kHz`;
	return `${Math.round(hz)} Hz`;
}
