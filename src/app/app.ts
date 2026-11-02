import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Button } from './shared/ui/button';
import { Spinner } from './shared/ui/spinner';
import { Input } from './shared/ui/input';
import { Select, SelectOption } from './shared/ui/select';
import { Autocomplete, AutocompleteFn } from './shared/ui/autocomplete';
import { of } from 'rxjs';
import { MoneyInput } from './shared/ui/money-input';
import { DatePicker } from './shared/ui/date-picker';
import { Card } from './shared/ui/card';
import { Badge } from './shared/ui/badge';

@Component({
  imports: [
    RouterOutlet,
    Button,
    Spinner,
    Input,
    Select,
    Autocomplete,
    MoneyInput,
    DatePicker,
    Card,
    Badge,
  ],
  selector: 'app-root',
  template: `
    <div class="flex flex-col p-4">
      <span class="text-xl mb-2">Buttons</span>
      <div class="flex gap-2 ">
        <app-button variant="primary">Primary</app-button>
        <app-button variant="secondary">Secondary</app-button>
        <app-button variant="danger">Danger</app-button>
        <app-button variant="ghost">Ghost</app-button>
        <app-button variant="primary" [loading]="isLoading()">Loading</app-button>
      </div>

      <span class="text-xl mb-2 mt-2">Spinner</span>
      <div class="flex gap-2">
        <app-spinner size="lg" />
      </div>

      <span class="text-xl mb-2 mt-2">Inputs</span>
      <div class="field-grid gap-2">
        <app-input label="Text" type="text" placeholder="input a text here..." clearable />
        <app-input label="Password" type="password" />
        <app-input label="Email" type="email" />
        <app-input label="Search" type="search" />
        <app-money-input label="Pago minimo" />
        <app-date-picker label="Fecha de pago" locale="es-MX" />
      </div>

      <span class="text-xl mb-2 mt-2">Select</span>
      <div class="field-grid gap-2">
        <app-select label="Select" [options]="selectItems()" />
      </div>

      <span class="text-xl mb-2 mt-2">Autocomplete</span>
      <div class="field-grid gap-2">
        <app-autocomplete label="Select a company" [autocompleteFn]="autocompleteFn" clearable />
      </div>

      <span class="text-xl mb-2 mt-2">Badge</span>
      <div class="flex flex-wrap gap-2">
        <app-badge>Neutral</app-badge>
        <app-badge variant="success">Success</app-badge>
        <app-badge variant="warning">Warning</app-badge>
        <app-badge variant="danger">Danger</app-badge>
      </div>

      <span class="text-xl mb-2 mt-2">Card</span>
      <app-card class="max-w-sm">
        <div cardImage class="flex h-32 items-center justify-center bg-surface-muted">
          <img src="favicon.ico" alt="SubZero logo" class="size-16" />
        </div>
        <h2 cardTitle class="text-lg font-semibold">Subscription</h2>
        <p cardContent>Manage your recurring expenses in one place.</p>
        <div cardFooter>
          <app-button variant="secondary">View details</app-button>
        </div>
      </app-card>
    </div>
  `,
})
export class App {
  isLoading = signal(true);
  readonly autocompleteFn: AutocompleteFn = (search) => {
    console.log({ search });

    return of([
      {
        label: 'heb',
        value: 1,
      },
      {
        label: 'Soriana',
        value: 2,
      },
    ]);
  };

  selectItems = signal<SelectOption[]>([
    {
      label: 'Coffe',
      value: 'coffe',
    },
    {
      label: 'Milk',
      value: 'milk',
    },
    {
      label: 'Sugar',
      value: 'sugar',
    },
  ]);
}
