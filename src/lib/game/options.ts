/** Builders for `<OptionGroup>` choices. */

export interface Choice<T> {
	value: T;
	label: string;
}

/** From a `Record<key, { label }>` config (e.g. DIFFICULTY_CONFIG). */
export function labelled<T extends string>(record: Record<T, { label: string }>): Choice<T>[] {
	return (Object.keys(record) as T[]).map((value) => ({ value, label: record[value].label }));
}

/** From plain keys, using the key itself as the label (e.g. zones). */
export function keys<T extends string>(record: Record<T, unknown>): Choice<T>[] {
	return (Object.keys(record) as T[]).map((value) => ({ value, label: value }));
}

export function numbers<T extends number>(values: readonly T[]): Choice<T>[] {
	return values.map((value) => ({ value, label: String(value) }));
}
