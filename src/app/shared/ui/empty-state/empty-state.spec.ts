import { render, screen } from '@testing-library/angular';
import { EmptyState } from './empty-state';

describe('EmptyState', () => {
  it('projects consumer content and actions without adding a live role', async () => {
    const { container } = await render(
      '<app-empty-state><h2>No subscriptions</h2><button>Add subscription</button></app-empty-state>',
      { imports: [EmptyState] },
    );
    expect(screen.getByRole('heading', { name: 'No subscriptions' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Add subscription' })).toBeTruthy();
    expect(container.querySelector('app-empty-state')?.getAttribute('role')).toBeNull();
  });
});
