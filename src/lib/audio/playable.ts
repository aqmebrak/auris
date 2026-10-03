/**
 * Minimal audio surface the game controller drives. `AudioChain` already
 * satisfies it; custom dual-path engines (Dynamics, EQ Matching) too.
 */
export interface Playable {
	load(url: string): Promise<void>;
	play(mode?: 'A' | 'B'): void;
	stop(): void;
	pause(): void;
	resume(): void;
	setMode(mode: 'A' | 'B'): void;
	destroy(): void;
}

export type AbMode = 'A' | 'B';
