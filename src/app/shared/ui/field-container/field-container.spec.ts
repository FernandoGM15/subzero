import { Component, signal } from '@angular/core';
import { render, screen } from '@testing-library/angular';
import { FieldContainer } from './field-container';
import { CONTROL } from '../sizing';

@Component({
  imports: [FieldContainer],
  template: `
    <app-field-container
      #field
      controlId="projected"
      label="Name"
      [floating]="floating()"
      [error]="error()"
      [helperText]="help()"
      [reserveMessageSpace]="reserve()"
      size="sm"
      required
    >
      <input id="projected" [attr.aria-describedby]="field.describedBy()" />
    </app-field-container>
  `,
})
class Host {
  readonly floating = signal(false);
  readonly error = signal<string | undefined>(undefined);
  readonly help = signal<string | undefined>(undefined);
  readonly reserve = signal(true);
}

describe('FieldContainer', () => {
  it('projects a native control directly into its styled wrapper with an associated label', async () => {
    await render(Host);
    const element = screen.getByRole('textbox', { name: 'Name' }) as HTMLInputElement;
    expect(element.parentElement?.className).toContain('focus-within:border-ring');
    expect(element.labels?.[0].htmlFor).toBe('projected');
    expect(element.labels?.[0].querySelector('[aria-hidden]')?.textContent).toBe('*');
    for (const token of [CONTROL.sm.paddingX, CONTROL.sm.text]) {
      expect(element.labels?.[0].className).toContain(token);
    }
  });

  it('uses only the supplied floating state instead of inferring it from projected values', async () => {
    const { fixture } = await render(Host);
    const element = screen.getByRole('textbox', { name: 'Name' }) as HTMLInputElement;
    element.value = 'Value';
    fixture.detectChanges();
    expect(element.labels?.[0].getAttribute('data-floating')).toBe('false');
    fixture.componentInstance.floating.set(true);
    fixture.detectChanges();
    expect(element.labels?.[0].getAttribute('data-floating')).toBe('true');
  });

  it('coordinates messages, error priority and optional reserved space without empty descriptions', async () => {
    const { fixture, container } = await render(Host);
    const host = fixture.componentInstance;
    const element = screen.getByRole('textbox', { name: 'Name' });
    expect(container.querySelector('[data-message-space]')?.className).toContain('min-h-4');
    expect(element.getAttribute('aria-describedby')).toBeNull();
    host.help.set('Help');
    fixture.detectChanges();
    expect(element.getAttribute('aria-describedby')).toBe('projected-message');
    host.error.set('Error');
    fixture.detectChanges();
    expect(screen.queryByText('Help')).toBeNull();
    expect(screen.getByText('Error').id).toBe('projected-message');
    expect(element.parentElement?.className).toContain('focus-within:border-danger');
    host.error.set(undefined);
    host.help.set(undefined);
    host.reserve.set(false);
    fixture.detectChanges();
    expect(container.querySelector('[data-message-space]')).toBeNull();
    expect(element.getAttribute('aria-describedby')).toBeNull();
  });
});
