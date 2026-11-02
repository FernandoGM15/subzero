import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { Component, inject, signal } from '@angular/core';
import { z } from 'zod';
import { Button } from '../button';
import { DatePicker } from '../date-picker';
import { Input, type InputType } from '../input';
import { MoneyInput } from '../money-input';
import { ModalFrame } from './modal-frame';
import type {
  ModalConfirmationOptions,
  ModalInputOptions,
  ModalMessageOptions,
} from './modal.types';

@Component({
  imports: [ModalFrame, Button],
  template: `
    <app-modal-frame>
      <h2 class="text-lg font-semibold">{{ data.title }}</h2>
      <p class="mt-2">{{ data.message }}</p>
      <div class="mt-4 flex justify-end">
        <app-button (click)="ref.close()">{{ data.acceptLabel ?? 'OK' }}</app-button>
      </div>
    </app-modal-frame>
  `,
})
export class MessageModal {
  protected readonly data = inject<ModalMessageOptions>(DIALOG_DATA);
  protected readonly ref = inject<DialogRef<void>>(DialogRef);
}

@Component({
  imports: [ModalFrame, Button],
  template: `
    <app-modal-frame>
      <h2 class="text-lg font-semibold">{{ data.title }}</h2>
      <p class="mt-2">{{ data.message }}</p>
      <div class="mt-4 flex justify-end gap-2">
        <app-button variant="secondary" (click)="ref.close(false)">
          {{ data.cancelLabel ?? 'Cancel' }}
        </app-button>
        <app-button (click)="ref.close(true)">{{ data.acceptLabel ?? 'Confirm' }}</app-button>
      </div>
    </app-modal-frame>
  `,
})
export class ConfirmationModal {
  protected readonly data = inject<ModalConfirmationOptions>(DIALOG_DATA);
  protected readonly ref = inject<DialogRef<boolean>>(DialogRef);
}

@Component({
  imports: [ModalFrame, Button, Input, DatePicker, MoneyInput],
  template: `
    <app-modal-frame>
      <h2 class="text-lg font-semibold">{{ data.title }}</h2>
      <p class="mt-2">{{ data.message }}</p>
      <div class="mt-4">
        @if (data.type === 'currency') {
          <app-money-input
            [label]="data.label"
            [value]="moneyValue()"
            (valueChange)="moneyValue.set($event); error.set(undefined)"
            [required]="!data.isOptional"
            [error]="error()"
          />
        } @else if (data.type === 'date') {
          <app-date-picker
            [label]="data.label"
            [value]="textValue()"
            (valueChange)="textValue.set($event); error.set(undefined)"
            [required]="!data.isOptional"
            [error]="error()"
          />
        } @else {
          <app-input
            [type]="textType"
            [label]="data.label"
            [value]="textValue()"
            (valueChange)="textValue.set($event); error.set(undefined)"
            [required]="!data.isOptional"
            [error]="error()"
          />
        }
      </div>
      <div class="mt-4 flex justify-end gap-2">
        <app-button variant="secondary" (click)="ref.close()">
          {{ data.cancelLabel ?? 'Cancel' }}
        </app-button>
        <app-button (click)="accept()">{{ data.acceptLabel ?? 'OK' }}</app-button>
      </div>
    </app-modal-frame>
  `,
})
export class InputModal {
  protected readonly data = inject<ModalInputOptions>(DIALOG_DATA);
  protected readonly ref = inject<DialogRef<string | number | null>>(DialogRef);
  protected readonly textValue = signal(
    typeof this.data.preload === 'string' ? this.data.preload : '',
  );
  protected readonly moneyValue = signal(
    typeof this.data.preload === 'number' ? this.data.preload : null,
  );
  protected readonly error = signal<string | undefined>(undefined);
  protected get textType(): InputType {
    return this.data.type === 'currency' || this.data.type === 'date' ? 'text' : this.data.type;
  }
  protected accept(): void {
    const value = this.data.type === 'currency' ? this.moneyValue() : this.textValue();
    const empty = value === null || (typeof value === 'string' && value.trim() === '');
    if (empty && !this.data.isOptional) {
      this.error.set('This field is required.');
      return;
    }
    if (!empty && this.data.type === 'date' && !z.iso.date().safeParse(value).success) {
      this.error.set('Enter a valid date.');
      return;
    }
    if (!empty && this.data.type === 'email' && !z.email().safeParse(value).success) {
      this.error.set('Enter a valid email address.');
      return;
    }
    if (
      !empty &&
      this.data.type === 'currency' &&
      (typeof value !== 'number' || !Number.isSafeInteger(value))
    ) {
      this.error.set('Enter a valid amount.');
      return;
    }
    if (!empty && this.data.schema) {
      const result = this.data.schema.safeParse(value as never);
      if (!result.success) {
        this.error.set(result.error.issues[0]?.message ?? 'Invalid value.');
        return;
      }
    }
    this.ref.close(value);
  }
}
