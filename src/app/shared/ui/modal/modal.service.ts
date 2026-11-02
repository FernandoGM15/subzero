import { Dialog, type DialogRef } from '@angular/cdk/dialog';
import type { ComponentType } from '@angular/cdk/overlay';
import { inject, Injectable } from '@angular/core';
import { takeUntil } from 'rxjs';
import { ConfirmationModal, InputModal, MessageModal } from './modal-components';
import type {
  CurrencyModalOptions,
  ModalConfirmationOptions,
  ModalMessageOptions,
  TextModalOptions,
} from './modal.types';

@Injectable({ providedIn: 'root' })
export class ModalService {
  private readonly dialog = inject(Dialog);

  openMessage(options: ModalMessageOptions): DialogRef<void, MessageModal> {
    return this.open(MessageModal, options, options.title);
  }
  openConfirmation(options: ModalConfirmationOptions): DialogRef<boolean, ConfirmationModal> {
    return this.open(ConfirmationModal, options, options.title, false);
  }
  openInput(options: CurrencyModalOptions): DialogRef<number | null, InputModal>;
  openInput(options: TextModalOptions): DialogRef<string, InputModal>;
  openInput(
    options: CurrencyModalOptions | TextModalOptions,
  ): DialogRef<string, InputModal> | DialogRef<number | null, InputModal> {
    if (options.type === 'currency')
      return this.open<number | null, CurrencyModalOptions, InputModal>(
        InputModal,
        options,
        options.title,
      );
    return this.open<string, TextModalOptions, InputModal>(InputModal, options, options.title);
  }
  openModal<R, D, C>(
    component: ComponentType<C>,
    options: { data: D; ariaLabel: string },
  ): DialogRef<R, C> {
    return this.open(component, options.data, options.ariaLabel);
  }
  private open<R, D, C>(
    component: ComponentType<C>,
    data: D,
    ariaLabel: string,
    escapeResult?: R,
  ): DialogRef<R, C> {
    const ref = this.dialog.open<R, D, C>(component, {
      data,
      ariaLabel,
      disableClose: true,
      maxWidth: 'calc(100vw - 2rem)',
      width: '32rem',
    });
    ref.keydownEvents.pipe(takeUntil(ref.closed)).subscribe((event) => {
      if (
        event.key === 'Escape' &&
        !event.altKey &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.shiftKey
      ) {
        event.preventDefault();
        ref.close(escapeResult);
      }
    });
    return ref;
  }
}
