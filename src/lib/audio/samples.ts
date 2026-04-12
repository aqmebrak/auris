/**
 * Bundled music samples shipped with the app. Add new URLs here and any game
 * can use them through `pickTrack()` or by iterating the list directly.
 */

export const SAMPLES = [
	'/audio/568755__badoink__rockin_140.wav',
	'/audio/614732__bainmack__metal_song_short15.wav',
	'/audio/566057__badoink__industrial-metal-fusion-120.wav',
	'/audio/400993__theflakesmaster__drumbeat-120-bpm.wav',
	'/audio/535231__badoink__sex-in-the-suburbs.wav',
	'/audio/569299__badoink__rock-seq-170.wav',
	'/audio/528906__johntrap__people-that-need-housing-loop-t130.wav'
] as const;

export function pickTrack(): string {
	return SAMPLES[Math.floor(Math.random() * SAMPLES.length)];
}
