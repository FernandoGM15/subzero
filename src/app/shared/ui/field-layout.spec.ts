import { Component } from '@angular/core';
import { By } from '@angular/platform-browser';
import { render } from '@testing-library/angular';
import { of } from 'rxjs';
import { Input } from './input';
import { MoneyInput } from './money-input';
import { Select } from './select';
import { Autocomplete, type AutocompleteFn } from './autocomplete';
import { DatePicker } from './date-picker';

@Component({
  imports: [Input, MoneyInput, Select, Autocomplete, DatePicker],
  template: `
    <app-input label="Name" value="Initial" />
    <app-money-input label="Amount" [value]="1250" />
    <app-select label="Cycle" [options]="options" value="monthly" />
    <app-autocomplete label="Company" [autocompleteFn]="search" [value]="company" />
    <app-date-picker label="Start date" value="2026-10-16" />
  `,
})
class FieldLayoutHost {
  readonly options = [{ label: 'Monthly', value: 'monthly' }];
  readonly company = { label: 'Company', value: 1 };
  readonly search: AutocompleteFn = () => of([]);
}

describe('Shared field layout', () => {
  it('makes every field fill its container without a component-specific minimum width', async () => {
    const { fixture } = await render(FieldLayoutHost);
    for (const selector of [
      'app-input',
      'app-money-input',
      'app-select',
      'app-autocomplete',
      'app-date-picker',
    ]) {
      const host = (fixture.nativeElement as HTMLElement).querySelector(selector)!;
      for (const token of ['block', 'w-full', 'min-w-0', 'max-w-full']) {
        expect(host.classList.contains(token), `${selector}: ${token}`).toBe(true);
      }
      expect(host.classList.contains('w-48')).toBe(false);
      expect(host.classList.contains('shrink-0')).toBe(false);
    }
  });

  it('preserves each field value independently of the common layout policy', async () => {
    const { fixture } = await render(FieldLayoutHost);
    for (const [type, value] of [
      [Input, 'Initial'],
      [MoneyInput, 1250],
      [Select, 'monthly'],
      [Autocomplete, fixture.componentInstance.company],
      [DatePicker, '2026-10-16'],
    ] as const) {
      expect(fixture.debugElement.query(By.directive(type)).componentInstance.value()).toEqual(
        value,
      );
    }
  });
});
