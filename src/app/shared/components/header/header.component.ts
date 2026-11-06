import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ROLE_NAMES } from '../../../core/models/ciudad-sana.models';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink],
  template: `
    <header class="site-header">
      <a routerLink="/" class="brand" aria-label="Ciudad Sana, página principal">
        <span><strong>Ciudad Sana</strong><small>Participación ciudadana</small></span>
      </a>
      <nav class="top-nav" aria-label="Navegación principal">
        <a routerLink="/" class="top-link">Inicio</a
        ><a routerLink="/como-funciona" class="top-link">Cómo funciona</a>
        @if (auth.currentUser(); as user) {
          <a routerLink="/panel" class="top-link">Mi espacio</a>
          <span class="role-chip">{{ ROLE_NAMES[user.roleId] }}</span>
          <button class="button button-outline button-small" (click)="auth.logout()">
            Cerrar sesión
          </button>
        } @else {
          <a routerLink="/acceso" class="button button-outline button-small">Ingresar</a
          ><a routerLink="/registro" class="button button-primary button-small">Crear cuenta</a>
        }
      </nav>
      <span class="header-note"><span class="online-dot"></span> Atención ciudadana</span>
    </header>
  `,
})
export class HeaderComponent {
  readonly auth = inject(AuthService);
  readonly ROLE_NAMES = ROLE_NAMES;
}
