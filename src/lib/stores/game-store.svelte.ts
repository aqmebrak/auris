/**
 * Reactive game session store — Svelte 5 rune-based factory.
 * Wraps a pure `GameSession<TRound>` in `$state` and exposes transition methods
 * backed by the pure helpers in `$lib/game/session.ts`.
 */

import {
	createSession,
	nextRound as nextRoundPure,
	scoreSession,
	startRound as startRoundPure,
	submitGuess as submitGuessPure
} from '$lib/game/session.js';
import type { GameConfig, GameSession, Phase, RoundBase } from '$lib/game/types.js';

export function createGameStore<TR extends RoundBase<TG>, TG>(config: GameConfig<TR, TG>) {
	let session = $state<GameSession<TR>>(createSession(config));

	return {
		get session(): GameSession<TR> {
			return session;
		},
		get phase(): Phase {
			return session.phase;
		},
		get currentRound(): TR {
			return session.rounds[session.currentRound];
		},
		get roundIndex(): number {
			return session.currentRound;
		},
		get totalRounds(): number {
			return config.roundCount;
		},
		get score(): number {
			return scoreSession(session);
		},
		get isLastRound(): boolean {
			return session.currentRound >= config.roundCount - 1;
		},
		start(): void {
			session = startRoundPure(session);
		},
		submit(guess: TG): void {
			session = submitGuessPure(session, config, guess);
		},
		next(): void {
			session = nextRoundPure(session, config);
		},
		reset(): void {
			session = createSession(config);
		}
	};
}

export type GameStore<TR extends RoundBase<TG>, TG> = ReturnType<typeof createGameStore<TR, TG>>;
