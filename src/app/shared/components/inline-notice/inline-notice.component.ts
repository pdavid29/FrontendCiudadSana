import { Component, input } from '@angular/core';
@Component({
  selector: 'app-inline-notice',
  standalone: true,
  template: `<div
    class="alert"
    [class.alert-error]="tone() === 'error'"
    [class.alert-success]="tone() === 'success'"
    [class.alert-info]="tone() === 'info'"
    [attr.role]="tone() === 'error' ? 'alert' : 'status'"
  >
    <ng-content />
  </div>`,
})
export class InlineNoticeComponent {
  readonly tone = input<'error' | 'success' | 'info'>('info');
}
