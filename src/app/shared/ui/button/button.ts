import { Component, booleanAttribute, computed, effect, input, isDevMode } from '@angular/core';
import { Spinner } from '../spinner';
import { CONTROL, type ControlSize } from '../sizing';

/**
 * Intención visual del botón.
 * - `primary`: acción principal (ej. "Guardar").
 * - `secondary`: acción secundaria sobre fondo claro (ej. "Cancelar").
 * - `ghost`: acción terciaria sin fondo (ej. iconos en toolbar).
 * - `danger`: acción destructiva (ej. "Eliminar").
 */
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

/** Se corresponde 1:1 con el atributo nativo `type` del `<button>`. */
export type ButtonType = 'button' | 'submit' | 'reset';

/** Clases comunes a todas las variantes (layout + foco accesible + estados). */
const BASE_CLASSES =
  'relative inline-flex items-center justify-center rounded-control font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer';

/**
 * Clases propias de cada variante. Fuente única de verdad del color.
 * Usan tokens semánticos (ver `src/styles.css`), nunca colores crudos.
 */
const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-primary-foreground hover:bg-primary-hover',
  secondary: 'bg-surface text-foreground inset-ring-1 inset-ring-border hover:bg-surface-muted',
  ghost: 'text-foreground hover:bg-surface-muted',
  danger: 'bg-danger text-danger-foreground hover:bg-danger-hover',
};

@Component({
  selector: 'app-button',
  imports: [Spinner],
  template: `
    <button
      [type]="type()"
      [class]="classes()"
      [attr.aria-label]="ariaLabel()"
      [attr.aria-busy]="loading() ? 'true' : null"
      [disabled]="disabled()"
      (click)="onClick($event)"
    >
      <span [class]="contentClasses()">
        <ng-content />
      </span>

      @if (loading()) {
        <span class="absolute inset-0 inline-flex items-center justify-center" aria-hidden="true">
          <app-spinner [size]="size()" />
        </span>
      }
    </button>
  `,
})
export class Button {
  /** Intención visual. Por defecto `primary`. */
  readonly variant = input<ButtonVariant>('primary');

  /** Tamaño (escala compartida `xs | sm | md | lg`). Por defecto `md`. */
  readonly size = input<ControlSize>('md');

  /** Tipo nativo del botón. Usar `submit` dentro de formularios. Por defecto `button`. */
  readonly type = input<ButtonType>('button');

  /** Deshabilitado (atributo nativo). Acepta el atributo desnudo (`disabled`). */
  readonly disabled = input(false, { transform: booleanAttribute });

  /** En carga: muestra spinner, `aria-busy` y bloquea la interacción. Acepta `loading`. */
  readonly loading = input(false, { transform: booleanAttribute });

  /** Ancho completo (bloque). Acepta el atributo desnudo (`fullWidth`). */
  readonly fullWidth = input(false, { transform: booleanAttribute });

  /** Botón cuadrado de solo icono. Requiere `ariaLabel`. Acepta atributo desnudo. */
  readonly iconOnly = input(false, { transform: booleanAttribute });

  /** Nombre accesible; se enlaza al `aria-label` del `<button>` interno. */
  readonly ariaLabel = input<string | undefined>(undefined);

  /** Clases de la caja del botón: base + altura + ancho/padding + variante. */
  protected readonly classes = computed(() => {
    const tokens = CONTROL[this.size()];
    const width = this.fullWidth()
      ? `w-full ${tokens.paddingX}`
      : this.iconOnly()
        ? tokens.square
        : tokens.paddingX;

    return [BASE_CLASSES, tokens.height, width, VARIANT_CLASSES[this.variant()]].join(' ');
  });

  /** Contenido proyectado: centrado, tipografía, gap e iconos. Oculto durante `loading`. */
  protected readonly contentClasses = computed(() => {
    const tokens = CONTROL[this.size()];
    return [
      'inline-flex items-center justify-center',
      tokens.text,
      tokens.gap,
      tokens.icon,
      this.loading() ? 'invisible' : '',
    ]
      .filter(Boolean)
      .join(' ');
  });

  constructor() {
    if (isDevMode()) {
      effect(() => {
        if (this.iconOnly() && !this.ariaLabel()) {
          console.warn(
            '[app-button] `iconOnly` requiere `ariaLabel` para tener un nombre accesible.',
          );
        }
      });
    }
  }

  /**
   * Mientras `loading`, bloquea mouse, teclado (Enter/Space) y `type="submit"`
   * deteniendo la propagación (para `(click)` del consumidor) y la acción por defecto.
   */
  protected onClick(event: Event): void {
    if (this.loading()) {
      event.preventDefault();
      event.stopPropagation();
    }
  }
}
