import {
  Component,
  ElementRef,
  afterRenderEffect,
  computed,
  inject,
  input,
  output,
  viewChild,
  viewChildren,
} from '@angular/core';
import { ComboboxWidget } from '@angular/aria/combobox';
import { Listbox, Option as AriaOption } from '@angular/aria/listbox';
import { CONTROL, type ControlSize } from '../sizing';

interface OptionPanelItem {
  readonly token: string;
  readonly label: string;
  readonly disabled?: boolean;
}

@Component({
  selector: 'app-option-panel',
  imports: [ComboboxWidget, Listbox, AriaOption],
  host: { '[style.display]': "'block'", '[style.width]': "'100%'" },
  template: `
    <div
      #panel
      #listbox="ngListbox"
      ngListbox
      ngComboboxWidget
      [class]="panelClasses()"
      [attr.aria-label]="accessibleLabel()"
      [attr.aria-hidden]="pending() ? 'true' : null"
      focusMode="activedescendant"
      selectionMode="explicit"
      [softDisabled]="false"
      [tabindex]="-1"
      [value]="selectedTokens()"
      [activeDescendant]="listbox.activeDescendant()"
      (scroll)="panelScroll.emit($event)"
      (keydown)="onPanelKeydown($event)"
      (mousedown)="$event.preventDefault()"
      (focusout)="onPanelFocusout($event)"
    >
      @for (option of options(); track option.token) {
        <div
          ngOption
          [value]="option.token"
          [label]="option.label"
          [disabled]="option.disabled ?? false"
          [class]="optionClasses()"
          [class.opacity-50]="option.disabled"
          (click)="optionSelected.emit(option.token)"
          (keydown.enter)="$event.preventDefault(); optionSelected.emit(option.token)"
          (keydown.space)="$event.preventDefault(); optionSelected.emit(option.token)"
        >
          {{ option.label }}
        </div>
      }
    </div>
  `,
})
export class OptionPanel {
  readonly options = input<readonly OptionPanelItem[]>([]);
  readonly selectedTokens = input<string[]>([]);
  readonly accessibleLabel = input.required<string>();
  readonly size = input<ControlSize>('md');
  readonly pending = input(false);
  readonly optionSelected = output<string>();
  readonly panelScroll = output<Event>();
  readonly panelBlur = output<FocusEvent>();

  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');
  private readonly listbox = viewChild(Listbox);
  private readonly ariaOptions = viewChildren(AriaOption);

  protected readonly panelClasses = computed(() =>
    [
      'w-full text-foreground outline-none',
      this.pending()
        ? 'pointer-events-none invisible h-0 max-h-0 overflow-hidden border-0 p-0 shadow-none'
        : 'max-h-64 overflow-y-auto rounded-control border border-border bg-surface p-1 shadow-lg',
      CONTROL[this.size()].text,
    ].join(' '),
  );
  protected readonly optionClasses = computed(() =>
    [
      'flex cursor-pointer items-center rounded-control outline-none hover:bg-primary/10 data-[active=true]:outline data-[active=true]:outline-1 data-[active=true]:outline-ring/40 data-[active=true]:outline-offset-[-1px] aria-selected:bg-primary/10 aria-selected:text-primary aria-disabled:cursor-not-allowed aria-disabled:hover:bg-transparent',
      CONTROL[this.size()].height,
      CONTROL[this.size()].paddingX,
    ].join(' '),
  );

  constructor() {
    afterRenderEffect(() => {
      this.options();
      const active = this.listbox()?.activeDescendant();
      if (!active) return;
      this.panel()
        ?.nativeElement.querySelector<HTMLElement>(`[id="${active}"]`)
        ?.scrollIntoView?.({ block: 'nearest' });
    });
  }

  protected onPanelKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const active = this.ariaOptions().find((option) => option.active());
    if (active) {
      event.preventDefault();
      this.optionSelected.emit(active.value());
    }
  }

  contains(node: Node): boolean {
    return this.host.nativeElement.contains(node);
  }

  protected onPanelFocusout(event: FocusEvent): void {
    const next = event.relatedTarget as Node | null;
    if (next && this.host.nativeElement.contains(next)) return;
    this.panelBlur.emit(event);
  }
}
