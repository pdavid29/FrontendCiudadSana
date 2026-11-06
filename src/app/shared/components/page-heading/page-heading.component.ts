import { Component, input } from '@angular/core';
@Component({
  selector: 'app-page-heading',
  standalone: true,
  template: `<section class="page-heading">
    <div>
      <span class="eyebrow">{{ eyebrow() }}</span>
      <h1>{{ title() }}</h1>
      <p>{{ subtitle() }}</p>
    </div>
    <ng-content select="[pageAction]" />
  </section>`,
})
export class PageHeadingComponent {
  readonly eyebrow = input.required<string>();
  readonly title = input.required<string>();
  readonly subtitle = input.required<string>();
}
