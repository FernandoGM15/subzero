import { fireEvent, render, screen } from '@testing-library/angular';
import { Button } from './button';

describe('Button', () => {
  it('defaults to a primary, non-submitting button', async () => {
    await render(Button);

    const button = screen.getByRole('button') as HTMLButtonElement;
    expect(button.type).toBe('button');
    expect(button.className).toContain('bg-primary');
  });

  it('reflects the variant and type inputs', async () => {
    await render(Button, { inputs: { variant: 'danger', type: 'submit' } });

    const button = screen.getByRole('button') as HTMLButtonElement;
    expect(button.type).toBe('submit');
    expect(button.className).toContain('bg-danger');
  });

  it('applies the size classes', async () => {
    await render(Button, { inputs: { size: 'lg' } });

    const button = screen.getByRole('button') as HTMLButtonElement;
    expect(button.className).toContain('h-12');
  });

  it('expands to full width', async () => {
    await render(Button, { inputs: { fullWidth: true } });

    const button = screen.getByRole('button') as HTMLButtonElement;
    expect(button.className).toContain('w-full');
  });

  it('squares an icon-only button', async () => {
    await render(Button, { inputs: { iconOnly: true, size: 'xs', ariaLabel: 'Cerrar' } });

    const button = screen.getByRole('button') as HTMLButtonElement;
    expect(button.className).toContain('w-7');
  });

  it('warns in dev when an icon-only button has no accessible name', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    await render(Button, { inputs: { iconOnly: true } });

    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('puts ariaLabel on the inner button', async () => {
    await render(Button, { inputs: { ariaLabel: 'Guardar suscripción' } });

    expect(screen.getByRole('button').getAttribute('aria-label')).toBe('Guardar suscripción');
  });

  it('projects its content', async () => {
    await render(`<app-button>Guardar suscripción</app-button>`, { imports: [Button] });

    expect(screen.getByText('Guardar suscripción')).toBeTruthy();
  });

  it('accepts bare boolean attributes', async () => {
    await render(`<app-button disabled fullWidth>Guardar</app-button>`, { imports: [Button] });

    const button = screen.getByRole('button') as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    expect(button.className).toContain('w-full');
  });

  it('disables the native button when disabled', async () => {
    await render(Button, { inputs: { disabled: true } });

    expect((screen.getByRole('button') as HTMLButtonElement).disabled).toBe(true);
  });

  it('shows a spinner, sets aria-busy and hides the content while loading', async () => {
    await render(`<app-button [loading]="true">Guardar</app-button>`, { imports: [Button] });

    const button = screen.getByRole('button');
    const content = screen.getByText('Guardar');

    expect(button.getAttribute('aria-busy')).toBe('true');
    expect(button.querySelector('svg')).not.toBeNull();
    expect(content.className).toContain('invisible');
  });

  it('blocks the click while loading', async () => {
    const { container } = await render(Button, { inputs: { loading: true } });
    const clicks = vi.fn();
    container.addEventListener('click', clicks);

    fireEvent.click(screen.getByRole('button'));

    expect(clicks).not.toHaveBeenCalled();
  });

  it('lets the click through when not loading', async () => {
    const { container } = await render(Button);
    const clicks = vi.fn();
    container.addEventListener('click', clicks);

    fireEvent.click(screen.getByRole('button'));

    expect(clicks).toHaveBeenCalledTimes(1);
  });
});
