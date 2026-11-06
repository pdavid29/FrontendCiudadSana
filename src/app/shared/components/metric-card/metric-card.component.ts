import { Component, input } from '@angular/core';
@Component({
  selector: 'app-metric-card',
  standalone: true,
  template: `<article class="metric-card">
    <div class="metric-top">
      <span class="metric-icon" [class]="'metric-icon ' + tone()">{{ icon() }}</span
      ><span class="metric-note">{{ note() }}</span>
    </div>
    <p>{{ label() }}</p>
    <strong>{{ value() }}</strong>
  </article>`,
})
export class MetricCardComponent {
  readonly label = input.required<string>();
  readonly value = input.required<string | number>();
  readonly icon = input('•');
  readonly note = input('');
  readonly tone = input('blue');
}
