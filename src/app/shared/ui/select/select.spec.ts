import { Component, signal } from '@angular/core';
import { disabled, form, FormField, required } from '@angular/forms/signals';
import { fireEvent, render, screen } from '@testing-library/angular';
import { CONTROL, type ControlSize } from '../sizing';
import { Select, type SelectOption, type SelectValue } from './select';

const OPTIONS: readonly SelectOption[] = [
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'PAUSED', label: 'Paused', disabled: true },
  { value: 2, label: 'Yearly' },
];
@Component({
  imports: [Select],
  template: `
    <app-select label="Cycle" [options]="options()" [(value)]="value" />
  `,
})
class Host {
  readonly options = signal<readonly SelectOption[]>(OPTIONS);
  readonly value = signal<SelectValue | null>(null);
}
@Component({
  imports: [Select, FormField],
  template: `
    <app-select label="Cycle" [options]="options" [formField]="fields.cycle" [error]="error()" />
  `,
})
class FormHost {
  readonly options = OPTIONS;
  readonly data = signal<{ cycle: SelectValue | null }>({ cycle: null });
  readonly isDisabled = signal(false);
  readonly error = signal<string | undefined>(undefined);
  readonly fields = form(this.data, (path) => {
    required(path.cycle);
    disabled(path.cycle, () => this.isDisabled());
  });
}
function control(label = 'Cycle') {
  return screen.getByRole('combobox', { name: label }) as HTMLButtonElement;
}
function display() {
  return control().querySelector('[data-selected-value]')?.textContent?.trim();
}
async function open() {
  if (control().getAttribute('aria-expanded') !== 'true') fireEvent.click(control());
  await screen.findByRole('listbox');
}
async function choose(label: string) {
  await open();
  fireEvent.click(screen.getByRole('option', { name: label }));
}
async function key(key: string) {
  fireEvent.keyDown(control(), { key });
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
}

describe('Select custom panel', () => {
  it('stretches the option panel to the connected trigger width', async () => {
    await render(Select, { inputs: { label: 'Cycle', options: OPTIONS } });
    await open();

    const panelHost = document.querySelector('app-option-panel') as HTMLElement;
    expect(panelHost.style.display).toBe('block');
    expect(panelHost.style.width).toBe('100%');
  });

  it('keeps the chevron closer to the trailing edge than the label padding', async () => {
    await render(Select, { inputs: { label: 'Cycle', options: OPTIONS } });

    expect(control().classList.contains('px-4')).toBe(true);
    expect(control().classList.contains('pe-2')).toBe(true);
  });

  it('places the dropdown icon in the centered trailing grid cell', async () => {
    await render(Select, { inputs: { label: 'Cycle', options: OPTIONS } });
    const icon = control().querySelector('tabler-icon');

    expect(icon?.classList.contains('col-start-2')).toBe(true);
    expect(icon?.classList.contains('row-start-1')).toBe(true);
    expect(icon?.classList.contains('grid')).toBe(true);
    expect(icon?.classList.contains('place-items-center')).toBe(true);
  });

  it('starts empty without generating a null option or selecting the first item', async () => {
    const { fixture } = await render(Select, { inputs: { label: 'Cycle', options: OPTIONS } });
    expect(control().tagName).toBe('BUTTON');
    expect(display()).toBe('');
    expect(fixture.componentInstance.value()).toBeNull();
    await open();
    expect(screen.getAllByRole('option').map((item) => item.textContent?.trim())).toEqual([
      'Monthly',
      'Paused',
      'Yearly',
    ]);
    expect(control().getAttribute('aria-controls')).toBe(screen.getByRole('listbox').id);
    expect(screen.queryByText('Select an option')).toBeNull();
  });
  it('updates standalone value in both directions and closes on selection', async () => {
    const { fixture } = await render(Host);
    await choose('Monthly');
    expect(fixture.componentInstance.value()).toBe('MONTHLY');
    expect(control().getAttribute('aria-expanded')).toBe('false');
    fixture.componentInstance.value.set(2);
    fixture.detectChanges();
    expect(display()).toBe('Yearly');
  });
  it.each([0, '', 3, '3'])('preserves primitive %j exactly', async (value) => {
    const choices = [
      { value: 0, label: 'Zero' },
      { value: '', label: 'Empty string' },
      { value: 3, label: 'Number' },
      { value: '3', label: 'String' },
    ];
    const { fixture } = await render(Select, { inputs: { label: 'Cycle', options: choices } });
    await choose(choices.find((option) => option.value === value)!.label);
    expect(fixture.componentInstance.value()).toBe(value);
  });
  it('allows clearing only via an enabled consumer null option, even when required', async () => {
    const { fixture } = await render(Select, {
      inputs: {
        label: 'Cycle',
        value: 2,
        required: true,
        options: [{ value: null, label: 'None' }, ...OPTIONS],
      },
    });
    await choose('None');
    expect(fixture.componentInstance.value()).toBeNull();
    expect(control().getAttribute('aria-required')).toBe('true');
    expect(control().getAttribute('aria-invalid')).toBeNull();
  });
  it('does not clear when reselecting the current value', async () => {
    const { fixture } = await render(Select, {
      inputs: { label: 'Cycle', value: 2, options: OPTIONS },
    });
    const changed = vi.fn();
    fixture.componentInstance.value.subscribe(changed);
    await choose('Yearly');
    await choose('Yearly');
    expect(fixture.componentInstance.value()).toBe(2);
    expect(changed).not.toHaveBeenCalled();
  });
  it('ignores disabled choices and prevents a disabled trigger from opening', async () => {
    const { fixture, rerender } = await render(Select, {
      inputs: {
        label: 'Cycle',
        value: 2,
        options: [{ value: null, label: 'None', disabled: true }, ...OPTIONS],
      },
    });
    await choose('None');
    expect(fixture.componentInstance.value()).toBe(2);
    expect(control().getAttribute('aria-expanded')).toBe('true');
    await rerender({ inputs: { label: 'Cycle', value: 2, options: OPTIONS, disabled: true } });
    expect(control().disabled).toBe(true);
    expect(control().getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(control());
    expect(screen.queryByRole('listbox')).toBeNull();
  });
  it('preserves missing values through an open-panel catalog update and restores labels without emission', async () => {
    const { fixture } = await render(Host);
    const host = fixture.componentInstance;
    host.value.set(2);
    fixture.detectChanges();
    await open();
    const changed = vi.fn();
    (fixture.debugElement.children[0].componentInstance as Select).value.subscribe(changed);
    host.options.set([OPTIONS[0]]);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(host.value()).toBe(2);
    expect(display()).toBe('');
    host.options.set(OPTIONS);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(display()).toBe('Yearly');
    expect(changed).not.toHaveBeenCalled();
  });
  it('does not render default feedback for an empty catalog', async () => {
    const { fixture } = await render(Select, { inputs: { label: 'Cycle' } });
    await open();
    const listboxId = control().getAttribute('aria-controls');
    expect(listboxId).toBeTruthy();
    expect(document.getElementById(listboxId!)?.textContent).toBe('');
    expect(fixture.componentInstance.value()).toBeNull();
  });
  it('navigates without committing, skips disabled options and commits with Enter', async () => {
    const { fixture } = await render(Select, { inputs: { label: 'Cycle', options: OPTIONS } });
    control().focus();
    await key('ArrowDown');
    await screen.findByRole('listbox');
    await key('Home');
    expect(fixture.componentInstance.value()).toBeNull();
    await key('ArrowDown');
    expect(fixture.componentInstance.value()).toBeNull();
    await key('Enter');
    expect(fixture.componentInstance.value()).toBe(2);
    expect(control().getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(control());
  });
  it('supports End and Space commit without editable search', async () => {
    const { fixture } = await render(Select, { inputs: { label: 'Cycle', options: OPTIONS } });
    control().focus();
    await key(' ');
    await screen.findByRole('listbox');
    await key('End');
    await key(' ');
    expect(fixture.componentInstance.value()).toBe(2);
    expect(screen.queryByRole('textbox')).toBeNull();
  });
  it('closes on Escape or Tab without changing values and without trapping Tab', async () => {
    const { fixture } = await render(Select, {
      inputs: { label: 'Cycle', options: OPTIONS, value: 2 },
    });
    await open();
    await key('Home');
    await key('Escape');
    expect(control().getAttribute('aria-expanded')).toBe('false');
    expect(fixture.componentInstance.value()).toBe(2);
    await open();
    const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    control().dispatchEvent(event);
    fixture.detectChanges();
    expect(event.defaultPrevented).toBe(false);
    expect(control().getAttribute('aria-expanded')).toBe('false');
  });
  it('closes on outside click without committing or emitting touch while focus remains', async () => {
    const { fixture } = await render(Select, { inputs: { label: 'Cycle', options: OPTIONS } });
    const touched = vi.fn();
    fixture.componentInstance.touch.subscribe(touched);
    await open();
    fireEvent.pointerDown(document.body);
    fireEvent.click(document.body);
    fixture.detectChanges();
    expect(control().getAttribute('aria-expanded')).toBe('false');
    expect(fixture.componentInstance.value()).toBeNull();
    expect(touched).not.toHaveBeenCalled();
  });
  it.each(['xs', 'sm', 'md', 'lg'] as ControlSize[])(
    'uses shared %s sizing and subtle focus',
    async (size) => {
      await render(Select, { inputs: { label: 'Cycle', size } });
      for (const token of [CONTROL[size].height, CONTROL[size].paddingX, CONTROL[size].text])
        expect(control().className).toContain(token);
      expect(control().parentElement?.className).toContain('focus-within:border-ring');
    },
  );
  it('fills the container by default and preserves explicit width overrides', async () => {
    const { fixture } = await render(Select, {
      inputs: { label: 'Cycle' },
    });
    const selectHost = fixture.debugElement.nativeElement as HTMLElement;
    expect(selectHost.style.width).toBe('100%');
    expect(selectHost.style.maxWidth).toBe('100%');
    fixture.componentRef.setInput('width', '260px');
    fixture.detectChanges();
    expect(selectHost.style.width).toBe('260px');
  });
  it('shows a pointer cursor when enabled and a disabled cursor when unavailable', async () => {
    const { rerender } = await render(Select, { inputs: { label: 'Cycle' } });
    expect(control().style.cursor).toBe('pointer');
    const labelText = screen.getByText('Cycle');
    expect(labelText.className).toContain('cursor-pointer');
    expect(labelText.className).not.toContain('cursor-text');
    expect(labelText.closest('label')?.parentElement?.className).toContain('cursor-pointer');
    await rerender({ inputs: { label: 'Cycle', disabled: true } });
    expect(control().style.cursor).toBe('not-allowed');
    expect(screen.getByText('Cycle').className).toContain('cursor-not-allowed');
  });
  it('distinguishes hover, keyboard-active, and selected option styling', async () => {
    await render(Select, { inputs: { label: 'Cycle', options: OPTIONS } });
    await open();
    const option = screen.getByRole('option', { name: 'Monthly' });
    expect(option.className).toContain('hover:bg-primary/10');
    expect(option.className).toContain('data-[active=true]:outline-1');
    expect(option.className).toContain('data-[active=true]:outline-ring/40');
    expect(option.className).not.toContain('data-[active=true]:bg-primary/10');
    expect(option.className).toContain('aria-selected:bg-primary/10');
  });
  it('keeps sizing content constant across focus and selection', async () => {
    await render(Select, {
      inputs: { label: 'Cycle', options: [{ value: null, label: 'None' }, ...OPTIONS] },
    });
    const sizer = control().querySelector('[data-option-sizer]')!;
    const text = sizer.textContent;
    control().focus();
    await choose('Monthly');
    expect(sizer.textContent).toBe(text);
    await choose('None');
    fireEvent.blur(control());
    expect(sizer.textContent).toBe(text);
    expect(sizer.getAttribute('aria-hidden')).toBe('true');
  });
  it('keeps external error/help policy and reserved message associations', async () => {
    const { container, rerender } = await render(Select, { inputs: { label: 'Cycle' } });
    expect(container.querySelector('[data-message-space]')).toBeTruthy();
    expect(control().getAttribute('aria-describedby')).toBeNull();
    await rerender({ inputs: { label: 'Cycle', helperText: 'Help', error: 'Error' } });
    expect(screen.queryByText('Help')).toBeNull();
    expect(control().getAttribute('aria-invalid')).toBe('true');
    expect(
      document.getElementById(control().getAttribute('aria-describedby')!)?.textContent?.trim(),
    ).toBe('Error');
    await rerender({
      inputs: {
        label: 'Cycle',
        helperText: undefined,
        error: undefined,
        reserveMessageSpace: false,
      },
    });
    expect(container.querySelector('[data-message-space]')).toBeNull();
  });
  it('forwards focus and touches only on departure, not selection', async () => {
    const { fixture } = await render(Select, { inputs: { label: 'Cycle', options: OPTIONS } });
    const touched = vi.fn();
    fixture.componentInstance.touch.subscribe(touched);
    fixture.componentInstance.focus();
    expect(document.activeElement).toBe(control());
    await choose('Yearly');
    expect(touched).not.toHaveBeenCalled();
    fireEvent.blur(control());
    expect(touched).toHaveBeenCalledTimes(1);
  });
  it('isolates accessible associations across instances', async () => {
    await render(
      `<app-select label="Cycle" helperText="Help" /><app-select label="Other" helperText="Other help" />`,
      { imports: [Select] },
    );
    expect(control().id).not.toBe(control('Other').id);
    expect(control().getAttribute('aria-describedby')).not.toBe(
      control('Other').getAttribute('aria-describedby'),
    );
  });
  it('integrates value/touch/disabled/required with Signal Forms without auto errors', async () => {
    const { fixture } = await render(FormHost);
    const host = fixture.componentInstance;
    expect(host.fields.cycle().invalid()).toBe(true);
    expect(control().getAttribute('aria-required')).toBe('true');
    expect(control().getAttribute('aria-invalid')).toBeNull();
    await choose('Yearly');
    expect(host.data().cycle).toBe(2);
    expect(host.fields.cycle().touched()).toBe(false);
    fireEvent.blur(control());
    expect(host.fields.cycle().touched()).toBe(true);
    host.data.set({ cycle: 'MONTHLY' });
    fixture.detectChanges();
    expect(display()).toBe('Monthly');
    host.error.set('Visible error');
    host.isDisabled.set(true);
    fixture.detectChanges();
    expect(control().disabled).toBe(true);
    expect(control().getAttribute('aria-invalid')).toBe('true');
  });
});
