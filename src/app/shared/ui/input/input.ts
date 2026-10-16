import {
  Component,
  ElementRef,
  booleanAttribute,
  computed,
  input,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import type { FormValueControl } from '@angular/forms/signals';
import { IconX, TablerIconComponent } from '@tabler/icons-angular';
import { CONTROL, type ControlSize } from '../sizing';
import { FieldContainer } from '../field-container';

export type InputType = 'text' | 'email' | 'password' | 'search';

let nextInputId = 0;

@Component({
  selector: 'app-input',
  imports: [FieldContainer, TablerIconComponent],
  host: { class: 'block' },
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
        [type]="type()"
        [class]="inputClasses()"
        [value]="value()"
        [placeholder]="floating() ? (placeholder() ?? '') : ''"
        [disabled]="disabled()"
        [readOnly]="readonly()"
        [required]="required()"
        [attr.aria-required]="required() ? 'true' : null"
        [attr.aria-invalid]="error() ? 'true' : null"
        [attr.aria-describedby]="field.describedBy()"
        (input)="onInput($event)"
        (focus)="focused.set(true)"
        (blur)="onBlur()"
      />
      @if (showClearButton()) {
        <button
          type="button"
          aria-label="Clear input"
          class="absolute end-2 top-1/2 -translate-y-1/2 rounded-control p-1 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          (mousedown)="$event.preventDefault()"
          (click)="clearValue()"
        >
          <tabler-icon
            [icon]="clearIcon"
            [size]="16"
            svgClass="size-4"
            [svgAttributes]="{ 'aria-hidden': 'true' }"
          />
        </button>
      }
    </app-field-container>
  `,
})
export class Input implements FormValueControl<string> {
  protected readonly clearIcon = IconX;
  readonly label = input.required<string>();
  readonly value = model('');
  readonly type = input<InputType>('text');
  readonly clearable = input(false, { transform: booleanAttribute });
  readonly size = input<ControlSize>('md');
  readonly placeholder = input<string>();
  readonly helperText = input<string>();
  readonly error = input<string>();
  readonly reserveMessageSpace = input(true, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readonly = input(false, { transform: booleanAttribute });
  readonly required = input(false, { transform: booleanAttribute });
  readonly touch = output<void>();

  protected readonly controlId = `subzero-input-${nextInputId++}`;
  protected readonly focused = signal(false);
  protected readonly showClearButton = computed(
    () => this.clearable() && this.value().length > 0 && !this.disabled() && !this.readonly(),
  );
  protected readonly floating = computed(() => this.focused() || this.value().length > 0);
  private readonly nativeInput = viewChild.required<ElementRef<HTMLInputElement>>('nativeInput');

  protected readonly inputClasses = computed(() => {
    const tokens = CONTROL[this.size()];
    return [
      'block w-full rounded-control bg-transparent text-foreground outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed [&::-webkit-search-cancel-button]:appearance-none',
      tokens.height,
      tokens.paddingX,
      this.clearable() ? 'pr-10' : '',
      tokens.text,
    ].join(' ');
  });

  focus(options?: FocusOptions): void {
    this.nativeInput().nativeElement.focus(options);
  }

  protected onInput(event: Event): void {
    this.value.set((event.target as HTMLInputElement).value);
  }

  protected clearValue(): void {
    if (!this.clearable() || this.disabled() || this.readonly()) return;
    this.value.set('');
    this.focus();
  }

  protected onBlur(): void {
    this.focused.set(false);
    this.touch.emit();
  }
}
