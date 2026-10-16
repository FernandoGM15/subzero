import { Component, signal } from '@angular/core';
import { fireEvent, render, screen } from '@testing-library/angular';
import { Select, type SelectOption, type SelectValue } from './select';

@Component({
  imports: [Select],
  template: `
    <app-select label="Choice" [options]="options()" [(value)]="value" />
  `,
})
class Host {
  readonly options = signal<readonly SelectOption[]>([
    { value: 0, label: 'Number zero' },
    { value: '0', label: 'String zero' },
    { value: '', label: 'Empty string' },
  ]);
  readonly value = signal<SelectValue | null>(null);
}
function el() {
  return screen.getByRole('combobox') as HTMLButtonElement;
}
function shown(container: HTMLElement = document.body) {
  return container.querySelector('[data-selected-value]')?.textContent?.trim();
}

describe('independent approved identity probes', () => {
  it.each([0, '0', ''])(
    'preserves external %j through replacement, reorder, removal and restoration',
    async (value) => {
      const { fixture } = await render(Host);
      const host = fixture.componentInstance;
      const original = host.options();
      const expected = original.find((o) => o.value === value)!.label;
      host.value.set(value);
      fixture.detectChanges();
      expect(shown(fixture.nativeElement)).toBe(expected);
      const observed = vi.fn();
      (fixture.debugElement.children[0].componentInstance as Select).value.subscribe(observed);
      host.options.set([...original].reverse().map((o) => ({ ...o, label: o.label + ' updated' })));
      fixture.detectChanges();
      expect(shown(fixture.nativeElement)).toBe(expected + ' updated');
      expect(host.value()).toBe(value);
      host.options.set(host.options().filter((o) => o.value !== value));
      fixture.detectChanges();
      expect(shown(fixture.nativeElement)).toBe('');
      expect(host.value()).toBe(value);
      host.options.set(original);
      fixture.detectChanges();
      expect(shown(fixture.nativeElement)).toBe(expected);
      host.value.set(null);
      fixture.detectChanges();
      expect(shown(fixture.nativeElement)).toBe('');
      expect(observed).not.toHaveBeenCalled();
    },
  );
  it('keeps null visually empty after chosen option removed', async () => {
    const { fixture } = await render(Host);
    const host = fixture.componentInstance;
    fireEvent.click(el());
    fireEvent.click(await screen.findByRole('option', { name: 'String zero' }));
    expect(host.value()).toBe('0');
    host.value.set(null);
    fixture.detectChanges();
    expect(shown(fixture.nativeElement)).toBe('');
    host.options.set([]);
    fixture.detectChanges();
    expect(shown(fixture.nativeElement)).toBe('');
    expect(host.value()).toBeNull();
    host.options.set([{ value: 'new', label: 'New' }]);
    fixture.detectChanges();
    expect(shown(fixture.nativeElement)).toBe('');
    expect(host.value()).toBeNull();
  });
  it('does not change selection when disabled option replaces selected record', async () => {
    const { fixture } = await render(Host);
    const host = fixture.componentInstance;
    host.value.set(0);
    fixture.detectChanges();
    host.options.set([{ value: 0, label: 'Disabled zero', disabled: true }]);
    fixture.detectChanges();
    expect(shown()).toBe('Disabled zero');
    expect(host.value()).toBe(0);
  });
});
