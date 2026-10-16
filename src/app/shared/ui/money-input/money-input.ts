import {
  Component,
  ElementRef,
  booleanAttribute,
  computed,
  effect,
  input,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import type { FormValueControl } from '@angular/forms/signals';
import { CONTROL, FIELD_HOST_CLASSES, type ControlSize } from '../sizing';
import { FieldContainer } from '../field-container';

let nextInputId = 0;

@Component({
  selector: 'app-money-input',
  imports: [FieldContainer],
  host: { class: FIELD_HOST_CLASSES },
  template: `
    <app-field-container
      #field
      [controlId]="controlId"
      [label]="label()"
      [size]="size()"
      [floating]="floating()"
      [disabled]="disabled()"
      [required]="required()"
      [helperText]="helperText()"
      [error]="error()"
      [reserveMessageSpace]="reserveMessageSpace()"
    >
      <input
        #nativeInput
        [id]="controlId"
        type="text"
        inputmode="decimal"
        [class]="inputClasses()"
        [value]="text()"
        [placeholder]="floating() ? (placeholder() ?? '') : ''"
        [disabled]="disabled()"
        [readOnly]="readonly()"
        [required]="required()"
        [attr.aria-required]="required() ? 'true' : null"
        [attr.aria-invalid]="error() ? 'true' : null"
        [attr.aria-describedby]="field.describedBy()"
        (beforeinput)="onBeforeInput($event)"
        (input)="onInput($event)"
        (focus)="focused.set(true)"
        (blur)="onBlur()"
      />
    </app-field-container>
  `,
})
export class MoneyInput implements FormValueControl<number | null> {
  readonly label = input.required<string>();
  readonly value = model<number | null>(null);
  readonly size = input<ControlSize>('md');
  readonly placeholder = input<string>();
  readonly helperText = input<string>();
  readonly error = input<string>();
  readonly reserveMessageSpace = input(true, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readonly = input(false, { transform: booleanAttribute });
  readonly required = input(false, { transform: booleanAttribute });
  readonly touch = output<void>();

  protected readonly controlId = `subzero-money-input-${nextInputId++}`;
  protected readonly focused = signal(false);
  protected readonly text = signal('');
  protected readonly floating = computed(() => this.focused() || this.text().length > 0);
  private lastValue: number | null = null;

  constructor() {
    effect(() => {
      const value = this.value();
      if (value !== this.lastValue) {
        this.lastValue = value;
        this.text.set(this.format(value));
      }
    });
  }

  private format(value: number | null): string {
    if (value === null || !Number.isSafeInteger(value)) return '';
    const absolute = Math.abs(value);
    return this.group(
      `${value < 0 ? '-' : ''}${Math.floor(absolute / 100)}.${String(absolute % 100).padStart(2, '0')}`,
    );
  }

  private group(text: string): string {
    const [whole, fraction] = text.split('.');
    return (
      whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (fraction === undefined ? '' : `.${fraction}`)
    );
  }

  protected onBeforeInput(event: Event): void {
    if (this.disabled() || this.readonly()) return;
    const inputEvent = event as InputEvent;
    const element = event.target as HTMLInputElement;
    const start = element.selectionStart;
    if (start === null || start !== element.selectionEnd) return;
    // Include the adjacent digit when deleting across a generated separator.
    if (inputEvent.inputType === 'deleteContentBackward' && element.value[start - 1] === ',') {
      element.setSelectionRange(start - 2, start);
    } else if (inputEvent.inputType === 'deleteContentForward' && element.value[start] === ',') {
      element.setSelectionRange(start, start + 2);
    }
  }

  private readonly nativeInput = viewChild.required<ElementRef<HTMLInputElement>>('nativeInput');

  protected readonly inputClasses = computed(() => {
    const tokens = CONTROL[this.size()];
    return [
      'block w-full rounded-control bg-transparent text-foreground outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed [&::-webkit-search-cancel-button]:appearance-none',
      tokens.height,
      tokens.paddingX,
      tokens.text,
    ].join(' ');
  });

  focus(options?: FocusOptions): void {
    this.nativeInput().nativeElement.focus(options);
  }

  protected onInput(event: Event): void {
    const element = event.target as HTMLInputElement;
    const displayed = element.value;
    const inputType = (event as InputEvent).inputType ?? '';
    const editing = inputType === 'insertText' || inputType.startsWith('delete');
    const grouped = /^-?\d{1,3}(?:,\d{3})+(?:\.\d{0,2})?$/.test(displayed);
    const text = displayed.replaceAll(',', '');
    if (
      this.disabled() ||
      this.readonly() ||
      (displayed.includes(',') && !grouped && !(editing && this.text().includes(','))) ||
      !/^-?\d*(?:\.\d{0,2})?$/.test(text)
    ) {
      element.value = this.text();
      return;
    }
    const hasDigits = /\d/.test(text);
    const [whole, fraction = ''] = text.replace('-', '').split('.');
    const absolute = Number(whole || '0') * 100 + Number(fraction.padEnd(2, '0'));
    if (!Number.isSafeInteger(absolute)) {
      element.value = this.text();
      return;
    }
    const cents = hasDigits ? (text.startsWith('-') ? -absolute : absolute) : null;
    this.lastValue = cents;
    const start = element.selectionStart ?? displayed.length;
    const end = element.selectionEnd ?? start;
    const direction = element.selectionDirection ?? 'none';
    const formatted = this.group(text);
    const mapPosition = (position: number): number => {
      const count = displayed.slice(0, position).replaceAll(',', '').length;
      if (count === 0) return 0;
      let seen = 0;
      for (let index = 0; index < formatted.length; index++) {
        if (formatted[index] !== ',' && ++seen === count) return index + 1;
      }
      return formatted.length;
    };
    this.text.set(formatted);
    element.value = formatted;
    element.setSelectionRange(mapPosition(start), mapPosition(end), direction);
    this.value.set(cents);
  }

  protected onBlur(): void {
    this.focused.set(false);
    this.text.set(this.format(this.value()));
    this.touch.emit();
  }
}
