/**
 * Escala de tamaños compartida por el UI kit.
 *
 * Fuente única de verdad de los tamaños de control: cualquier componente que
 * necesite la escala `xs | sm | md | lg` importa de aquí en vez de redefinir sus
 * propios mapas.
 *
 * Nota Tailwind v4: las clases se guardan como strings **completos y literales**
 * (`[&_svg]:size-4`), nunca concatenados en runtime, para que el escáner de
 * Tailwind las detecte y genere las utilidades.
 */

/** Pasos de la escala. La comparten todos los controles (button, input, select, badge…). */
export type ControlSize = 'xs' | 'sm' | 'md' | 'lg';

/** Dimensiones de un control para un tamaño dado. */
export interface ControlSizeTokens {
  /** Alto de la caja del control. */
  height: string;
  /** Ancho del control cuadrado (`iconOnly`). Coincide con `height`. */
  square: string;
  /** Padding horizontal cuando el control lleva contenido. */
  paddingX: string;
  /** Tamaño tipográfico del contenido. */
  text: string;
  /** Separación entre los hijos del contenido (p. ej. icono + texto). */
  gap: string;
  /** Normaliza el tamaño de los `<svg>` proyectados dentro del control. */
  icon: string;
}

/** Tamaños de los controles. Alturas: 28 / 32 / 40 / 48 px. */
export const CONTROL: Record<ControlSize, ControlSizeTokens> = {
  xs: {
    height: 'h-7',
    square: 'w-7',
    paddingX: 'px-2.5',
    text: 'text-xs',
    gap: 'gap-1.5',
    icon: '[&_svg]:size-3.5',
  },
  sm: {
    height: 'h-8',
    square: 'w-8',
    paddingX: 'px-3',
    text: 'text-sm',
    gap: 'gap-1.5',
    icon: '[&_svg]:size-3.5',
  },
  md: {
    height: 'h-10',
    square: 'w-10',
    paddingX: 'px-4',
    text: 'text-sm',
    gap: 'gap-2',
    icon: '[&_svg]:size-4',
  },
  lg: {
    height: 'h-12',
    square: 'w-12',
    paddingX: 'px-5',
    text: 'text-base',
    gap: 'gap-2',
    icon: '[&_svg]:size-5',
  },
};

/**
 * Tamaño del glifo del spinner. No es un control: su tamaño es el del icono,
 * no el de una caja, por eso vive en su propio mapa (aunque use la misma escala).
 */
export const SPINNER_SIZE: Record<ControlSize, string> = {
  xs: 'size-3.5',
  sm: 'size-4',
  md: 'size-5',
  lg: 'size-6',
};
