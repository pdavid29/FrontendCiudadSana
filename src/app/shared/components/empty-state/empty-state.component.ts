import { Component, input } from '@angular/core';
@Component({
  selector: 'app-empty-state',
  standalone: true,
  template: `<div class="empty-state">
    <span aria-hidden="true">{{ icon() }}</span
    ><strong>{{ title() }}</strong>
    <p>{{ message() }}</p>
    <ng-content />
  </div>`,
})
export class EmptyStateComponent {
  readonly title = input.required<string>();
  readonly message = input.required<string>();
  readonly icon = input('⌕');
}
