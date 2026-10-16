import { Component, signal } from '@angular/core';
import { disabled, form, FormField, required } from '@angular/forms/signals';
import { fireEvent, render, screen, waitFor } from '@testing-library/angular';
import { of, Subject, throwError } from 'rxjs';
import {
  Autocomplete,
  type AutocompleteFn,
  type AutocompleteOption,
  type AutocompleteRequest,
} from './autocomplete';

const HEB: AutocompleteOption = { label: 'HEB', value: '1234567890' };
const MILK: AutocompleteOption = { label: 'Milk', value: 'milk' };
const SUGAR: AutocompleteOption = { label: 'Sugar', value: 'sugar' };

@Component({
  imports: [Autocomplete, FormField],
  template: `
    <app-autocomplete
      label="Company"
      [autocompleteFn]="searchCompanies"
      [limit]="2"
      clearable
      [formField]="fields.company"
    />
  `,
})
class FormHost {
  readonly data = signal<{ company: AutocompleteOption | null }>({ company: null });
  readonly isDisabled = signal(false);
  readonly requests: AutocompleteRequest[] = [];
  readonly searchCompanies: AutocompleteFn = (request) => {
    this.requests.push(request);
    return of(request.offset === 0 ? [HEB, MILK] : [SUGAR]);
  };
  readonly fields = form(this.data, (path) => {
    required(path.company);
    disabled(path.company, () => this.isDisabled());
  });
}

@Component({
  imports: [Autocomplete],
  template: `
    <app-autocomplete label="Company" [autocompleteFn]="searchCompanies" />
  `,
})
class RaceHost {
  readonly requests: AutocompleteRequest[] = [];
  readonly responses: Subject<readonly AutocompleteOption[]>[] = [];
  readonly searchCompanies: AutocompleteFn = (request) => {
    this.requests.push(request);
    const response = new Subject<readonly AutocompleteOption[]>();
    this.responses.push(response);
    return response;
  };
}

@Component({
  imports: [Autocomplete],
  template: `
    <app-autocomplete
      label="Company"
      [autocompleteFn]="searchCompanies"
      (requestError)="errors.push($event)"
    />
  `,
})
class ErrorHost {
  readonly errors: unknown[] = [];
  readonly failure = new Error('Request failed');
  readonly searchCompanies: AutocompleteFn = () => throwError(() => this.failure);
}

function combobox(): HTMLInputElement {
  return screen.getByRole('combobox', { name: 'Company' }) as HTMLInputElement;
}

describe('Autocomplete', () => {
  it('does not render default guidance when opened before searching', async () => {
    const { fixture } = await render(FormHost);
    fireEvent.focus(combobox());
    fixture.detectChanges();

    expect(combobox().getAttribute('aria-expanded')).toBe('true');
    const listboxId = combobox().getAttribute('aria-controls');
    expect(listboxId).toBeTruthy();
    expect(document.getElementById(listboxId!)?.textContent).toBe('');
  });

  it('debounces searches and writes the selected option object through Signal Forms', async () => {
    const { fixture } = await render(FormHost);
    fireEvent.input(combobox(), { target: { value: 'heb' } });

    expect(fixture.componentInstance.requests).toEqual([]);
    await waitFor(() =>
      expect(fixture.componentInstance.requests).toEqual([{ query: 'heb', offset: 0, limit: 2 }]),
    );

    fireEvent.click(await screen.findByRole('option', { name: 'HEB' }));
    await waitFor(() => expect(fixture.componentInstance.data().company).toBe(HEB));
    expect(combobox().className).toContain('pr-10');

    fireEvent.click(screen.getByRole('button', { name: 'Clear selection' }));
    expect(fixture.componentInstance.data().company).toBeNull();
    expect(combobox().value).toBe('');
    expect(combobox().className).toContain('pr-10');
    expect(fixture.componentInstance.requests).toHaveLength(1);
    expect(screen.queryByRole('button', { name: 'Clear selection' })).toBeNull();
  });

  for (const action of ['mouse', 'keyboard'] as const) {
    it(`loads initial options on a later focus after ${action} clearing`, async () => {
      const { fixture } = await render(FormHost);
      const input = combobox();
      input.focus();
      fireEvent.input(input, { target: { value: 'company' } });
      await waitFor(() => expect(fixture.componentInstance.requests).toHaveLength(1));
      fireEvent.click(await screen.findByRole('option', { name: 'HEB' }));
      await fixture.whenStable();

      const clear = screen.getByRole('button', { name: 'Clear selection' });
      if (action === 'keyboard') {
        clear.focus();
        await fixture.whenStable();
      }
      fireEvent.mouseDown(clear);
      fireEvent.click(clear);
      fixture.detectChanges();
      await new Promise((resolve) => setTimeout(resolve, 300));

      expect(fixture.componentInstance.data().company).toBeNull();
      expect(input.value).toBe('');
      expect(document.activeElement).toBe(input);
      expect(input.getAttribute('aria-expanded')).toBe('false');
      expect(screen.queryByRole('listbox')).toBeNull();
      expect(fixture.componentInstance.requests).toHaveLength(1);

      input.blur();
      await fixture.whenStable();
      input.focus();
      fixture.detectChanges();
      await waitFor(() =>
        expect(fixture.componentInstance.requests).toEqual([
          { query: 'company', offset: 0, limit: 2 },
          { query: '', offset: 0, limit: 2 },
        ]),
      );
      expect(await screen.findByRole('option', { name: 'HEB' })).toBeTruthy();
      expect(await screen.findByRole('option', { name: 'Milk' })).toBeTruthy();
      expect(fixture.componentInstance.data().company).toBeNull();
    });
  }

  it('reserves clear-button space while no option is selected', async () => {
    await render(FormHost);
    expect(combobox().className).toContain('pr-10');
    expect(screen.queryByRole('button', { name: 'Clear selection' })).toBeNull();
  });

  it('loads and appends the next page when the results panel reaches its end', async () => {
    const { fixture } = await render(FormHost);
    fireEvent.input(combobox(), { target: { value: 'company' } });
    await waitFor(() => expect(fixture.componentInstance.requests).toHaveLength(1));

    const listbox = screen.getByRole('listbox');
    expect(screen.queryByRole('button', { name: 'Load more' })).toBeNull();
    Object.defineProperties(listbox, {
      scrollHeight: { configurable: true, value: 320 },
      clientHeight: { configurable: true, value: 250 },
      scrollTop: { configurable: true, value: 100 },
    });
    fireEvent.scroll(listbox);
    await waitFor(() =>
      expect(fixture.componentInstance.requests).toEqual([
        { query: 'company', offset: 0, limit: 2 },
        { query: 'company', offset: 2, limit: 2 },
      ]),
    );
    expect(await screen.findByRole('option', { name: 'Sugar' })).toBeTruthy();

    fireEvent.scroll(listbox);
    expect(fixture.componentInstance.requests).toHaveLength(2);
  });

  it('reflects the Signal Forms disabled state on the input', async () => {
    const { fixture } = await render(FormHost);
    fixture.componentInstance.isDisabled.set(true);
    fixture.detectChanges();

    await waitFor(() => expect(combobox().disabled).toBe(true));
  });

  it('cancels a stale query response when the user changes the search', async () => {
    const { fixture } = await render(RaceHost);
    fireEvent.input(combobox(), { target: { value: 'old query' } });
    await waitFor(() => expect(fixture.componentInstance.requests).toHaveLength(1));

    fireEvent.input(combobox(), { target: { value: 'new query' } });
    fixture.componentInstance.responses[0].next([HEB]);
    expect(screen.queryByRole('option', { name: 'HEB' })).toBeNull();

    await waitFor(() => expect(fixture.componentInstance.requests).toHaveLength(2));
    expect(fixture.componentInstance.requests[1]).toEqual({
      query: 'new query',
      offset: 0,
      limit: 20,
    });
    fixture.componentInstance.responses[1].next([SUGAR]);
    expect(await screen.findByRole('option', { name: 'Sugar' })).toBeTruthy();
    expect(screen.queryByRole('option', { name: 'HEB' })).toBeNull();
  });

  it('keeps the results panel closed until the first options page has rendered', async () => {
    const { fixture } = await render(RaceHost);
    fireEvent.input(combobox(), { target: { value: 'company' } });
    await waitFor(() => expect(fixture.componentInstance.requests).toHaveLength(1));

    fixture.detectChanges();
    expect(screen.queryByRole('listbox')).toBeNull();
    fixture.componentInstance.responses[0].next([HEB]);
    expect(await screen.findByRole('listbox')).toBeTruthy();
    expect(await screen.findByRole('option', { name: 'HEB' })).toBeTruthy();
  });

  it('does not render default feedback when a search returns no options', async () => {
    const { fixture } = await render(RaceHost);
    fireEvent.input(combobox(), { target: { value: 'missing' } });
    await waitFor(() => expect(fixture.componentInstance.requests).toHaveLength(1));
    fixture.componentInstance.responses[0].next([]);
    fixture.detectChanges();

    const listboxId = combobox().getAttribute('aria-controls');
    expect(listboxId).toBeTruthy();
    expect(document.getElementById(listboxId!)?.textContent).toBe('');
  });

  it('reopens the results panel after a subsequent query finishes loading', async () => {
    const { fixture } = await render(RaceHost);
    fireEvent.input(combobox(), { target: { value: 'one' } });
    await waitFor(() => expect(fixture.componentInstance.requests).toHaveLength(1));
    fixture.componentInstance.responses[0].next([HEB]);
    expect(await screen.findByRole('option', { name: 'HEB' })).toBeTruthy();
    expect(combobox().getAttribute('aria-expanded')).toBe('true');

    fireEvent.input(combobox(), { target: { value: 'two' } });
    expect(combobox().getAttribute('aria-expanded')).toBe('true');
    await waitFor(() => expect(fixture.componentInstance.requests).toHaveLength(2));
    fixture.componentInstance.responses[1].next([SUGAR]);

    expect(await screen.findByRole('option', { name: 'Sugar' })).toBeTruthy();
  });

  it('emits request failures without rendering loading or error status messages', async () => {
    const { fixture } = await render(ErrorHost);
    fireEvent.input(combobox(), { target: { value: 'company' } });
    expect(screen.queryByText('Loading options...')).toBeNull();

    await waitFor(() =>
      expect(fixture.componentInstance.errors).toEqual([fixture.componentInstance.failure]),
    );
    expect(screen.queryByText('Could not load options.')).toBeNull();
    expect(screen.queryByText('Could not load more options.')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Retry' })).toBeNull();
  });

  it('does not request an empty query when clearing from a keyboard-focused action', async () => {
    const { fixture } = await render(FormHost);
    fireEvent.input(combobox(), { target: { value: 'company' } });
    await waitFor(() => expect(fixture.componentInstance.requests).toHaveLength(1));
    fireEvent.click(await screen.findByRole('option', { name: 'HEB' }));
    await waitFor(() => expect(fixture.componentInstance.data().company).toBe(HEB));

    const clearButton = screen.getByRole('button', { name: 'Clear selection' });
    clearButton.focus();
    fireEvent.click(clearButton);
    await new Promise((resolve) => setTimeout(resolve, 300));

    expect(fixture.componentInstance.requests.map((request) => request.query)).toEqual(['company']);
    expect(fixture.componentInstance.data().company).toBeNull();
  });
});
