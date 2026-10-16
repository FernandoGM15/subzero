import { Component, signal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { fireEvent, render, screen } from '@testing-library/angular';
import { MoneyInput } from './money-input';

@Component({
  imports: [MoneyInput, FormField],
  template: `
    <app-money-input label="Amount" [formField]="fields.amount" />
  `,
})
class FormHost {
  readonly data = signal<{ amount: number | null }>({ amount: 1250 });
  readonly fields = form(this.data);
}

describe('MoneyInput', () => {
  it('converts dot decimals to integer cents and empty input to null', async () => {
    const { fixture } = await render(MoneyInput, { inputs: { label: 'Amount' } });
    const input = screen.getByRole('textbox', { name: 'Amount' }) as HTMLInputElement;
    expect(input.inputMode).toBe('decimal');
    for (const [text, cents] of [
      ['12.50', 1250],
      ['0.29', 29],
      ['12.', 1200],
      ['.5', 50],
      ['', null],
    ] as const) {
      fireEvent.input(input, { target: { value: text } });
      expect(fixture.componentInstance.value()).toBe(cents);
      expect(input.value).toBe(text);
    }
  });

  it.each(['12,50', '1.234', '1e2', 'abc', '90071992547409.92'])(
    'rejects %s without changing the previous value',
    async (text) => {
      const { fixture } = await render(MoneyInput, { inputs: { label: 'Amount', value: 1250 } });
      const input = screen.getByRole('textbox', { name: 'Amount' }) as HTMLInputElement;
      fireEvent.input(input, { target: { value: text } });
      expect(input.value).toBe('12.50');
      expect(fixture.componentInstance.value()).toBe(1250);
    },
  );

  it('preserves partial edits and formats on blur, including negative cents', async () => {
    const { fixture } = await render(MoneyInput, { inputs: { label: 'Amount' } });
    const input = screen.getByRole('textbox', { name: 'Amount' }) as HTMLInputElement;
    for (const text of ['-', '.', '-.']) {
      fireEvent.input(input, { target: { value: text } });
      expect(fixture.componentInstance.value()).toBeNull();
      expect(input.value).toBe(text);
    }
    fireEvent.blur(input);
    expect(input.value).toBe('');
    fireEvent.input(input, { target: { value: '-0.29' } });
    expect(fixture.componentInstance.value()).toBe(-29);
    fireEvent.blur(input);
    expect(input.value).toBe('-0.29');
    fireEvent.input(input, { target: { value: '12.' } });
    fireEvent.blur(input);
    expect(input.value).toBe('12.00');
  });

  it('does not change a disabled value', async () => {
    const { fixture } = await render(MoneyInput, {
      inputs: { label: 'Amount', value: 10, disabled: true },
    });
    const input = screen.getByRole('textbox', { name: 'Amount' }) as HTMLInputElement;
    expect(input.disabled).toBe(true);
    fireEvent.input(input, { target: { value: '2' } });
    expect(fixture.componentInstance.value()).toBe(10);
    expect(input.value).toBe('0.10');
  });

  it('groups while typing and keeps the caret beside the edited digit', async () => {
    const { fixture } = await render(MoneyInput, { inputs: { label: 'Amount' } });
    const input = screen.getByRole('textbox', { name: 'Amount' }) as HTMLInputElement;
    input.value = '1234567.89';
    input.setSelectionRange(7, 7);
    fireEvent.input(input);
    expect(input.value).toBe('1,234,567.89');
    expect(input.selectionStart).toBe(9);
    expect(fixture.componentInstance.value()).toBe(123456789);
    input.value = '1,2934,567.89';
    input.setSelectionRange(4, 4);
    fireEvent.input(input, { inputType: 'insertText', data: '9' });
    expect(input.value).toBe('12,934,567.89');
    expect(input.selectionStart).toBe(4);
    expect(fixture.componentInstance.value()).toBe(1293456789);
  });

  it.each([
    ['deleteContentBackward', 2, 0, 2],
    ['deleteContentForward', 1, 1, 3],
  ] as const)(
    'deletes the adjacent digit across a comma with %s',
    async (inputType, caret, start, end) => {
      const { fixture } = await render(MoneyInput, { inputs: { label: 'Amount', value: 123456 } });
      const input = screen.getByRole('textbox', { name: 'Amount' }) as HTMLInputElement;
      input.setSelectionRange(caret, caret);
      fireEvent(input, new InputEvent('beforeinput', { bubbles: true, inputType }));
      expect(input.selectionStart).toBe(start);
      expect(input.selectionEnd).toBe(end);
      // jsdom does not execute the browser's native editing default action.
      input.setRangeText('', start, end, 'end');
      fireEvent.input(input, { inputType });
      expect(input.value).toBe(inputType === 'deleteContentBackward' ? '234.56' : '134.56');
      expect(fixture.componentInstance.value()).toBe(
        inputType === 'deleteContentBackward' ? 23456 : 13456,
      );
    },
  );

  it('preserves a selected range when regrouping', async () => {
    await render(MoneyInput, { inputs: { label: 'Amount' } });
    const input = screen.getByRole('textbox', { name: 'Amount' }) as HTMLInputElement;
    input.value = '1234567';
    input.setSelectionRange(1, 5, 'backward');
    fireEvent.input(input);
    expect(input.value).toBe('1,234,567');
    expect(input.selectionStart).toBe(1);
    expect(input.selectionEnd).toBe(7);
    expect(input.selectionDirection).toBe('backward');
  });

  it('accepts grouped paste and groups external values', async () => {
    const { fixture } = await render(MoneyInput, { inputs: { label: 'Amount', value: 123456 } });
    const input = screen.getByRole('textbox', { name: 'Amount' }) as HTMLInputElement;
    expect(input.value).toBe('1,234.56');
    fireEvent.input(input, { target: { value: '1,234,567.89' }, inputType: 'insertFromPaste' });
    expect(fixture.componentInstance.value()).toBe(123456789);
    fireEvent.blur(input);
    expect(input.value).toBe('1,234,567.89');
  });

  it('supports Signal Forms, external updates and touch on blur', async () => {
    const { fixture } = await render(FormHost);
    const input = screen.getByRole('textbox', { name: 'Amount' }) as HTMLInputElement;
    expect(input.value).toBe('12.50');
    fireEvent.input(input, { target: { value: '0.29' } });
    expect(fixture.componentInstance.data().amount).toBe(29);
    fireEvent.blur(input);
    expect(fixture.componentInstance.fields.amount().touched()).toBe(true);
    fixture.componentInstance.data.set({ amount: 999 });
    fixture.detectChanges();
    expect(input.value).toBe('9.99');
  });

  it('preserves disabled/readonly state and accessible messages', async () => {
    const { fixture } = await render(MoneyInput, {
      inputs: {
        label: 'Amount',
        value: 100,
        readonly: true,
        error: 'Invalid amount',
        required: true,
      },
    });
    const input = screen.getByRole('textbox', { name: /Amount/ }) as HTMLInputElement;
    expect(input.readOnly).toBe(true);
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(document.getElementById(input.getAttribute('aria-describedby')!)?.textContent).toBe(
      'Invalid amount',
    );
    fireEvent.input(input, { target: { value: '2' } });
    expect(fixture.componentInstance.value()).toBe(100);
    expect(input.value).toBe('1.00');
  });
});
