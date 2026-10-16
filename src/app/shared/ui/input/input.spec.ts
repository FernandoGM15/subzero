import { Component, signal } from '@angular/core';
import { disabled, form, FormField, readonly, required } from '@angular/forms/signals';
import { fireEvent, render, screen } from '@testing-library/angular';
import { CONTROL, type ControlSize } from '../sizing';
import { Input, type InputType } from './input';

@Component({
  imports: [Input],
  template: `
    <app-input label="Search" [(value)]="text" />
  `,
})
class StandaloneHost {
  readonly text = signal('Initial');
}

@Component({
  imports: [Input, FormField],
  template: `
    <app-input label="Name" [type]="type()" [formField]="fields.name" [error]="visibleError()" />
  `,
})
class FormHost {
  readonly type = signal<InputType>('text');
  readonly data = signal({ name: '' });
  readonly isDisabled = signal(false);
  readonly isReadonly = signal(false);
  readonly visibleError = signal<string | undefined>(undefined);
  readonly fields = form(this.data, (path) => {
    required(path.name);
    disabled(path.name, () => this.isDisabled());
    readonly(path.name, () => this.isReadonly());
  });
}

function control(label = 'Name'): HTMLInputElement {
  return (screen.queryByRole('textbox', { name: label }) ??
    screen.queryByRole('searchbox', { name: label }) ??
    screen.getByLabelText(label)) as HTMLInputElement;
}

function labelFor(element: HTMLInputElement): HTMLLabelElement {
  return element.labels![0];
}

describe('Input', () => {
  it('renders an associated visible label and a default text input', async () => {
    await render(Input, { inputs: { label: 'Name' } });
    const element = control();
    expect(element.type).toBe('text');
    expect(element.value).toBe('');
    expect(element.disabled).toBe(false);
    expect(labelFor(element).htmlFor).toBe(element.id);
    expect(labelFor(element).textContent?.trim()).toBe('Name');
    expect(element.getAttribute('aria-describedby')).toBeNull();
  });

  it('clears its value when clearable and keeps focus on the input', async () => {
    const { fixture } = await render(Input, {
      inputs: { label: 'Name', value: 'Selected text', clearable: true },
    });
    const element = control();
    expect(element.className).toContain('pr-10');

    fireEvent.click(screen.getByRole('button', { name: 'Clear input' }));

    expect(fixture.componentInstance.value()).toBe('');
    expect(element.value).toBe('');
    expect(document.activeElement).toBe(element);
    expect(screen.queryByRole('button', { name: 'Clear input' })).toBeNull();
    expect(element.classList.contains('pr-10')).toBe(true);
  });

  it('reserves clear-button space when clearable and empty', async () => {
    await render(Input, { inputs: { label: 'Name', clearable: true } });
    expect(control().className).toContain('pr-10');
    expect(screen.queryByRole('button', { name: 'Clear input' })).toBeNull();
  });

  it('does not show the clear action by default', async () => {
    await render(Input, { inputs: { label: 'Name', value: 'Selected text' } });
    expect(screen.queryByRole('button', { name: 'Clear input' })).toBeNull();
  });

  it('hides the clear action when disabled or readonly', async () => {
    await render(
      `<app-input label="Disabled" value="Selected text" clearable disabled />
       <app-input label="Readonly" value="Selected text" clearable readonly />`,
      { imports: [Input] },
    );
    expect(screen.queryByRole('button', { name: 'Clear input' })).toBeNull();
  });

  it.each(['text', 'email', 'password', 'search'] as const)('supports %s', async (type) => {
    await render(Input, { inputs: { label: 'Name', type } });
    expect(control().type).toBe(type);
  });

  it('indicates focus through a subtle border without an extra outline', async () => {
    const { rerender } = await render(Input, { inputs: { label: 'Name' } });
    const wrapper = control().parentElement!;
    fireEvent.focus(control());
    expect(wrapper.className).toContain('focus-within:border-ring');
    expect(wrapper.className).not.toContain('focus-within:outline');
    expect(control().className).toContain('outline-none');
    await rerender({ inputs: { label: 'Name', error: 'Visible error' } });
    expect(wrapper.className).toContain('focus-within:border-danger');
    expect(wrapper.className).not.toContain('focus-within:border-ring');
  });

  it.each(['xs', 'sm', 'md', 'lg'] as ControlSize[])('uses shared %s sizing', async (size) => {
    await render(Input, { inputs: { label: 'Name', size } });
    const element = control();
    for (const token of [CONTROL[size].height, CONTROL[size].paddingX, CONTROL[size].text]) {
      expect(element.className).toContain(token);
    }
  });

  it('floats on focus, gates the placeholder and lowers only when empty on blur', async () => {
    await render(Input, { inputs: { label: 'Name', placeholder: 'Service name' } });
    const element = control();
    const label = labelFor(element);
    expect(label.dataset['floating']).toBe('false');
    expect(element.placeholder).toBe('');
    fireEvent.focus(element);
    expect(label.dataset['floating']).toBe('true');
    expect(element.placeholder).toBe('Service name');
    fireEvent.input(element, { target: { value: 'Netflix' } });
    fireEvent.blur(element);
    expect(label.dataset['floating']).toBe('true');
    fireEvent.input(element, { target: { value: '' } });
    expect(label.dataset['floating']).toBe('false');
    expect(element.placeholder).toBe('');
  });

  it('supports two-way binding, external updates and unmodified whitespace/case', async () => {
    const { fixture } = await render(StandaloneHost);
    const element = control('Search');
    expect(element.value).toBe('Initial');
    expect(labelFor(element).dataset['floating']).toBe('true');
    fireEvent.input(element, { target: { value: '  MiXeD  ' } });
    expect(fixture.componentInstance.text()).toBe('  MiXeD  ');
    fixture.componentInstance.text.set('');
    fixture.detectChanges();
    expect(element.value).toBe('');
    expect(labelFor(element).dataset['floating']).toBe('false');
    fixture.componentInstance.text.set('External');
    fixture.detectChanges();
    expect(element.value).toBe('External');
    expect(labelFor(element).dataset['floating']).toBe('true');
  });

  it('preserves passwords without normalization', async () => {
    const { fixture } = await render(Input, { inputs: { label: 'Name', type: 'password' } });
    fireEvent.input(control(), { target: { value: '  SeCrEt  ' } });
    expect(fixture.componentInstance.value()).toBe('  SeCrEt  ');
  });

  it('preserves native email whitespace sanitization when updating Signal Forms', async () => {
    const { fixture } = await render(FormHost);
    const host = fixture.componentInstance;
    host.type.set('email');
    fixture.detectChanges();
    const element = control();
    fireEvent.input(element, { target: { value: '  MiXeD@example.com  ' } });
    expect(element.type).toBe('email');
    expect(element.value).toBe('MiXeD@example.com');
    expect(host.data().name).toBe('MiXeD@example.com');
  });

  it('replaces helper text with the externally supplied accessible error', async () => {
    const { rerender } = await render(Input, { inputs: { label: 'Name', helperText: 'Help' } });
    const element = control();
    const messageId = element.getAttribute('aria-describedby')!;
    expect(document.getElementById(messageId)?.textContent?.trim()).toBe('Help');
    expect(element.getAttribute('aria-invalid')).toBeNull();
    await rerender({ inputs: { label: 'Name', helperText: 'Help', error: 'Visible error' } });
    expect(screen.queryByText('Help')).toBeNull();
    expect(document.getElementById(messageId)?.textContent?.trim()).toBe('Visible error');
    expect(element.getAttribute('aria-invalid')).toBe('true');
    await rerender({ inputs: { label: 'Name', helperText: 'Help', error: undefined } });
    expect(screen.getByText('Help')).toBeTruthy();
    expect(element.getAttribute('aria-invalid')).toBeNull();
  });

  it('reserves a message line by default without describing an empty region', async () => {
    const { container, rerender } = await render(Input, { inputs: { label: 'Name' } });
    expect(container.querySelector('[data-message-space]')?.className).toContain('min-h');
    expect(control().getAttribute('aria-describedby')).toBeNull();
    await rerender({ inputs: { label: 'Name', reserveMessageSpace: false } });
    expect(container.querySelector('[data-message-space]')).toBeNull();
    await rerender({
      inputs: { label: 'Name', reserveMessageSpace: false, helperText: 'Long help can wrap' },
    });
    expect(screen.getByText('Long help can wrap')).toBeTruthy();
  });

  it('accepts bare boolean attributes and communicates required independently of errors', async () => {
    await render(`<app-input label="Name" required readonly />`, { imports: [Input] });
    const element = control();
    expect(element.required).toBe(true);
    expect(element.readOnly).toBe(true);
    expect(element.disabled).toBe(false);
    expect(element.getAttribute('aria-required')).toBe('true');
    expect(element.getAttribute('aria-invalid')).toBeNull();
    expect(labelFor(element).querySelector('[aria-hidden="true"]')?.textContent).toBe('*');
  });

  it('disables the native control and attenuates its wrapper', async () => {
    await render(`<app-input label="Name" disabled />`, { imports: [Input] });
    const element = control();
    expect(element.disabled).toBe(true);
    expect(element.parentElement?.className).toContain('opacity-50');
  });

  it('forwards programmatic focus and emits touch only on blur', async () => {
    const { fixture } = await render(Input, { inputs: { label: 'Name' } });
    const touched = vi.fn();
    fixture.componentInstance.touch.subscribe(touched);
    fixture.componentInstance.focus();
    expect(document.activeElement).toBe(control());
    expect(touched).not.toHaveBeenCalled();
    fireEvent.blur(control());
    expect(touched).toHaveBeenCalledTimes(1);
  });

  it('gives multiple instances distinct label and message associations', async () => {
    await render(
      `<app-input label="First" helperText="First help" />
       <app-input label="Second" helperText="Second help" />`,
      { imports: [Input] },
    );
    const first = control('First');
    const second = control('Second');
    expect(first.id).not.toBe(second.id);
    expect(first.getAttribute('aria-describedby')).not.toBe(
      second.getAttribute('aria-describedby'),
    );
    expect(labelFor(first).htmlFor).toBe(first.id);
    expect(labelFor(second).htmlFor).toBe(second.id);
  });

  it('integrates value, touch and state with Signal Forms without choosing error timing', async () => {
    const { fixture } = await render(FormHost);
    const host = fixture.componentInstance;
    const element = control();
    expect(host.fields.name().invalid()).toBe(true);
    expect(element.getAttribute('aria-invalid')).toBeNull();
    expect(element.required).toBe(true);
    fireEvent.focus(element);
    expect(host.fields.name().touched()).toBe(false);
    fireEvent.input(element, { target: { value: '  Netflix  ' } });
    expect(host.data().name).toBe('  Netflix  ');
    fireEvent.blur(element);
    expect(host.fields.name().touched()).toBe(true);
    host.data.set({ name: 'External' });
    host.isReadonly.set(true);
    fixture.detectChanges();
    expect(element.value).toBe('External');
    expect(element.readOnly).toBe(true);
    host.isDisabled.set(true);
    host.visibleError.set('Consumer error');
    fixture.detectChanges();
    expect(element.disabled).toBe(true);
    expect(element.getAttribute('aria-invalid')).toBe('true');
    expect(screen.getByText('Consumer error')).toBeTruthy();
  });
});
