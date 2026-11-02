import { Component } from '@angular/core';

@Component({
  selector: 'app-card',
  host: {
    class:
      'block overflow-hidden rounded-control bg-surface text-foreground inset-ring-1 inset-ring-border [&>[cardImage]]:w-full',
  },
  template: `
    <ng-content select="[cardImage]" />
    <div class="px-4 pt-4 empty:hidden"><ng-content select="[cardTitle]" /></div>
    <div class="p-4">
      <ng-content select="[cardContent]" />
      <ng-content />
    </div>
    <div class="border-t border-border p-4 empty:hidden"><ng-content select="[cardFooter]" /></div>
  `,
})
export class Card {}
