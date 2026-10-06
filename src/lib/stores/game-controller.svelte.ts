/**
 * Game controller — owns everything a game page used to re-implement:
 * options → store rebuild, audio lifecycle, play/pause/replay/AB, stats
 * recording on game over, keyboard shortcuts. Pages only render phases.
 */

import { browser } from '$app/environment';
import type { AbMode, Playable } from '$lib/audio/playable.js';
import { keyToAction } from '$lib/game/keys.js';
import type { GameConfig, SampleRound } from '$lib/game/types.js';
import { createGameStore } from './game-store.svelte.js';
import { createStatsStore } from './stats-store.svelte.js';

export interface GameControllerOptions<
	TR extends SampleRound<TG>,
	TG,
	TO extends { roundCount: number }
> {
	gameId: string;
	defaultOptions: TO;
	createConfig: (options: TO) => GameConfig<TR, TG>;
	audio: Playable;
	/** Applies a round's parameters to the audio engine, after its sample loaded. */
	prepareRound: (round: TR) => void;
	/** Extra data stored with the finished session (heatmaps, difficulty, …). */
	sessionMeta: (rounds: TR[], options: TO) => Record<string, unknown>;
	/** False for games without an A/B comparison. */
	hasAB?: boolean;
}

export function createGameController<
	TR extends SampleRound<TG>,
	TG,
	TO extends { roundCount: number }
>(opts: GameControllerOptions<TR, TG, TO>) {
	const { audio, hasAB = true } = opts;
	const stats = createStatsStore(opts.gameId);

	const options = $state<TO>({ ...opts.defaultOptions });
	let game = $state(createGameStore(opts.createConfig(options)));
	let isPaused = $state(true);
	let isLoading = $state(false);
	let abMode = $state<AbMode>('B');
	let isTouchDevice = $state(false);
	let recorded = false;

	function rebuild() {
		game = createGameStore(opts.createConfig(options));
		recorded = false;
	}

	/** The board stays mounted between phases; drop focus so Enter/Space shortcuts keep working. */
	function releaseFocus() {
		if (browser) (document.activeElement as HTMLElement | null)?.blur?.();
	}

	function halt() {
		audio.stop();
		isPaused = true;
	}

	function record() {
		if (recorded) return;
		recorded = true;
		stats.record(game.score, opts.sessionMeta(game.session.rounds, options), game.accuracy);
	}

	const controller = {
		stats,
		get options(): TO {
			return options;
		},
		get game() {
			return game;
		},
		get isPaused() {
			return isPaused;
		},
		get isLoading() {
			return isLoading;
		},
		get abMode() {
			return abMode;
		},
		get isTouchDevice() {
			return isTouchDevice;
		},
		hasAB,

		/** Call once from the page's init (browser only). */
		mount(): () => void {
			if (browser) {
				isTouchDevice = window.matchMedia('(pointer: coarse)').matches;
				stats.refresh();
			}
			return () => audio.destroy();
		},

		setOption<K extends keyof TO>(key: K, value: TO[K]): void {
			options[key] = value;
			rebuild();
		},

		async start(): Promise<void> {
			if (!browser || isLoading) return;
			isLoading = true;
			try {
				const round = game.currentRound;
				await audio.load(round.sampleUrl);
				opts.prepareRound(round);
				abMode = 'B';
				audio.setMode('B');
				audio.play('B');
				isPaused = false;
				game.start();
				// Decode next round's sample while the player listens
				const upcoming = game.session.rounds[game.roundIndex + 1];
				if (upcoming) audio.preload?.(upcoming.sampleUrl)?.catch(() => {});
			} finally {
				isLoading = false;
			}
		},

		playPause(): void {
			if (isPaused) audio.resume();
			else audio.pause();
			isPaused = !isPaused;
		},

		setMode(mode: AbMode): void {
			audio.setMode(mode);
			abMode = mode;
		},

		replay(): void {
			audio.play(abMode);
			isPaused = false;
		},

		submit(guess: TG): void {
			releaseFocus();
			halt();
			game.submit(guess);
		},

		next(): void {
			releaseFocus();
			halt();
			game.next();
			if (game.phase === 'gameOver') record();
		},

		playAgain(): void {
			halt();
			rebuild();
		},

		/** Wire to `<svelte:window onkeydown>`. */
		onKeydown(e: KeyboardEvent): void {
			const action = keyToAction(e, game.phase, hasAB);
			if (!action) return;
			e.preventDefault();
			if (action === 'playPause') controller.playPause();
			else if (action === 'modeA') controller.setMode('A');
			else if (action === 'modeB') controller.setMode('B');
			else if (game.phase === 'idle') void controller.start();
			else controller.next();
		}
	};

	return controller;
}

export type GameController<
	TR extends SampleRound<TG>,
	TG,
	TO extends { roundCount: number }
> = ReturnType<typeof createGameController<TR, TG, TO>>;
