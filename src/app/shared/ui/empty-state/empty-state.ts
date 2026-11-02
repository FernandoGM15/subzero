import { Component } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  host: { class: 'flex flex-col items-center gap-2 p-4 text-center text-foreground' },
  template: '<ng-content />',
})
export class EmptyState {}
