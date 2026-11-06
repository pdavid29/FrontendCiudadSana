import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ApiRegisterCatalogItem, ApiService } from '../../../../core/services/api.service';
import { AuthService } from '../../../../core/services/auth.service';
import { InlineNoticeComponent } from '../../../../shared/components/inline-notice/inline-notice.component';

@Component({
  standalone: true,
  imports: [FormsModule, RouterLink, InlineNoticeComponent],
  template: `<section class="auth-layout registration-layout">
    <div class="auth-story">
      <span class="eyebrow">UN ESPACIO PARA TU COMUNIDAD</span>
      <h1>Lo que compartes<br />nos ayuda a <em>mejorar.</em></h1>
      <p>Crea tu cuenta ciudadana para reportar y dar seguimiento a situaciones de tu entorno.</p>
      <div class="auth-story-note"><span>✓</span><p><strong>Tu voz importa</strong><br />Información clara para una ciudad más amable.</p></div>
      <div class="story-decoration">CS<span>+</span></div>
    </div>
    <div class="auth-panel registration-panel">
      <div class="auth-heading"><span class="eyebrow">REGISTRO CIUDADANO</span><h2>Crea tu cuenta</h2><p>Completa la información solicitada para registrarte.</p></div>
      @if (error()) { <app-inline-notice tone="error">{{ error() }}</app-inline-notice> }
      @if (catalogError()) { <app-inline-notice tone="error">{{ catalogError() }}</app-inline-notice> }
      <form (ngSubmit)="register()" #form="ngForm" class="form-stack registration-form">
        <div class="registration-grid">
          <label>Primer nombre<input name="firstName" [(ngModel)]="firstName" required minlength="2" maxlength="255" autocomplete="given-name" /></label>
          <label>Segundo nombre <span class="field-optional">Opcional</span><input name="middleName" [(ngModel)]="middleName" maxlength="255" autocomplete="additional-name" /></label>
          <label>Primer apellido<input name="lastName" [(ngModel)]="lastName" required minlength="2" maxlength="255" autocomplete="family-name" /></label>
          <label>Segundo apellido <span class="field-optional">Opcional</span><input name="secondLastName" [(ngModel)]="secondLastName" maxlength="255" /></label>
          <label>Tipo de documento<select name="documentType" [(ngModel)]="idTipoDocumento" required>
            <option [ngValue]="null" disabled>Selecciona un tipo</option>
            @for (item of documentTypes(); track item.id) { <option [ngValue]="item.id">{{ item.nombre }}</option> }
          </select></label>
          <label>Número de documento<input name="documentNumber" [(ngModel)]="documentNumber" required minlength="5" maxlength="20" inputmode="numeric" pattern="[0-9]{5,20}" autocomplete="off" /></label>
          <label>Sexo<select name="sex" [(ngModel)]="idSexo" required>
            <option [ngValue]="null" disabled>Selecciona una opción</option>
            @for (item of sexes(); track item.id) { <option [ngValue]="item.id">{{ item.nombre }}</option> }
          </select></label>
          <label>Fecha de nacimiento<input name="birthDate" type="date" [(ngModel)]="birthDate" required min="1900-01-01" [max]="today" /></label>
          <label>Teléfono <span class="field-optional">Opcional</span><input name="phone" type="tel" [(ngModel)]="phone" maxlength="15" inputmode="numeric" pattern="[0-9]{7,15}" autocomplete="tel" /></label>
          <label>Correo electrónico<input name="email" type="email" [(ngModel)]="email" required email maxlength="255" autocomplete="email" /></label>
          <label class="registration-wide">Contraseña<input name="password" type="password" [(ngModel)]="password" required minlength="8" maxlength="100" autocomplete="new-password" /></label>
          <label class="registration-wide">Fotografía de perfil <span class="field-optional">Opcional · JPG, PNG o WebP · máximo 5 MB</span><input name="profilePhoto" type="file" accept="image/jpeg,image/png,image/webp" (change)="selectPhoto($event)" /></label>
        </div>
        <p class="security-note">El rol ciudadano y el estado activo se asignan automáticamente al crear la cuenta.</p>
        <button class="button button-primary button-full button-large" [disabled]="form.invalid || busy() || !documentTypes().length || !sexes().length">{{ busy() ? 'Creando cuenta…' : 'Crear cuenta' }} <span>→</span></button>
      </form>
      <p class="auth-switch">¿Ya tienes cuenta? <a routerLink="/acceso">Inicia sesión</a></p>
    </div>
  </section>`,
})
export class RegistroPageComponent {
  private readonly auth = inject(AuthService);
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  firstName = '';
  middleName = '';
  lastName = '';
  secondLastName = '';
  documentNumber = '';
  idTipoDocumento: number | null = null;
  idSexo: number | null = null;
  birthDate = '';
  phone = '';
  email = '';
  password = '';
  photo?: File;
  readonly today = new Date(Date.now() - new Date().getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
  readonly documentTypes = signal<ApiRegisterCatalogItem[]>([]);
  readonly sexes = signal<ApiRegisterCatalogItem[]>([]);
  readonly error = signal('');
  readonly catalogError = signal('');
  readonly busy = signal(false);

  constructor() { void this.loadCatalogs(); }

  private async loadCatalogs(): Promise<void> {
    try {
      const catalogs = await firstValueFrom(this.api.registrationCatalogs());
      this.documentTypes.set(catalogs.tiposDocumento);
      this.sexes.set(catalogs.sexos);
      if (!catalogs.tiposDocumento.length || !catalogs.sexos.length) this.catalogError.set('Los catálogos de registro no están disponibles. Contacta a atención ciudadana.');
    } catch { this.catalogError.set('No se pudieron cargar los tipos de documento y sexo. Actualiza la página o contacta a atención ciudadana.'); }
  }

  selectPhoto(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    this.photo = undefined;
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
      input.value = '';
      this.error.set('La fotografía debe ser JPG, PNG o WebP y no superar 5 MB.');
      return;
    }
    this.error.set('');
    this.photo = file;
  }

  async register(): Promise<void> {
    this.error.set('');
    this.busy.set(true);
    const error = await this.auth.register({
      primerNombre: this.firstName.trim(), segundoNombre: this.middleName.trim() || null,
      primerApellido: this.lastName.trim(), segundoApellido: this.secondLastName.trim() || null,
      numeroDocumento: this.documentNumber.trim(), fechaNacimiento: this.birthDate,
      correo: this.email.trim(), password: this.password, telefono: this.phone.trim() || null,
      idTipoDocumento: this.idTipoDocumento ?? 0, idSexo: this.idSexo ?? 0,
    }, this.photo);
    this.busy.set(false);
    this.error.set(error ?? '');
    if (!error) void this.router.navigateByUrl('/acceso');
  }
}
