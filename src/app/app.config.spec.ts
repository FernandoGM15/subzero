import { fireEvent, render, screen } from '@testing-library/angular';
import { appConfig } from './app.config';
import { DatePicker } from './shared/ui/date-picker';

describe('Application date configuration', () => {
  it('applies Spanish defaults without locale attributes on the date picker', async () => {
    await render(DatePicker, {
      inputs: { label: 'Payment date', value: '2026-10-16' },
      providers: appConfig.providers,
    });
    const trigger = screen.getByRole('button', { name: /Payment date/ });
    expect(trigger.textContent).toContain('16/10/2026');
    fireEvent.click(trigger);
    await screen.findByRole('button', { name: 'Mes anterior' });
    expect(screen.getByRole('grid').getAttribute('aria-label')).toMatch(/octubre/i);
  });
});
