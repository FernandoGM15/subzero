import { CONTROL, SPINNER_SIZE, type ControlSize } from './sizing';

const SIZES: ControlSize[] = ['xs', 'sm', 'md', 'lg'];

/** Extrae el número de una clase de una sola dimensión, p. ej. `h-7` → 7. */
function dimensionOf(prefix: 'h' | 'w', className: string): number {
  const match = new RegExp(`^${prefix}-([\\d.]+)$`).exec(className);
  if (!match) {
    throw new Error(`Esperaba una clase "${prefix}-<n>", recibí "${className}"`);
  }
  return Number(match[1]);
}

describe('sizing', () => {
  it('defines exactly the four control sizes', () => {
    expect(Object.keys(CONTROL).sort()).toEqual([...SIZES].sort());
    expect(Object.keys(SPINNER_SIZE).sort()).toEqual([...SIZES].sort());
  });

  it('keeps each square control as wide as it is tall', () => {
    for (const size of SIZES) {
      const { height, square } = CONTROL[size];
      expect(dimensionOf('w', square)).toBe(dimensionOf('h', height));
    }
  });

  it('orders heights from smallest to largest', () => {
    const heights = SIZES.map((size) => dimensionOf('h', CONTROL[size].height));
    expect(heights).toEqual([...heights].sort((a, b) => a - b));
    expect(new Set(heights).size).toBe(heights.length);
  });

  it('normalizes projected svg icons', () => {
    for (const size of SIZES) {
      expect(CONTROL[size].icon).toMatch(/^\[&_svg\]:size-/);
      expect(SPINNER_SIZE[size]).toMatch(/^size-/);
    }
  });
});
