import {
  Component,
  DestroyRef,
  ElementRef,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import type { FormValueControl } from '@angular/forms/signals';
import { IconX, TablerIconComponent } from '@tabler/icons-angular';
import { Combobox, ComboboxPopup } from '@angular/aria/combobox';
import { CdkConnectedOverlay, type ConnectedPosition } from '@angular/cdk/overlay';
import { defer, finalize, type Observable, Subscription, take, timer } from 'rxjs';
import { FieldContainer } from '../field-container';
import { OptionPanel } from '../option-panel';
import type { SelectOption, SelectValue } from '../option';
import { CONTROL, FIELD_HOST_CLASSES, type ControlSize } from '../sizing';

export type AutocompleteOption = SelectOption<SelectValue>;

export interface AutocompleteRequest {
  readonly query: string;
  readonly offset: number;
  readonly limit: number;
}

export type AutocompleteFn = (
  request: AutocompleteRequest,
) => Observable<readonly AutocompleteOption[]>;

const SEARCH_DEBOUNCE_MS = 250;
const LOAD_MORE_THRESHOLD_PX = 48;

let nextAutocompleteId = 0;

function optionToken(value: SelectValue): string {
  return `${typeof value}:${value}`;
}

@Component({
  selector: 'app-autocomplete',
  imports: [
    FieldContainer,
    TablerIconComponent,
    Combobox,
    ComboboxPopup,
    CdkConnectedOverlay,
    OptionPanel,
  ],
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
        #combobox="ngCombobox"
        ngCombobox
        filterMode="manual"
        [id]="controlId"
        [value]="query()"
        [class]="inputClasses()"
        [placeholder]="floating() ? (placeholder() ?? '') : ''"
        [disabled]="disabled()"
        [attr.disabled]="disabled() ? '' : null"
        [required]="required()"
        autocomplete="off"
        [attr.aria-label]="label()"
        [attr.aria-required]="required() ? 'true' : null"
        [attr.aria-invalid]="error() ? 'true' : null"
        [attr.aria-describedby]="field.describedBy()"
        [expanded]="expanded()"
        (expandedChange)="onExpandedChange($event)"
        (valueChange)="onQueryChange($event)"
        (focus)="onFocus()"
        (blur)="onBlur($event)"
        (keydown.tab)="close()"
      />
      @if (showClearButton()) {
        <button
          type="button"
          aria-label="Clear selection"
          class="absolute end-2 top-1/2 -translate-y-1/2 rounded-control p-1 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          (mousedown)="$event.preventDefault()"
          (click)="clearSelection()"
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
          [accessibleLabel]="label() + ' options'"
          [size]="size()"
          [pending]="panelPending()"
          (optionSelected)="commit($event)"
          (panelScroll)="onPanelScroll($event)"
          (panelBlur)="onBlur($event)"
        />
      </ng-template>
    </ng-template>
  `,
})
export class Autocomplete implements FormValueControl<AutocompleteOption | null> {
  protected readonly clearIcon = IconX;
  readonly label = input.required<string>();
  readonly autocompleteFn = input.required<AutocompleteFn>();
  readonly value = model<AutocompleteOption | null>(null);
  readonly clearable = input(false, { transform: booleanAttribute });
  readonly size = input<ControlSize>('md');
  readonly limit = input(20);
  readonly placeholder = input<string>();
  readonly helperText = input<string>();
  readonly error = input<string>();
  readonly reserveMessageSpace = input(true, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly required = input(false, { transform: booleanAttribute });
  readonly touch = output<void>();
  readonly requestError = output<unknown>();

  protected readonly controlId = `subzero-autocomplete-${nextAutocompleteId++}`;
  protected readonly query = signal('');
  protected readonly options = signal<readonly AutocompleteOption[]>([]);
  protected readonly expanded = signal(false);
  protected readonly focused = signal(false);
  protected readonly showClearButton = computed(
    () => this.clearable() && this.value() !== null && !this.disabled(),
  );
  protected readonly loading = signal(false);
  protected readonly loadingMore = signal(false);
  protected readonly hasMore = signal(false);
  protected readonly hasSearched = signal(false);
  protected readonly loadError = signal(false);
  protected readonly panelPending = computed(
    () => this.options().length === 0 && (this.loading() || this.loadError()),
  );
  protected readonly floating = computed(
    () => this.focused() || this.expanded() || this.value() !== null,
  );
  protected readonly renderedOptions = computed(() =>
    this.options().map((option) => ({
      ...option,
      token: optionToken(option.value),
    })),
  );
  protected readonly selectedTokens = computed(() => {
    const option = this.renderedOptions().find((item) => item.value === this.value()?.value);
    return option ? [option.token] : [];
  });
  protected readonly positions: ConnectedPosition[] = [
    { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 4 },
    { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetY: -4 },
  ];
  protected readonly inputClasses = computed(() => {
    const tokens = CONTROL[this.size()];
    return [
      'block w-full rounded-control bg-transparent text-foreground outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed',
      tokens.height,
      tokens.paddingX,
      this.clearable() ? 'pr-10' : '',
      tokens.text,
    ].join(' ');
  });
  private readonly destroyRef = inject(DestroyRef);
  private readonly trigger = viewChild.required<ElementRef<HTMLInputElement>>('nativeInput');
  private readonly optionPanel = viewChild(OptionPanel);
  private debounceSubscription?: Subscription;
  private pageSubscription?: Subscription;
  private requestVersion = 0;
  private lastSearchQuery: string | null = null;
  private suppressFocusSearch = false;
  private nextOffset = 0;

  constructor() {
    effect(() => {
      if (!this.focused()) this.query.set(this.value()?.label ?? '');
    });
  }

  focus(options?: FocusOptions): void {
    this.trigger().nativeElement.focus(options);
  }

  protected onFocus(): void {
    this.focused.set(true);
    if (this.suppressFocusSearch) {
      this.suppressFocusSearch = false;
      return;
    }
    this.expanded.set(true);
    if (this.lastSearchQuery !== this.query()) this.scheduleSearch(this.query());
  }

  protected onExpandedChange(expanded: boolean): void {
    if (expanded && !this.hasSearched()) return;
    if (!expanded && this.panelPending()) return;
    this.expanded.set(expanded);
  }

  protected onQueryChange(query: string): void {
    if (this.disabled() || query === this.query()) return;
    this.query.set(query);
    this.value.set(null);
    this.expanded.set(true);
    this.scheduleSearch(query);
  }

  protected onPanelScroll(event: Event): void {
    const panel = event.currentTarget as HTMLElement;
    if (panel.scrollHeight <= panel.clientHeight) return;
    if (panel.scrollHeight - panel.clientHeight - panel.scrollTop <= LOAD_MORE_THRESHOLD_PX) {
      this.loadMore();
    }
  }

  protected close(): void {
    this.expanded.set(false);
  }

  protected commit(token: unknown): void {
    const option = this.options().find((item) => optionToken(item.value) === token);
    if (this.disabled() || !option || option.disabled) return;
    this.value.set(option);
    this.query.set(option.label);
    this.close();
  }

  protected clearSelection(): void {
    if (!this.clearable() || this.disabled() || this.value() === null) return;
    this.value.set(null);
    this.query.set('');
    this.debounceSubscription?.unsubscribe();
    this.pageSubscription?.unsubscribe();
    this.requestVersion++;
    this.lastSearchQuery = null;
    this.options.set([]);
    this.expanded.set(false);
    this.loading.set(false);
    this.loadingMore.set(false);
    this.hasMore.set(false);
    this.hasSearched.set(false);
    this.loadError.set(false);
    this.suppressFocusSearch = true;
    this.focus();
    this.suppressFocusSearch = false;
  }

  protected onBlur(event: FocusEvent): void {
    const next = event.relatedTarget as Node | null;
    if (
      next &&
      (this.trigger().nativeElement.contains(next) || this.optionPanel()?.contains(next))
    ) {
      return;
    }
    this.focused.set(false);
    this.close();
    if (this.value() === null) this.query.set('');
    this.touch.emit();
  }

  private scheduleSearch(query: string): void {
    this.requestVersion++;
    const version = this.requestVersion;
    this.debounceSubscription?.unsubscribe();
    this.pageSubscription?.unsubscribe();
    this.lastSearchQuery = query;
    this.nextOffset = 0;
    this.options.set([]);
    this.hasMore.set(false);
    this.hasSearched.set(true);
    this.loadError.set(false);
    this.loading.set(true);
    this.loadingMore.set(false);

    this.debounceSubscription = timer(SEARCH_DEBOUNCE_MS)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadPage(query, 0, version));
  }

  private loadMore(): void {
    if (
      !this.hasMore() ||
      this.loading() ||
      this.loadingMore() ||
      this.loadError() ||
      this.options().length === 0
    ) {
      return;
    }
    this.loadPage(this.lastSearchQuery ?? this.query(), this.nextOffset, this.requestVersion);
  }

  private loadPage(query: string, offset: number, version: number): void {
    if (this.disabled() || version !== this.requestVersion) return;
    this.loading.set(offset === 0);
    this.loadingMore.set(offset > 0);
    this.loadError.set(false);

    this.pageSubscription = defer(() =>
      this.autocompleteFn()({ query, offset, limit: Math.max(1, this.limit()) }),
    )
      .pipe(
        take(1),
        finalize(() => {
          if (version !== this.requestVersion) return;
          this.loading.set(false);
          this.loadingMore.set(false);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (page) => {
          if (version !== this.requestVersion) return;
          const current = offset === 0 ? [] : this.options();
          const known = new Set(current.map((option) => optionToken(option.value)));
          const appended = page.filter((option) => {
            const token = optionToken(option.value);
            if (known.has(token)) return false;
            known.add(token);
            return true;
          });
          this.options.set([...current, ...appended]);
          this.nextOffset = offset + page.length;
          this.hasMore.set(page.length >= Math.max(1, this.limit()));
        },
        error: (error: unknown) => {
          if (version !== this.requestVersion) return;
          this.loadError.set(true);
          if (this.options().length === 0) this.expanded.set(false);
          this.requestError.emit(error);
        },
      });
  }
}
