import { render, screen } from '@testing-library/angular';
import { Badge } from './badge';

describe('Badge', () => {
  it('projects text without adding a status role', async () => {
    await render('<app-badge>Active</app-badge>', { imports: [Badge] });
    const badge = screen.getByText('Active');
    expect(badge.getAttribute('role')).toBeNull();
  });

  it.each(['neutral', 'success', 'warning', 'danger'] as const)(
    'applies the %s intention',
    async (variant) => {
      const { container } = await render(`<app-badge variant="${variant}">Label</app-badge>`, {
        imports: [Badge],
      });
      expect(container.querySelector('app-badge')?.className).toContain(`bg-badge-${variant}`);
    },
  );
});
