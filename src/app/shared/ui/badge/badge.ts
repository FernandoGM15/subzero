import { Component, computed, input } from '@angular/core';
import { CONTROL } from '../sizing';

export type BadgeVariant = 'neutral' | 'success' | 'warning' | 'danger';

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  neutral: 'bg-badge-neutral text-badge-neutral-foreground',
  success: 'bg-badge-success text-badge-success-foreground',
  warning: 'bg-badge-warning text-badge-warning-foreground',
  danger: 'bg-badge-danger text-badge-danger-foreground',
};

@Component({
  selector: 'app-badge',
  host: { '[class]': 'classes()' },
  template: '<ng-content />',
})
export class Badge {
  readonly variant = input<BadgeVariant>('neutral');
  protected readonly classes = computed(() =>
    [
      'inline-flex items-center rounded-control font-medium',
      CONTROL.xs.height,
      CONTROL.xs.paddingX,
      CONTROL.xs.text,
      VARIANT_CLASSES[this.variant()],
    ].join(' '),
  );
}
