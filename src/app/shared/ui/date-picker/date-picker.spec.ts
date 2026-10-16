import { Component, LOCALE_ID, signal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { fireEvent, render, screen, waitFor } from '@testing-library/angular';
import { DatePicker, type DateDisplayFormat } from './date-picker';
import { provideDatePickerDefaults } from './date-picker.config';

@Component({
  imports: [DatePicker, FormField],
  template: `
    <app-date-picker label="Payment date" [formField]="fields.date" />
  `,
})
class FormHost {
  readonly data = signal({ date: '2026-10-16' });
  readonly fields = form(this.data);
}

const trigger = () => screen.getByRole('button', { name: /Payment date/ });
const day = (iso: string) =>
  document.querySelector<HTMLButtonElement>(`button[data-date="${iso}"]`)!;
async function open() {
  fireEvent.click(trigger());
  await screen.findByRole('dialog', { name: 'Payment date' });
  await waitFor(() => expect(document.activeElement?.getAttribute('data-date')).not.toBeNull());
}

describe('DatePicker', () => {
  it('is selection-only and displays day/month/year while retaining ISO', async () => {
    const { fixture } = await render(DatePicker, {
      inputs: { label: 'Payment date', value: '2026-10-16' },
    });
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(trigger().textContent).toContain('16/10/2026');
    expect(fixture.componentInstance.value()).toBe('2026-10-16');
    expect(trigger().getAttribute('aria-expanded')).toBe('false');
  });

  it('fills the container when empty and protects the calendar icon and label', async () => {
    const { fixture } = await render(DatePicker, { inputs: { label: 'Payment date' } });
    const host = fixture.nativeElement as HTMLElement;
    expect(host.classList.contains('w-full')).toBe(true);
    expect(host.classList.contains('min-w-0')).toBe(true);
    expect(host.classList.contains('max-w-full')).toBe(true);
    const icon = trigger().querySelector('tabler-icon')!;
    expect(icon.classList.contains('shrink-0')).toBe(true);
    expect(icon.querySelector('svg')).not.toBeNull();
    expect(
      host.querySelector('app-field-container')!.classList.contains('[&_label]:whitespace-nowrap'),
    ).toBe(true);
  });

  it.each([
    ['dd/MM/yyyy', '16/10/2026'],
    ['MM/dd/yyyy', '10/16/2026'],
    ['yyyy-MM-dd', '2026-10-16'],
  ] as [DateDisplayFormat, string][])(
    'supports %s without changing the model',
    async (displayFormat, text) => {
      const { fixture } = await render(DatePicker, {
        inputs: { label: 'Payment date', value: '2026-10-16', displayFormat },
      });
      expect(trigger().textContent).toContain(text);
      expect(fixture.componentInstance.value()).toBe('2026-10-16');
    },
  );

  it('inherits app locale, global format and Spanish accessible messages', async () => {
    const { fixture } = await render(DatePicker, {
      inputs: { label: 'Payment date', value: '2026-10-16' },
      providers: [
        { provide: LOCALE_ID, useValue: 'es-MX' },
        provideDatePickerDefaults({ displayFormat: 'yyyy-MM-dd' }),
      ],
    });
    expect(trigger().textContent).toContain('2026-10-16');
    await open();
    expect(screen.getByRole('grid').getAttribute('aria-label')).toMatch(/octubre/i);
    expect(screen.getByRole('button', { name: 'Mes anterior' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Mes siguiente' })).toBeTruthy();
    expect(screen.getByText(/Usa las flechas/)).toBeTruthy();
    expect(day('2026-10-16').getAttribute('aria-label')).toMatch(/viernes/i);
    expect(fixture.componentInstance.value()).toBe('2026-10-16');
  });

  it('allows per-instance locale, format and message overrides over global defaults', async () => {
    const { fixture } = await render(DatePicker, {
      inputs: {
        label: 'Payment date',
        value: '2026-10-16',
        locale: 'en-US',
        displayFormat: 'MM/dd/yyyy',
        messages: { nextMonth: 'Next billing month' },
      },
      providers: [
        { provide: LOCALE_ID, useValue: 'es-MX' },
        provideDatePickerDefaults({ displayFormat: 'yyyy-MM-dd' }),
      ],
    });
    expect(trigger().textContent).toContain('10/16/2026');
    await open();
    expect(screen.getByRole('grid').getAttribute('aria-label')).toBe('October 2026');
    expect(screen.getByRole('button', { name: 'Previous month' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Next billing month' })).toBeTruthy();
    expect(fixture.componentInstance.value()).toBe('2026-10-16');
  });

  it('supports app-owned translations for another language with English fallback', async () => {
    await render(DatePicker, {
      inputs: { label: 'Payment date', value: '2026-10-16' },
      providers: [
        { provide: LOCALE_ID, useValue: 'fr-FR' },
        provideDatePickerDefaults({
          messages: { previousMonth: 'Mois précédent', nextMonth: 'Mois suivant' },
        }),
      ],
    });
    await open();
    expect(screen.getByRole('grid').getAttribute('aria-label')).toMatch(/octobre/);
    expect(screen.getByRole('button', { name: 'Mois précédent' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Mois suivant' })).toBeTruthy();
    expect(screen.getByText(/Use arrow keys/)).toBeTruthy();
  });

  it('provides pointer and valid hover tokens only for enabled calendar actions', async () => {
    await render(DatePicker, {
      inputs: {
        label: 'Payment date',
        value: '2026-10-16',
        min: '2026-10-10',
        max: '2026-11-20',
      },
    });
    await open();
    expect(day('2026-10-15').classList.contains('enabled:cursor-pointer')).toBe(true);
    expect(day('2026-10-15').classList.contains('enabled:hover:bg-surface-muted')).toBe(true);
    expect(day('2026-10-16').classList.contains('enabled:hover:bg-primary-hover')).toBe(true);
    expect(day('2026-10-16').classList.contains('bg-primary')).toBe(true);
    expect(day('2026-10-09').disabled).toBe(true);
    expect(day('2026-10-09').classList.contains('disabled:cursor-not-allowed')).toBe(true);
    for (const name of ['Previous month', 'Next month']) {
      const button = screen.getByRole('button', { name });
      expect(button.classList.contains('enabled:cursor-pointer')).toBe(true);
      expect(button.classList.contains('enabled:hover:bg-surface-muted')).toBe(true);
      expect(button.classList.contains('disabled:cursor-not-allowed')).toBe(true);
      expect(button.className).not.toContain('bg-secondary');
    }
    expect(
      (screen.getByRole('button', { name: 'Previous month' }) as HTMLButtonElement).disabled,
    ).toBe(true);
    expect((screen.getByRole('button', { name: 'Next month' }) as HTMLButtonElement).disabled).toBe(
      false,
    );
  });

  it('selects a day, closes the panel, returns focus and marks the form touched', async () => {
    const { fixture } = await render(FormHost);
    await open();
    expect(document.activeElement).toBe(day('2026-10-16'));
    fireEvent.click(day('2026-10-20'));
    expect(fixture.componentInstance.data().date).toBe('2026-10-20');
    expect(fixture.componentInstance.fields.date().touched()).toBe(true);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(trigger());
    fixture.componentInstance.data.set({ date: '' });
    fixture.detectChanges();
    expect(trigger().textContent).not.toContain('20/10/2026');
  });

  it('navigates days and clamped months by keyboard without committing until selected', async () => {
    const { fixture } = await render(DatePicker, {
      inputs: { label: 'Payment date', value: '2028-01-31' },
    });
    await open();
    fireEvent.keyDown(day('2028-01-31'), { key: 'PageDown' });
    await waitFor(() => expect(document.activeElement).toBe(day('2028-02-29')));
    expect(fixture.componentInstance.value()).toBe('2028-01-31');
    fireEvent.keyDown(day('2028-02-29'), { key: 'ArrowRight' });
    await waitFor(() => expect(document.activeElement).toBe(day('2028-03-01')));
    fireEvent.keyDown(day('2028-03-01'), { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(fixture.componentInstance.value()).toBe('2028-01-31');
    expect(document.activeElement).toBe(trigger());
  });

  it('supports week boundaries, year jumps and keyboard selection', async () => {
    const { fixture } = await render(DatePicker, {
      inputs: { label: 'Payment date', value: '2028-02-29' },
    });
    await open();
    fireEvent.keyDown(day('2028-02-29'), { key: 'PageDown', shiftKey: true });
    await waitFor(() => expect(document.activeElement).toBe(day('2029-02-28')));
    fireEvent.keyDown(day('2029-02-28'), { key: 'Home' });
    await waitFor(() => expect(document.activeElement).toBe(day('2029-02-25')));
    fireEvent.keyDown(day('2029-02-25'), { key: 'End' });
    await waitFor(() => expect(document.activeElement).toBe(day('2029-03-03')));
    // Native buttons activate with Enter/Space in browsers; jsdom requires the click default action.
    fireEvent.click(document.activeElement!);
    expect(fixture.componentInstance.value()).toBe('2029-03-03');
  });

  it('clamps initial focus, rejects an impossible range and supports locale names', async () => {
    const { fixture } = await render(DatePicker, {
      inputs: {
        label: 'Payment date',
        value: '2026-01-01',
        min: '2026-10-10',
        max: '2026-10-20',
        locale: 'es-MX',
      },
    });
    await open();
    expect(document.activeElement).toBe(day('2026-10-10'));
    expect(screen.getByRole('grid').getAttribute('aria-label')).toMatch(/octubre/i);
    fireEvent.keyDown(day('2026-10-10'), { key: 'Escape' });
    fixture.componentRef.setInput('min', '2027-01-01');
    fixture.detectChanges();
    fireEvent.click(trigger());
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(fixture.componentInstance.value()).toBe('2026-01-01');
  });

  it('moves between months using navigation buttons', async () => {
    await render(DatePicker, { inputs: { label: 'Payment date', value: '2026-10-16' } });
    await open();
    fireEvent.click(screen.getByRole('button', { name: 'Next month' }));
    expect(screen.getByRole('grid').getAttribute('aria-label')).toBe('November 2026');
    fireEvent.click(screen.getByRole('button', { name: 'Previous month' }));
    expect(screen.getByRole('grid').getAttribute('aria-label')).toBe('October 2026');
  });

  it('enforces inclusive bounds for selection and navigation', async () => {
    const { fixture } = await render(DatePicker, {
      inputs: {
        label: 'Payment date',
        value: '2026-10-16',
        min: '2026-10-10',
        max: '2026-10-20',
      },
    });
    await open();
    expect(day('2026-10-09').disabled).toBe(true);
    expect(day('2026-10-21').disabled).toBe(true);
    expect(day('2026-10-10').disabled).toBe(false);
    expect(day('2026-10-20').disabled).toBe(false);
    fireEvent.click(day('2026-10-21'));
    expect(fixture.componentInstance.value()).toBe('2026-10-16');
    expect((screen.getByRole('button', { name: 'Next month' }) as HTMLButtonElement).disabled).toBe(
      true,
    );
    fireEvent.click(day('2026-10-20'));
    expect(fixture.componentInstance.value()).toBe('2026-10-20');
  });

  it.each(['disabled', 'readonly'] as const)('does not open when %s', async (state) => {
    await render(DatePicker, { inputs: { label: 'Payment date', [state]: true } });
    fireEvent.click(trigger());
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('uses consumer errors and closes if disabled while open', async () => {
    const { fixture } = await render(DatePicker, {
      inputs: { label: 'Payment date', error: 'Invalid date' },
    });
    expect(trigger().getAttribute('aria-invalid')).toBe('true');
    expect(document.getElementById(trigger().getAttribute('aria-describedby')!)?.textContent).toBe(
      'Invalid date',
    );
    await open();
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
