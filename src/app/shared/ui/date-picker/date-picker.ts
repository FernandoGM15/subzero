import {
  Component,
  ElementRef,
  afterRenderEffect,
  booleanAttribute,
  computed,
  effect,
  input,
  inject,
  LOCALE_ID,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import type { FormValueControl } from '@angular/forms/signals';
import { CdkConnectedOverlay, CdkOverlayOrigin } from '@angular/cdk/overlay';
import { CdkTrapFocus } from '@angular/cdk/a11y';
import {
  IconCalendar,
  IconChevronLeft,
  IconChevronRight,
  TablerIconComponent,
} from '@tabler/icons-angular';
import { FieldContainer } from '../field-container';
import { CONTROL, FIELD_HOST_CLASSES, type ControlSize } from '../sizing';
import { addDays, addMonths, calendarDate, today, validDate } from './calendar';

import {
  DATE_PICKER_DEFAULTS,
  datePickerMessages,
  type DateDisplayFormat,
  type DatePickerMessages,
} from './date-picker.config';
export type { DateDisplayFormat } from './date-picker.config';
let nextId = 0;

@Component({
  selector: 'app-date-picker',
  imports: [
    FieldContainer,
    CdkOverlayOrigin,
    CdkConnectedOverlay,
    CdkTrapFocus,
    TablerIconComponent,
  ],
  host: { class: FIELD_HOST_CLASSES },
  template: `
    <app-field-container
      #field
      class="[&_label]:whitespace-nowrap"
      [controlId]="controlId"
      [label]="label()"
      [size]="size()"
      [floating]="!!value() || expanded()"
      [disabled]="disabled()"
      [required]="required()"
      controlCursor="pointer"
      [helperText]="helperText()"
      [error]="error()"
      [reserveMessageSpace]="reserveMessageSpace()"
    >
      <button
        #trigger
        #origin="cdkOverlayOrigin"
        cdkOverlayOrigin
        type="button"
        [id]="controlId"
        [class]="triggerClasses()"
        [disabled]="disabled()"
        [attr.aria-label]="label() + (displayValue() ? ': ' + displayValue() : '')"
        aria-haspopup="dialog"
        [attr.aria-expanded]="expanded()"
        [attr.aria-controls]="expanded() ? panelId : null"
        [attr.aria-invalid]="error() ? 'true' : null"
        [attr.aria-describedby]="field.describedBy()"
        (click)="open()"
        (blur)="onTriggerBlur()"
        (keydown.arrowdown)="$event.preventDefault(); open()"
      >
        <span class="min-w-0 flex-1 truncate">{{ displayValue() }}</span>
        <tabler-icon
          [icon]="calendarIcon"
          class="shrink-0"
          [size]="18"
          svgClass="size-4"
          [svgAttributes]="{ 'aria-hidden': 'true' }"
        />
      </button>
    </app-field-container>
    <ng-template
      cdkConnectedOverlay
      [cdkConnectedOverlayOrigin]="origin"
      [cdkConnectedOverlayOpen]="expanded()"
      [cdkConnectedOverlayHasBackdrop]="true"
      cdkConnectedOverlayBackdropClass="cdk-overlay-transparent-backdrop"
      [cdkConnectedOverlayPush]="true"
      [cdkConnectedOverlayViewportMargin]="8"
      (backdropClick)="close()"
      (detach)="close(false)"
      (overlayKeydown)="onOverlayKeydown($event)"
    >
      <div
        #panel
        role="dialog"
        aria-modal="true"
        [id]="panelId"
        [attr.aria-label]="label()"
        cdkTrapFocus
        [cdkTrapFocusAutoCapture]="true"
        class="mt-1 w-72 max-w-[calc(100vw-1rem)] rounded-control border border-border bg-surface p-3 text-foreground shadow-lg"
      >
        <div class="mb-3 flex items-center justify-between gap-2">
          <button
            type="button"
            [attr.aria-label]="translatedMessages().previousMonth"
            [disabled]="!canMoveMonth(-1)"
            class="rounded-control p-1 transition-colors enabled:cursor-pointer enabled:hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-40"
            (click)="moveMonth(-1)"
          >
            <tabler-icon
              [icon]="previousIcon"
              [size]="18"
              [svgAttributes]="{ 'aria-hidden': 'true' }"
            />
          </button>
          <h2 aria-live="polite" class="text-sm font-medium">{{ monthLabel() }}</h2>
          <button
            type="button"
            [attr.aria-label]="translatedMessages().nextMonth"
            [disabled]="!canMoveMonth(1)"
            class="rounded-control p-1 transition-colors enabled:cursor-pointer enabled:hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-40"
            (click)="moveMonth(1)"
          >
            <tabler-icon
              [icon]="nextIcon"
              [size]="18"
              [svgAttributes]="{ 'aria-hidden': 'true' }"
            />
          </button>
        </div>
        <table
          role="grid"
          [attr.aria-label]="monthLabel()"
          class="w-full table-fixed border-separate border-spacing-0.5"
        >
          <thead>
            <tr>
              @for (weekday of weekdays(); track $index) {
                <th
                  scope="col"
                  [abbr]="weekday.full"
                  class="pb-2 text-xs font-normal text-muted-foreground"
                >
                  {{ weekday.short }}
                </th>
              }
            </tr>
          </thead>
          <tbody>
            @for (week of weeks(); track $index) {
              <tr>
                @for (date of week; track $index) {
                  <td
                    [attr.aria-selected]="date && date === value() ? 'true' : null"
                    class="p-0 text-center"
                  >
                    @if (date) {
                      <button
                        type="button"
                        [attr.data-date]="date"
                        [attr.aria-label]="dayLabel(date)"
                        [disabled]="!allowed(date)"
                        [tabIndex]="date === active() ? 0 : -1"
                        [attr.aria-current]="date === currentDate ? 'date' : null"
                        [class]="dayClasses(date)"
                        (click)="select(date)"
                        (keydown)="onDayKeydown($event, date)"
                      >
                        {{ +date.slice(8) }}
                      </button>
                    }
                  </td>
                }
              </tr>
            }
          </tbody>
        </table>
        <p class="sr-only">{{ translatedMessages().keyboardHelp }}</p>
      </div>
    </ng-template>
  `,
})
export class DatePicker implements FormValueControl<string> {
  private readonly defaults = inject(DATE_PICKER_DEFAULTS);
  readonly label = input.required<string>();
  readonly value = model('');
  readonly displayFormat = input<DateDisplayFormat>(this.defaults.displayFormat ?? 'dd/MM/yyyy');
  readonly locale = input(inject(LOCALE_ID));
  readonly messages = input<Partial<DatePickerMessages>>({});
  protected readonly translatedMessages = computed(() => ({
    ...datePickerMessages(this.locale()),
    ...this.defaults.messages,
    ...this.messages(),
  }));
  readonly min = input<string>();
  readonly max = input<string>();
  readonly size = input<ControlSize>('md');
  readonly helperText = input<string>();
  readonly error = input<string>();
  readonly reserveMessageSpace = input(true, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readonly = input(false, { transform: booleanAttribute });
  readonly required = input(false, { transform: booleanAttribute });
  readonly touch = output<void>();
  protected readonly controlId = `subzero-date-picker-${nextId++}`;
  protected readonly panelId = `${this.controlId}-panel`;
  protected readonly calendarIcon = IconCalendar;
  protected readonly previousIcon = IconChevronLeft;
  protected readonly nextIcon = IconChevronRight;
  protected readonly currentDate = today();
  protected readonly expanded = signal(false);
  protected readonly active = signal(this.currentDate);
  private readonly trigger = viewChild.required<ElementRef<HTMLButtonElement>>('trigger');
  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');
  private readonly lower = computed(() =>
    validDate(this.min() ?? '') ? this.min()! : '0001-01-01',
  );
  private readonly upper = computed(() =>
    validDate(this.max() ?? '') ? this.max()! : '9999-12-31',
  );
  protected readonly displayValue = computed(() => {
    const value = this.value();
    if (!validDate(value)) return '';
    const [year, month, day] = value.split('-');
    return this.displayFormat().replace('yyyy', year).replace('MM', month).replace('dd', day);
  });
  protected readonly triggerClasses = computed(() => {
    const tokens = CONTROL[this.size()];
    return `flex w-full items-center gap-2 rounded-control bg-transparent text-left outline-none disabled:cursor-not-allowed ${tokens.height} ${tokens.paddingX} ${tokens.text}`;
  });
  protected readonly monthLabel = computed(() =>
    new Intl.DateTimeFormat(this.locale(), {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(calendarDate(this.active())),
  );
  protected readonly weekdays = computed(() =>
    Array.from({ length: 7 }, (_, index) => {
      const date = calendarDate(addDays('2026-10-11', index));
      return {
        short: new Intl.DateTimeFormat(this.locale(), { weekday: 'short', timeZone: 'UTC' }).format(
          date,
        ),
        full: new Intl.DateTimeFormat(this.locale(), { weekday: 'long', timeZone: 'UTC' }).format(
          date,
        ),
      };
    }),
  );
  protected readonly weeks = computed(() => {
    const first = `${this.active().slice(0, 7)}-01`;
    const offset = calendarDate(first).getUTCDay();
    const days = calendarDate(addMonths(first, 1)).getTime() - calendarDate(first).getTime();
    const count = Math.round(days / 86400000);
    return Array.from({ length: Math.ceil((offset + count) / 7) }, (_, row) =>
      Array.from({ length: 7 }, (_, column) => {
        const day = row * 7 + column - offset + 1;
        return day > 0 && day <= count ? `${first.slice(0, 8)}${String(day).padStart(2, '0')}` : '';
      }),
    );
  });

  constructor() {
    afterRenderEffect(() => {
      const active = this.active();
      if (this.expanded())
        this.panel()
          ?.nativeElement.querySelector<HTMLButtonElement>(`[data-date="${active}"]`)
          ?.focus();
    });
    effect(() => {
      if (this.expanded() && (this.disabled() || this.readonly() || this.lower() > this.upper()))
        this.close();
      if (this.expanded() && !this.allowed(this.active()))
        this.active.set(this.clamp(this.active()));
    });
  }

  focus(options?: FocusOptions): void {
    this.trigger().nativeElement.focus(options);
  }
  protected allowed(date: string): boolean {
    return validDate(date) && date >= this.lower() && date <= this.upper();
  }
  private clamp(date: string): string {
    return date < this.lower() ? this.lower() : date > this.upper() ? this.upper() : date;
  }
  protected open(): void {
    if (this.disabled() || this.readonly() || this.lower() > this.upper() || this.expanded())
      return;
    this.active.set(this.clamp(validDate(this.value()) ? this.value() : today()));
    this.expanded.set(true);
  }
  protected close(restore = true): void {
    if (!this.expanded()) return;
    this.expanded.set(false);
    if (restore && !this.disabled()) this.focus();
    this.touch.emit();
  }
  protected onTriggerBlur(): void {
    if (!this.expanded()) this.touch.emit();
  }
  protected select(date: string): void {
    if (this.disabled() || this.readonly() || !this.allowed(date)) return;
    this.value.set(date);
    this.close();
  }
  protected canMoveMonth(amount: number): boolean {
    const target = addMonths(this.active(), amount);
    return (
      validDate(target) &&
      target.slice(0, 7) >= this.lower().slice(0, 7) &&
      target.slice(0, 7) <= this.upper().slice(0, 7)
    );
  }
  protected moveMonth(amount: number): void {
    if (this.canMoveMonth(amount)) this.active.set(this.clamp(addMonths(this.active(), amount)));
  }
  protected dayLabel(date: string): string {
    return new Intl.DateTimeFormat(this.locale(), { dateStyle: 'full', timeZone: 'UTC' }).format(
      calendarDate(date),
    );
  }
  protected dayClasses(date: string): string {
    return (
      'h-8 w-full rounded-control text-sm outline-none transition-colors enabled:cursor-pointer focus-visible:outline-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-30 ' +
      (date === this.value()
        ? 'bg-primary text-primary-foreground enabled:hover:bg-primary-hover'
        : 'enabled:hover:bg-surface-muted')
    );
  }
  protected onOverlayKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.close();
    }
  }
  protected onDayKeydown(event: KeyboardEvent, date: string): void {
    const day = calendarDate(date).getUTCDay();
    let target: string;
    switch (event.key) {
      case 'ArrowLeft':
        target = addDays(date, -1);
        break;
      case 'ArrowRight':
        target = addDays(date, 1);
        break;
      case 'ArrowUp':
        target = addDays(date, -7);
        break;
      case 'ArrowDown':
        target = addDays(date, 7);
        break;
      case 'Home':
        target = addDays(date, -day);
        break;
      case 'End':
        target = addDays(date, 6 - day);
        break;
      case 'PageUp':
        target = addMonths(date, event.shiftKey ? -12 : -1);
        break;
      case 'PageDown':
        target = addMonths(date, event.shiftKey ? 12 : 1);
        break;
      default:
        return;
    }
    event.preventDefault();
    if (validDate(target)) this.active.set(this.clamp(target));
  }
}
