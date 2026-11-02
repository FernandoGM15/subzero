import { Component } from '@angular/core';

@Component({
  selector: 'app-modal-frame',
  host: { class: 'block w-full max-w-lg rounded-control bg-surface p-6 text-foreground shadow-xl' },
  template: '<ng-content />',
})
export class ModalFrame {}
