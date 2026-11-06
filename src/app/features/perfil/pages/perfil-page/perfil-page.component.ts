import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { AuthService } from '../../../../core/services/auth.service';
import { ROLE_NAMES } from '../../../../core/models/ciudad-sana.models';
import { UserAvatarComponent } from '../../../../shared/components/user-avatar/user-avatar.component';
import { RoleBadgeComponent } from '../../../../shared/components/role-badge/role-badge.component';
import { InlineNoticeComponent } from '../../../../shared/components/inline-notice/inline-notice.component';
@Component({
  standalone: true,
  imports: [FormsModule, DatePipe, UserAvatarComponent, RoleBadgeComponent, InlineNoticeComponent],
  template: `<section class="page-heading">
      <div>
        <span class="eyebrow">TU CUENTA</span>
        <h1>Mi perfil</h1>
        <p>Consulta y actualiza la información de tu espacio.</p>
      </div>
    </section>
    @if (auth.currentUser(); as user) {
      <div class="profile-layout">
        <section class="surface-card profile-card">
          <div class="profile-cover"></div>
          <div class="profile-main">
            <app-user-avatar [name]="user.nombre" [photoKey]="user.fotoPerfil" /><app-role-badge [role]="user.roleId" />
            <h2>{{ user.nombre }}</h2>
            <p>{{ user.email }}</p>
            <span class="profile-date">Miembro desde {{ user.createdAt | date: 'd MMMM y' }}</span>
            <label class="button button-outline profile-photo-button">{{ photoBusy() ? 'Guardando…' : 'Cambiar fotografía' }}
              <input type="file" accept="image/jpeg,image/png,image/webp" (change)="selectPhoto($event)" [disabled]="photoBusy()" />
            </label>
            @if (photoMessage()) { <app-inline-notice [tone]="photoError() ? 'error' : 'success'">{{ photoMessage() }}</app-inline-notice> }
          </div>
        </section>
        <form class="surface-card profile-form" (ngSubmit)="save()">
          <span class="eyebrow">INFORMACIÓN PERSONAL</span>
          <h2>Datos de la cuenta</h2>
          <label
            >Nombre completo<input name="name" [(ngModel)]="name" required minlength="3" /></label
          ><label>Correo electrónico<input [value]="user.email" disabled /></label
          ><label>Teléfono<input name="phone" type="tel" [(ngModel)]="phone" /></label
          ><label
            >Rol de la cuenta<input [value]="ROLE_NAMES[user.roleId]" disabled
          /></label>
          @if (saved()) {
            <app-inline-notice tone="success"
            >Cambios guardados.</app-inline-notice
            >
          }
          @if (error()) { <app-inline-notice tone="error">{{ error() }}</app-inline-notice> }
          <button class="button button-primary">Guardar cambios</button>
          <p class="security-note">El correo y el rol no se pueden cambiar desde esta pantalla.</p>
        </form>
      </div>
    }`,
})
export class PerfilPageComponent {
  readonly auth = inject(AuthService);
  readonly ROLE_NAMES = ROLE_NAMES;
  name = this.auth.currentUser()?.nombre ?? '';
  phone = this.auth.currentUser()?.phone ?? '';
  readonly saved = signal(false);
  readonly error = signal('');
  readonly photoMessage = signal('');
  readonly photoError = signal(false);
  readonly photoBusy = signal(false);
  async selectPhoto(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
      this.photoError.set(true);
      this.photoMessage.set('Elige una imagen JPG, PNG o WebP de hasta 5 MB.');
      return;
    }
    this.photoBusy.set(true);
    const error = await this.auth.updateProfilePhoto(file);
    this.photoBusy.set(false);
    this.photoError.set(!!error);
    this.photoMessage.set(error ?? 'Fotografía actualizada.');
  }
  async save(): Promise<void> {
    const user = this.auth.currentUser();
    if (!user || this.name.trim().length < 3) return;
    const error = await this.auth.updateProfile(this.name.trim(), this.phone.trim());
    this.error.set(error ?? '');
    this.saved.set(!error);
    if (!error) setTimeout(() => this.saved.set(false), 3500);
  }
}
