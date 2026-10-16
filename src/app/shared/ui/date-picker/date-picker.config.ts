import { InjectionToken, type Provider } from '@angular/core';

export type DateDisplayFormat = 'dd/MM/yyyy' | 'MM/dd/yyyy' | 'yyyy-MM-dd';

export interface DatePickerMessages {
  readonly previousMonth: string;
  readonly nextMonth: string;
  readonly keyboardHelp: string;
}

export interface DatePickerDefaults {
  readonly displayFormat?: DateDisplayFormat;
  readonly messages?: Partial<DatePickerMessages>;
}

export const DATE_PICKER_DEFAULTS = new InjectionToken<DatePickerDefaults>('DATE_PICKER_DEFAULTS', {
  providedIn: 'root',
  factory: () => ({}),
});

export function provideDatePickerDefaults(defaults: DatePickerDefaults): Provider {
  return { provide: DATE_PICKER_DEFAULTS, useValue: defaults };
}

const ENGLISH: DatePickerMessages = {
  previousMonth: 'Previous month',
  nextMonth: 'Next month',
  keyboardHelp: 'Use arrow keys to navigate dates and Enter to select. Escape closes the calendar.',
};

const SPANISH: DatePickerMessages = {
  previousMonth: 'Mes anterior',
  nextMonth: 'Mes siguiente',
  keyboardHelp:
    'Usa las flechas para navegar entre fechas y Enter para seleccionar. Escape cierra el calendario.',
};

export function datePickerMessages(locale: string): DatePickerMessages {
  return locale.toLowerCase().split('-')[0] === 'es' ? SPANISH : ENGLISH;
}
