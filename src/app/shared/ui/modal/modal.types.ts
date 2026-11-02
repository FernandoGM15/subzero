import type { ZodType } from 'zod';
import type { InputType } from '../input';

export interface ModalMessageOptions {
  title: string;
  message: string;
  acceptLabel?: string;
}
export interface ModalConfirmationOptions extends ModalMessageOptions {
  cancelLabel?: string;
}
interface InputOptions<T> extends ModalConfirmationOptions {
  label: string;
  preload?: T;
  isOptional?: boolean;
  schema?: ZodType<T>;
}
export type TextModalOptions = InputOptions<string> & { type: InputType | 'date' };
export type CurrencyModalOptions = InputOptions<number | null> & { type: 'currency' };
export type ModalInputOptions = TextModalOptions | CurrencyModalOptions;
