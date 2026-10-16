import { Component, computed, input } from '@angular/core';
import { IconLoader2, TablerIconComponent } from '@tabler/icons-angular';
import { SPINNER_SIZE, type ControlSize } from '../sizing';

/**
 * Indicador de carga reutilizable.
 *
 * Decorativo por defecto (`aria-hidden`): úsalo cuando el contenedor ya comunica
 * el estado (p. ej. el botón con `aria-busy`). Si es el único indicador, pásale
 * `label` y se convierte en un anuncio (`role="status"`).
 *
 * Hereda el color del texto (`currentColor`), así que se adapta a primario/peligro/etc.
 */
@Component({
  selector: 'app-spinner',
  imports: [TablerIconComponent],
  template: `
    <tabler-icon
      [icon]="spinnerIcon"
      [size]="24"
      [svgClass]="classes()"
      [svgAttributes]="svgAttributes()"
    />
  `,
})
export class Spinner {
  protected readonly spinnerIcon = IconLoader2;
  /** Tamaño (escala compartida `xs | sm | md | lg`). Por defecto `md`. */
  readonly size = input<ControlSize>('md');

  /** Nombre accesible. Si se omite, el spinner es decorativo (`aria-hidden`). */
  readonly label = input<string | undefined>(undefined);

  protected readonly classes = computed(() => `animate-spin shrink-0 ${SPINNER_SIZE[this.size()]}`);
  protected readonly svgAttributes = computed(() =>
    this.label() ? { role: 'status', 'aria-label': this.label()! } : { 'aria-hidden': 'true' },
  );
}
