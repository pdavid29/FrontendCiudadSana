import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavComponent } from '../../shared/components/nav/nav.component';
@Component({
  selector: 'app-private-shell',
  standalone: true,
  imports: [RouterOutlet, NavComponent],
  template: `<div
    class="private-layout grid min-h-[calc(100vh-155px)] grid-cols-[232px_minmax(0,1fr)]"
  >
    <app-nav />
    <main class="page-content"><router-outlet /></main>
  </div>`,
})
export class PrivateShellComponent {}
