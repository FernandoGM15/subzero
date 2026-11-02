import { Component } from '@angular/core';

@Component({
  selector: 'app-skeleton',
  host: {
    class: 'block rounded-control bg-surface-muted motion-safe:animate-pulse',
    'aria-hidden': 'true',
  },
  template: '',
})
export class Skeleton {}
