import { render, screen } from '@testing-library/angular';
import { Card } from './card';

describe('Card', () => {
  it('projects consumer content without imposing a semantic role', async () => {
    const { container } = await render('<app-card><h2>Subscription</h2></app-card>', {
      imports: [Card],
    });

    expect(screen.getByRole('heading', { name: 'Subscription' })).toBeTruthy();
    expect(container.querySelector('app-card')?.getAttribute('role')).toBeNull();
  });
  it('orders optional sections and places unmarked content in the body', async () => {
    const { container } = await render(
      `
      <app-card>
        <footer cardFooter>Actions</footer>
        <p>Free content</p>
        <p cardContent>Details</p>
        <h2 cardTitle>Subscription</h2>
        <img cardImage alt="Logo" />
      </app-card>
    `,
      { imports: [Card] },
    );

    const card = container.querySelector('app-card')!;
    const image = card.querySelector('[cardImage]')!;
    const title = card.querySelector('[cardTitle]')!;
    const content = card.querySelector('[cardContent]')!;
    const free = screen.getByText('Free content');
    const footer = card.querySelector('[cardFooter]')!;
    expect(image.compareDocumentPosition(title) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(title.compareDocumentPosition(content) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(content.parentElement).toBe(free.parentElement);
    expect(free.compareDocumentPosition(footer) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
