/**
 * What a game's `board` snippet is told about the current state. The board is
 * rendered in *every* phase with the same structure so nothing shifts: only
 * these flags change (inputs enable, the answer is revealed).
 */
export type BoardPhase = 'idle' | 'playing' | 'result';

export interface BoardState {
	phase: BoardPhase;
	/** Inputs are live (only while playing). */
	interactive: boolean;
	/** The correct answer and the player's guess may be shown (result screen). */
	revealed: boolean;
}

export function boardState(phase: BoardPhase): BoardState {
	return { phase, interactive: phase === 'playing', revealed: phase === 'result' };
}
