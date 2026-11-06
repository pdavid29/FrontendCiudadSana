import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { RoleId, User } from '../models/ciudad-sana.models';
import { LocalDataService } from './local-data.service';
import { ApiService, ApiUser } from './api.service';

const SESSION_KEY = 'ciudad-sana-session-v2';
interface Session { token: string; user: User; }

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly local = inject(LocalDataService);
  private readonly router = inject(Router);
  private readonly user = signal<User | null>(this.readSession()?.user ?? null);
  readonly currentUser = computed(() => {
    const user = this.user();
    return user?.active ? user : null;
  });
  readonly signedIn = computed(() => !!this.currentUser());
  readonly ready: Promise<void>;

  constructor() {
    if (this.api.enabled && this.readSession()?.token) {
      this.ready = firstValueFrom(this.api.profile()).then((profile) => this.setProfile(profile)).catch(() => this.clearSession());
    } else this.ready = Promise.resolve();
  }

  private readSession(): Session | null {
    try {
      return typeof localStorage === 'undefined' ? null : JSON.parse(localStorage.getItem(SESSION_KEY) || 'null') as Session | null;
    } catch { return null; }
  }
  private persist(token: string, user: User): void {
    this.user.set(user);
    if (typeof localStorage !== 'undefined') localStorage.setItem(SESSION_KEY, JSON.stringify({ token, user }));
  }
  private setProfile(profile: ApiUser): void {
    const session = this.readSession();
    if (session) this.persist(session.token, this.mapUser(profile));
  }
  private mapUser(profile: ApiUser): User {
    return {
      id: profile.idUsuario,
      nombre: [profile.primerNombre, profile.segundoNombre, profile.primerApellido, profile.segundoApellido].filter(Boolean).join(' '),
      email: profile.correo,
      phone: profile.telefono || undefined,
      fotoPerfil: profile.fotoPerfil || undefined,
      roleId: profile.idRol as RoleId,
      active: profile.estado,
      createdAt: profile.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  async login(email: string, password: string): Promise<string | null> {
    if (!this.api.enabled) {
      return 'El servicio de acceso no está disponible. Inténtalo más tarde.';
    }
    try {
      const token = await firstValueFrom(this.api.login(email.trim(), password));
      if (typeof localStorage !== 'undefined') localStorage.setItem(SESSION_KEY, JSON.stringify({ token: token.accessToken, user: null }));
      const profile = await firstValueFrom(this.api.profile());
      this.persist(token.accessToken, this.mapUser(profile));
      return null;
    } catch (error) {
      return this.apiError(error, 'No fue posible iniciar sesión.');
    }
  }

  async register(payload: { primerNombre: string; segundoNombre?: string | null; primerApellido: string; segundoApellido?: string | null; numeroDocumento: string; fechaNacimiento: string; correo: string; password: string; telefono?: string | null; idTipoDocumento: number; idSexo: number; }, photo?: File): Promise<string | null> {
    if (!this.api.enabled) return 'El servicio de registro no está disponible. Inténtalo más tarde.';
    try {
      await firstValueFrom(this.api.register(payload, photo));
      return null;
    } catch (error) {
      return this.apiError(error, 'No fue posible crear la cuenta.');
    }
  }

  private apiError(error: unknown, fallback: string): string {
    if (!(error instanceof HttpErrorResponse)) return fallback;
    if (error.status === 0) return 'No fue posible conectar con el servicio. Inténtalo nuevamente en unos minutos.';
    const body = error.error as { message?: unknown; detail?: unknown; title?: unknown } | string | null;
    const message = typeof body === 'string'
      ? body
      : body && typeof body === 'object'
        ? [body.message, body.detail, body.title].find((value): value is string => typeof value === 'string' && !!value.trim())
        : undefined;
    if (message && !/backend|localhost|stack|exception|sql|hibernate|spring|intellij|api/i.test(message)) return message;
    if (error.status === 401) return 'Correo o contraseña incorrectos, o la cuenta está inactiva.';
    if (error.status === 409) return 'Ya existe una cuenta con ese correo o documento.';
    if (error.status === 400) return 'Revisa los campos del formulario y vuelve a intentarlo.';
    return fallback;
  }

  async updateProfile(nombre: string, telefono?: string): Promise<string | null> {
    const session = this.readSession();
    const current = this.currentUser();
    if (!current) return 'Inicia sesión para actualizar tu perfil.';
    if (!this.api.enabled) {
      this.local.updateUser(current.id, { nombre });
      this.user.set(this.local.user(current.id) ?? null);
      return null;
    }
    if (!session?.token) return 'La sesión venció. Inicia sesión nuevamente.';
    try {
      const updated = await firstValueFrom(this.api.updateProfile({ nombre, telefono: telefono || null }));
      this.persist(session.token, this.mapUser(updated));
      return null;
    } catch { return 'No fue posible guardar tus cambios. Inténtalo nuevamente.'; }
  }

  async updateProfilePhoto(file: File): Promise<string | null> {
    const session = this.readSession();
    if (!this.currentUser()) return 'Inicia sesión para cambiar tu fotografía.';
    if (!this.api.enabled) return 'No fue posible guardar la fotografía. Inténtalo nuevamente.';
    if (!session?.token) return 'La sesión venció. Inicia sesión nuevamente.';
    try {
      const updated = await firstValueFrom(this.api.uploadProfilePhoto(file));
      this.persist(session.token, this.mapUser(updated));
      return null;
    } catch (error) { return this.apiError(error, 'No fue posible guardar la fotografía.'); }
  }

  logout(): void { this.clearSession(); void this.router.navigateByUrl('/'); }
  private clearSession(): void {
    this.user.set(null);
    if (typeof localStorage !== 'undefined') localStorage.removeItem(SESSION_KEY);
  }
  hasRole(...roles: RoleId[]): boolean {
    const role = this.currentUser()?.roleId;
    return !!role && roles.includes(role);
  }
  setUser(id: string): void {
    const user = this.local.user(id);
    if (user) this.persist(id, user);
  }
}
