import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { RoleId } from '../../../core/models/ciudad-sana.models';
import { ApiModule, ApiService } from '../../../core/services/api.service';
import { UserAvatarComponent } from '../user-avatar/user-avatar.component';

@Component({
  selector: 'app-nav', standalone: true, imports: [RouterLink, RouterLinkActive, UserAvatarComponent],
  template: `@if (auth.currentUser(); as user) {
    <aside class="side-nav" aria-label="Menú del espacio personal">
      <div class="side-profile"><app-user-avatar [name]="user.nombre" [photoKey]="user.fotoPerfil" />
        <div><strong>{{ user.nombre }}</strong><span>{{ roleLabel(user.roleId) }}</span></div></div>
      <span class="nav-label">MENÚ PRINCIPAL</span>
      <a routerLink="/panel" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }" class="side-link"><span>▦</span>Resumen</a>
      @if (user.roleId === 3 && hasModule(4)) { <a routerLink="/reportes/nuevo" routerLinkActive="active" class="side-link"><span>＋</span>Crear reporte</a> }
      @for (module of modules(); track module.idModulo) {
        <a [routerLink]="moduleRoute(module)" routerLinkActive="active" class="side-link"><span>{{ moduleIcon(module.idModulo) }}</span>{{ moduleLabel(module, user.roleId) }}</a>
      }
      <span class="nav-label nav-label-lower">CUENTA</span><a routerLink="/perfil" routerLinkActive="active" class="side-link"><span>◎</span>Mi perfil</a>
      <div class="side-help"><span>¿Necesitas ayuda?</span><p>Consulta cómo enviar y hacer seguimiento a tus reportes.</p><a routerLink="/como-funciona">Ver guía <span>→</span></a></div>
    </aside>
  }`,
})
export class NavComponent {
  readonly auth = inject(AuthService);
  private readonly api = inject(ApiService);
  readonly modules = signal<ApiModule[]>([]);
  constructor() { void this.loadModules(); }
  private async loadModules(): Promise<void> {
    if (!this.api.enabled || !this.auth.currentUser()) return;
    try { this.modules.set(await firstValueFrom(this.api.modules())); } catch { this.modules.set([]); }
  }
  hasModule(id: number): boolean { return this.modules().some((module) => module.idModulo === id); }
  moduleRoute(module: ApiModule): string {
    const knownRoutes: Record<number, string> = { 1: '/usuarios', 2: '/categorias', 3: '/reportes', 4: '/reportes', 5: '/reportes', 6: '/estadisticas' };
    return knownRoutes[module.idModulo] || (module.url.startsWith('/') ? module.url : `/${module.url}`);
  }
  moduleLabel(module: ApiModule, role: RoleId): string {
    if (module.idModulo === 4 && role === 3) return 'Mis reportes';
    if (module.idModulo === 5 && role === 4) return 'Asignados a mí';
    return module.nombre;
  }
  moduleIcon(id: number): string { return ({ 1: '♧', 2: '☷', 3: '▤', 4: '▤', 5: '▤', 6: '▥' } as Record<number, string>)[id] || '•'; }
  roleLabel(role: RoleId): string { return ['', 'Administrador', 'Asistente de gestión', 'Ciudadano', 'Técnico'][role]; }
}
