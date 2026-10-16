import { render, screen } from '@testing-library/angular';
import { Spinner } from './spinner';

describe('Spinner', () => {
  it('renders a spinning svg that is decorative by default', async () => {
    const { container } = await render(Spinner);

    const svg = container.querySelector('svg') as SVGElement;
    expect(svg.classList.contains('animate-spin')).toBe(true);
    expect(svg.getAttribute('aria-hidden')).toBe('true');
    expect(svg.getAttribute('role')).toBeNull();
  });

  it('applies the size classes', async () => {
    const { container } = await render(Spinner, { inputs: { size: 'lg' } });

    const svg = container.querySelector('svg') as SVGElement;
    expect(svg.classList.contains('size-6')).toBe(true);
  });

  it('becomes an accessible status when given a label', async () => {
    await render(Spinner, { inputs: { label: 'Cargando suscripciones' } });

    const status = screen.getByRole('status');
    expect(status.getAttribute('aria-label')).toBe('Cargando suscripciones');
    expect(status.getAttribute('aria-hidden')).toBeNull();
  });
});
