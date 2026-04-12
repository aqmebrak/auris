/**
 * Helper for defining a `GameConfig` with full type inference.
 *
 * Usage:
 *   const config = defineGame<FreqIdRound, number>({
 *     id: 'freq-id',
 *     roundCount: 5,
 *     generateRound: () => ({ ... }),
 *     evaluateGuess: (round, guess) => ...
 *   });
 */

import type { GameConfig, RoundBase } from './types.js';

export function defineGame<TR extends RoundBase<TG>, TG>(
	config: GameConfig<TR, TG>
): GameConfig<TR, TG> {
	return config;
}
