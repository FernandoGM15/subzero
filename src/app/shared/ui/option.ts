/** Primitive option values shared by selection controls. */
export type SelectValue = string | number;

/**
 * Common option shape for Select and Autocomplete.
 *
 * The default permits null-valued Select options. Autocomplete should use
 * `SelectOption<SelectValue>` so a selected option always has a concrete value.
 */
export interface SelectOption<TValue extends SelectValue | null = SelectValue | null> {
  readonly value: TValue;
  readonly label: string;
  readonly disabled?: boolean;
}
