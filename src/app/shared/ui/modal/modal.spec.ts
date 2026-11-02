import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { ModalService } from './modal.service';

describe('ModalService', () => {
  it('returns false when confirmation is cancelled', async () => {
    const service = TestBed.inject(ModalService);
    const ref = service.openConfirmation({ title: 'Delete', message: 'Continue?' });
    const result = firstValueFrom(ref.closed);
    TestBed.tick();
    const cancel = Array.from(document.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Cancel'),
    );
    cancel?.click();
    expect(await result).toBe(false);
  });
});

describe('ModalService input', () => {
  it('requires text and returns the preloaded value', async () => {
    const ref = TestBed.inject(ModalService).openInput({
      type: 'text',
      title: 'Name',
      message: 'Enter name',
      label: 'Name',
      preload: 'Example',
    });
    const result = firstValueFrom(ref.closed);
    TestBed.tick();
    const input = document.querySelector<HTMLInputElement>('input')!;
    expect(input.value).toBe('Example');
    const accept = Array.from(document.querySelectorAll('button')).find(
      (b) => b.textContent?.trim() === 'OK',
    )!;
    input.value = '';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    TestBed.tick();
    accept.click();
    TestBed.tick();
    expect(document.body.textContent).toContain('This field is required.');
    input.value = 'Updated';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    TestBed.tick();
    expect(input.closest('app-input')?.textContent).not.toContain('This field is required.');
    expect(input.getAttribute('aria-invalid')).toBeNull();
    accept.click();
    expect(await result).toBe('Updated');
  });

  it('accepts an optional empty value without running the schema', async () => {
    const { z } = await import('zod');
    const ref = TestBed.inject(ModalService).openInput({
      type: 'text',
      title: 'Note',
      message: 'Optional',
      label: 'Note',
      isOptional: true,
      schema: z.string().min(3),
    });
    const result = firstValueFrom(ref.closed);
    TestBed.tick();
    Array.from(document.querySelectorAll('button'))
      .find((b) => b.textContent?.trim() === 'OK')!
      .click();
    expect(await result).toBe('');
  });

  it('returns a zero currency value rather than treating it as empty', async () => {
    const ref = TestBed.inject(ModalService).openInput({
      type: 'currency',
      title: 'Amount',
      message: 'Enter amount',
      label: 'Amount',
      preload: 0,
    });
    const result = firstValueFrom(ref.closed);
    TestBed.tick();
    Array.from(document.querySelectorAll('button'))
      .find((b) => b.textContent?.trim() === 'OK')!
      .click();
    expect(await result).toBe(0);
  });
});

describe('ModalService dismissal', () => {
  it('ignores backdrop clicks and maps Escape to cancellation', async () => {
    const ref = TestBed.inject(ModalService).openConfirmation({
      title: 'Delete',
      message: 'Continue?',
    });
    const result = firstValueFrom(ref.closed);
    TestBed.tick();
    ref.overlayRef.backdropElement!.click();
    TestBed.tick();
    expect(ref.overlayRef.hasAttached()).toBe(true);
    ref.overlayRef.overlayElement.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', keyCode: 27, bubbles: true }),
    );
    expect(await result).toBe(false);
  });
});

describe('ModalService validation', () => {
  it('rejects values that fail the consumer schema', async () => {
    const { z } = await import('zod');
    const ref = TestBed.inject(ModalService).openInput({
      type: 'text',
      title: 'Name',
      message: 'Enter name',
      label: 'Name',
      preload: 'A',
      schema: z.string().min(3, 'Too short'),
    });
    TestBed.tick();
    Array.from(document.querySelectorAll('button'))
      .find((b) => b.textContent?.trim() === 'OK')!
      .click();
    TestBed.tick();
    expect(document.body.textContent).toContain('Too short');
    expect(ref.overlayRef.hasAttached()).toBe(true);
    ref.close();
  });

  it('returns undefined for a cancelled input', async () => {
    const ref = TestBed.inject(ModalService).openInput({
      type: 'text',
      title: 'Name',
      message: 'Enter name',
      label: 'Name',
    });
    const result = firstValueFrom(ref.closed);
    TestBed.tick();
    Array.from(document.querySelectorAll('button'))
      .find((b) => b.textContent?.trim() === 'Cancel')!
      .click();
    expect(await result).toBeUndefined();
  });
});
