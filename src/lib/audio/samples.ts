/**
 * Sample picking for games. The library itself (typed manifest, filters,
 * spectrum queries) lives in `library.ts`; add files via `pnpm samples`.
 */

import { pickSample, type SampleFilter } from './library.js';

/** URL of a random library sample, optionally restricted (kind, channels, source). */
export function pickTrack(filter?: SampleFilter): string {
	return pickSample(filter).url;
}
