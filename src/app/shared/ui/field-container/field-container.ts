import { Component, booleanAttribute, computed, input } from '@angular/core';
import { CONTROL, type ControlSize } from '../sizing';

@Component({
  selector: 'app-field-container',
  host: { class: 'block' },
  template: `
    <div [class]="wrapperClasses()">
      <ng-content />
      <label [for]="controlId()" [class]="labelClasses()" [attr.data-floating]="floating()">
        <span [class]="labelTextClasses()">
          {{ label() }}
          @if (required()) {
            <span aria-hidden="true">*</span>
          }
        </span>
      </label>
    </div>
    @if (reserveMessageSpace() || message()) {
      <p [id]="messageId()" data-message-space [class]="messageClasses()">{{ message() }}</p>
    }
  `,
})
export class FieldContainer {
  readonly controlId = input.required<string>();
  readonly label = input.required<string>();
  readonly size = input<ControlSize>('md');
  readonly floating = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly required = input(false, { transform: booleanAttribute });
  readonly controlCursor = input<'text' | 'pointer'>('text');
  readonly helperText = input<string>();
  readonly error = input<string>();
  readonly reserveMessageSpace = input(true, { transform: booleanAttribute });
  protected readonly messageId = computed(() => `${this.controlId()}-message`);
  protected readonly message = computed(() => this.error() || this.helperText());
  readonly describedBy = computed(() => (this.message() ? this.messageId() : null));

  protected readonly wrapperClasses = computed(() =>
    [
      'relative rounded-control border bg-surface transition-colors',
      this.error()
        ? 'border-danger focus-within:border-danger'
        : 'border-border focus-within:border-ring',
      this.disabled() ? 'opacity-50 cursor-not-allowed' : '',
      this.controlCursor() === 'pointer' && !this.disabled() ? 'cursor-pointer' : '',
    ].join(' '),
  );

  protected readonly labelClasses = computed(() => {
    const tokens = CONTROL[this.size()];
    return [
      'pointer-events-none absolute inset-x-0 flex -translate-y-1/2 transition-[top] motion-reduce:transition-none',
      tokens.paddingX,
      tokens.text,
      this.floating() ? 'top-0' : 'top-1/2',
      this.error() ? 'text-danger' : 'text-muted-foreground',
    ].join(' ');
  });

  protected readonly labelTextClasses = computed(() =>
    [
      'pointer-events-auto -mx-1 origin-left bg-surface px-1 transition-transform motion-reduce:transition-none',
      this.floating() ? 'scale-75' : 'scale-100',
      this.disabled()
        ? 'cursor-not-allowed'
        : this.controlCursor() === 'pointer'
          ? 'cursor-pointer'
          : 'cursor-text',
    ].join(' '),
  );

  protected readonly messageClasses = computed(() =>
    [
      'mt-1 text-xs break-words',
      this.reserveMessageSpace() ? 'min-h-4' : '',
      this.error() ? 'text-danger' : 'text-muted-foreground',
    ].join(' '),
  );
}
