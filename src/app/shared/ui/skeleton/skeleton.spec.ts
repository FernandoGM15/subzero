import { render } from '@testing-library/angular';
import { Skeleton } from './skeleton';

describe('Skeleton', () => {
  it('is decorative and respects reduced motion', async () => {
    const { container } = await render('<app-skeleton class="h-4 w-32" />', {
      imports: [Skeleton],
    });
    const skeleton = container.querySelector('app-skeleton')!;
    expect(skeleton.getAttribute('aria-hidden')).toBe('true');
    expect(skeleton.classList.contains('motion-safe:animate-pulse')).toBe(true);
    expect(skeleton.classList.contains('h-4')).toBe(true);
    expect(skeleton.classList.contains('w-32')).toBe(true);
  });
});
