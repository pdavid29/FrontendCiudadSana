import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { InlineNoticeComponent } from '../../../../shared/components/inline-notice/inline-notice.component';

@Component({
  standalone: true,
  imports: [FormsModule, RouterLink, InlineNoticeComponent],
  template: ` <section class="auth-layout">
    <div class="auth-story">
      <span class="eyebrow">CIUDAD SANA · ESPACIO CIUDADANO</span>
      <h1>Tu ciudad también<br />se construye <em>contigo.</em></h1>
      <p>Ingresa para crear reportes, conocer su estado y seguir la respuesta de tu comunidad.</p>
      <div class="auth-story-note">
        <span>✓</span>
        <p>
          <strong>Seguimiento claro</strong><br />Conoce qué sucede desde que compartes una
          situación.
        </p>
      </div>
      <div class="story-decoration">CS<span>+</span></div>
    </div>
    <div class="auth-panel">
      <div class="auth-heading">
        <span class="eyebrow">QUÉ BUENO VERTE</span>
        <h2>Ingresa a tu espacio</h2>
        <p>Usa tu correo registrado para continuar.</p>
      </div>
      @if (error()) {
        <app-inline-notice tone="error">{{ error() }}</app-inline-notice>
      }
      <form (ngSubmit)="login()" #form="ngForm" class="form-stack">
        <label
          >Correo electrónico<input
            name="email"
            type="email"
            [(ngModel)]="email"
            required
            email
            autocomplete="username"
            placeholder="nombre@correo.com" /></label
        ><label
          >Contraseña<input
            name="password"
            type="password"
            [(ngModel)]="password"
            required
            minlength="6"
            autocomplete="current-password"
            placeholder="Ingresa tu contraseña" /></label
        ><button class="button button-primary button-full button-large" [disabled]="form.invalid">
          Ingresar <span>→</span>
        </button>
      </form>
      <p class="auth-switch">
        ¿Aún no tienes cuenta? <a routerLink="/registro">Regístrate aquí</a>
      </p>
      <p class="security-note">Tus datos de acceso se protegen en cada inicio de sesión.</p>
    </div>
  </section>`,
})
export class AccesoPageComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  email = '';
  password = '';
  readonly error = signal('');
  async login(): Promise<void> {
    const error = await this.auth.login(this.email, this.password);
    this.error.set(error ?? '');
    if (!error) void this.router.navigateByUrl('/panel');
  }
}
