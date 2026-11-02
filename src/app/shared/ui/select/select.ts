import {
  Component,
  ElementRef,
  booleanAttribute,
  computed,
  input,
  linkedSignal,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import type { FormValueControl } from '@angular/forms/signals';
import { IconChevronDown, TablerIconComponent } from '@tabler/icons-angular';
import { Combobox, ComboboxPopup } from '@angular/aria/combobox';
import { CdkConnectedOverlay, type ConnectedPosition } from '@angular/cdk/overlay';
import { FieldContainer } from '../field-container';
import { OptionPanel } from '../option-panel';
import type { SelectOption, SelectValue } from '../option';
import { CONTROL, FIELD_HOST_CLASSES, type ControlSize } from '../sizing';

export type { SelectOption, SelectValue } from '../option';

let nextSelectId = 0;

@Component({
  selector: 'app-select',
  imports: [
    FieldContainer,
    TablerIconComponent,
    Combobox,
    ComboboxPopup,
    CdkConnectedOverlay,
    OptionPanel,
  ],
  host: {
    class: FIELD_HOST_CLASSES + ' cursor-pointer',
    '[style.width]': 'width()',
    '[style.max-width]': "'100%'",
  },
  template: `
    <app-field-container
      #field
      [controlId]="controlId"
      [label]="label()"
      [size]="size()"
      [floating]="floating()"
      [disabled]="disabled()"
      [required]="required()"
      controlCursor="pointer"
      [helperText]="helperText()"
      [error]="error()"
      [reserveMessageSpace]="reserveMessageSpace()"
    >
      <button
        #nativeTrigger
        #combobox="ngCombobox"
        ngCombobox
        type="button"
        [id]="controlId"
        [class]="triggerClasses()"
        [style.cursor]="disabled() ? 'not-allowed' : 'pointer'"
        [disabled]="disabled()"
        [softDisabled]="false"
        [preserveContent]="true"
        [(expanded)]="expanded"
        [attr.aria-label]="label()"
        [attr.aria-required]="required() ? 'true' : null"
        [attr.aria-invalid]="error() ? 'true' : null"
        [attr.aria-describedby]="field.describedBy()"
        (focus)="focused.set(true)"
        (blur)="onBlur($event)"
        (keydown.tab)="close()"
      >
        <span
          data-selected-value
          class="col-start-1 row-start-1 truncate"
          [class.invisible]="!floating()"
        >
          {{ displayLabel() }}
        </span>
        <span
          data-option-sizer
          aria-hidden="true"
          class="pointer-events-none invisible col-start-1 row-start-1 h-0 overflow-hidden"
        >
          @for (option of options(); track option.value) {
            <span class="block">{{ option.label }}</span>
          }
        </span>
        <tabler-icon
          class="col-start-2 row-start-1 grid place-items-center"
          [icon]="chevronDownIcon"
          [size]="24"
          [svgAttributes]="{ 'aria-hidden': 'true', focusable: 'false' }"
        />
      </button>
    </app-field-container>
    <ng-template
      [cdkConnectedOverlay]="{
        origin: combobox.element,
        matchWidth: true,
        usePopover: 'inline',
        positions: positions,
        viewportMargin: 8,
        flexibleDimensions: true,
        push: true,
      }"
      [cdkConnectedOverlayOpen]="expanded()"
      (overlayOutsideClick)="close()"
      (detach)="close()"
    >
      <ng-template ngComboboxPopup [combobox]="combobox">
        <app-option-panel
          [options]="renderedOptions()"
          [selectedTokens]="selectedTokens()"
          [accessibleLabel]="label()"
          [size]="size()"
          (optionSelected)="commit($event)"
          (panelBlur)="onBlur($event)"
        />
      </ng-template>
    </ng-template>
  `,
})
export class Select implements FormValueControl<SelectValue | null> {
  protected readonly chevronDownIcon = IconChevronDown;
  readonly label = input.required<string>();
  readonly options = input<readonly SelectOption[]>([]);
  readonly value = model<SelectValue | null>(null);
  readonly width = input('100%');
  readonly size = input<ControlSize>('md');
  readonly helperText = input<string>();
  readonly error = input<string>();
  readonly reserveMessageSpace = input(true, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly required = input(false, { transform: booleanAttribute });
  readonly touch = output<void>();

  protected readonly controlId = `subzero-select-${nextSelectId++}`;
  protected readonly focused = signal(false);
  protected readonly expanded = linkedSignal(() => {
    this.disabled();
    return false;
  });
  protected readonly floating = computed(
    () => this.focused() || this.expanded() || this.value() !== null,
  );
  protected readonly renderedOptions = computed(() =>
    this.options().map((option) => ({
      ...option,
      token: option.value === null ? 'null:' : `${typeof option.value}:${option.value}`,
    })),
  );
  protected readonly selectedTokens = computed(() => {
    const option = this.renderedOptions().find((item) => item.value === this.value());
    return option ? [option.token] : [];
  });
  protected readonly displayLabel = computed(() => {
    const option = this.options().find((item) => item.value === this.value());
    return option?.label ?? '';
  });
  protected readonly positions: ConnectedPosition[] = [
    { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 4 },
    { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetY: -4 },
  ];
  protected readonly triggerClasses = computed(() => {
    const tokens = CONTROL[this.size()];
    return [
      'grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-control bg-transparent text-left text-foreground outline-none disabled:cursor-not-allowed',
      tokens.height,
      tokens.paddingX,
      'pe-2',
      tokens.text,
      tokens.icon,
    ].join(' ');
  });
  private readonly trigger = viewChild.required<ElementRef<HTMLButtonElement>>('nativeTrigger');
  private readonly optionPanel = viewChild(OptionPanel);

  focus(options?: FocusOptions): void {
    this.trigger().nativeElement.focus(options);
  }
  protected close(): void {
    this.expanded.set(false);
  }
  protected commit(token: unknown): void {
    const option = this.renderedOptions().find((item) => item.token === token);
    if (this.disabled() || !option || option.disabled) return;
    this.value.set(option.value);
    this.close();
  }
  protected onBlur(event: FocusEvent): void {
    const next = event.relatedTarget as Node | null;
    if (next && (this.trigger().nativeElement.contains(next) || this.optionPanel()?.contains(next)))
      return;
    this.focused.set(false);
    this.close();
    this.touch.emit();
  }
}
