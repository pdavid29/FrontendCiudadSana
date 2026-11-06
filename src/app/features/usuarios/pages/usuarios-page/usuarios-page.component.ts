import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { RoleId, ROLE_NAMES, User } from '../../../../core/models/ciudad-sana.models';
import { ApiService, ApiUser } from '../../../../core/services/api.service';
import { UserAvatarComponent } from '../../../../shared/components/user-avatar/user-avatar.component';
import { RoleBadgeComponent } from '../../../../shared/components/role-badge/role-badge.component';
import { AuthService } from '../../../../core/services/auth.service';
import { InlineNoticeComponent } from '../../../../shared/components/inline-notice/inline-notice.component';

@Component({
  standalone: true,
  imports: [FormsModule, DatePipe, UserAvatarComponent, RoleBadgeComponent, InlineNoticeComponent],
  template: `<section class="page-heading">
      <div><span class="eyebrow">{{ auth.hasRole(1) ? 'ADMINISTRACIÓN DE ACCESO' : 'CONSULTA DE USUARIOS' }}</span>
        <h1>Usuarios</h1><p>Consulta los usuarios registrados y administra su acceso al portal.</p></div>
      <span class="count-pill">{{ users().length }} usuarios</span>
    </section>
    @if (error()) { <app-inline-notice tone="error">{{ error() }}</app-inline-notice> }
    <section class="surface-card filter-panel">
      <div class="filter-search"><span>⌕</span><label class="visually-hidden" for="user-search">Buscar usuarios</label>
        <input id="user-search" [ngModel]="query()" (ngModelChange)="query.set($event)" placeholder="Buscar por nombre o correo" /></div>
      <label class="filter-select">Rol<select [ngModel]="roleFilter()" (ngModelChange)="roleFilter.set($event)">
        <option value="">Todos los roles</option>@for (role of roles; track role.id) { <option [value]="role.id">{{ role.name }}</option> }
      </select></label>
      <label class="filter-select">Estado<select [ngModel]="stateFilter()" (ngModelChange)="stateFilter.set($event)">
        <option value="">Todos</option><option value="active">Activo</option><option value="inactive">Desactivado</option>
      </select></label>
    </section>
    <div class="table-scroll surface-card">
      <table><thead><tr><th>Usuario</th><th>Rol</th><th>Estado</th><th>Fecha de registro</th>@if (auth.hasRole(1)) { <th>Acceso</th> }</tr></thead>
        <tbody>@for (user of pagedUsers(); track user.id) {
          <tr><td><div class="user-cell"><app-user-avatar [name]="user.nombre" [small]="true" [photoKey]="user.fotoPerfil" [photoUserId]="user.id" />
            <span><strong>{{ user.nombre }}</strong><small>{{ user.email }}</small></span></div></td>
            <td><app-role-badge [role]="user.roleId" /></td>
            <td><span class="account-state" [class.inactive]="!user.active"><i></i>{{ user.active ? 'Activo' : 'Desactivado' }}</span></td>
            <td>{{ user.createdAt | date: 'd MMM, y' }}</td>
            @if (auth.hasRole(1)) { <td><button class="button button-small" [class.button-outline]="user.active" [class.button-primary]="!user.active"
              [disabled]="busyId() === user.id || user.id === auth.currentUser()?.id" (click)="toggle(user)">{{ busyId() === user.id ? 'Guardando…' : user.active ? 'Desactivar' : 'Activar' }}</button></td> }
          </tr>
        }</tbody>
      </table>
      @if (loading()) { <div class="table-empty">Cargando usuarios…</div> }
      @else if (!filtered().length && !error()) { <div class="table-empty">No hay usuarios que coincidan con estos filtros.</div> }
    </div>
    @if (filtered().length) {
      <nav class="list-pagination" aria-label="Paginación de usuarios">
        <label>Filas<select [ngModel]="pageSize()" (ngModelChange)="setPageSize($event)"><option [value]="10">10</option><option [value]="25">25</option><option [value]="50">50</option></select></label>
        <span>{{ pageStart() }}–{{ pageEnd() }} de {{ filtered().length }}</span>
        <button type="button" class="button button-outline button-small" [disabled]="page() === 0" (click)="previousPage()">Anterior</button>
        <button type="button" class="button button-outline button-small" [disabled]="page() >= pageCount() - 1" (click)="nextPage()">Siguiente</button>
      </nav>
    }
    <p class="management-note"><span>i</span> Los usuarios desactivados no pueden iniciar sesión. Su registro se conserva y puede reactivarse.</p>`,
})
export class UsuariosPageComponent {
  private readonly api = inject(ApiService);
  readonly auth = inject(AuthService);
  readonly roles = [1, 2, 3, 4].map((id) => ({ id, name: ROLE_NAMES[id as RoleId] }));
  readonly users = signal<User[]>([]);
  readonly query = signal('');
  readonly roleFilter = signal('');
  readonly stateFilter = signal('');
  readonly loading = signal(true);
  readonly error = signal('');
  readonly busyId = signal<string | null>(null);
  readonly page = signal(0);
  readonly pageSize = signal(10);
  readonly filtered = computed(() => {
    const q = this.query().toLowerCase().trim();
    return this.users().filter((user) =>
      (!q || `${user.nombre} ${user.email}`.toLowerCase().includes(q)) &&
      (!this.roleFilter() || String(user.roleId) === this.roleFilter()) &&
      (!this.stateFilter() || (this.stateFilter() === 'active' ? user.active : !user.active)),
    );
  });
  readonly pageCount = computed(() => Math.max(1, Math.ceil(this.filtered().length / this.pageSize())));
  readonly pageStart = computed(() => this.filtered().length ? Math.min(this.page(), this.pageCount() - 1) * this.pageSize() + 1 : 0);
  readonly pageEnd = computed(() => Math.min(this.pageStart() + this.pageSize() - 1, this.filtered().length));
  readonly pagedUsers = computed(() => {
    const current = Math.min(this.page(), this.pageCount() - 1);
    return this.filtered().slice(current * this.pageSize(), (current + 1) * this.pageSize());
  });

  constructor() { void this.load(); }
  setPageSize(size: number | string): void { this.pageSize.set(Number(size)); this.page.set(0); }
  previousPage(): void { this.page.update((value) => Math.max(0, value - 1)); }
  nextPage(): void { this.page.update((value) => Math.min(this.pageCount() - 1, value + 1)); }
  private mapUser(user: ApiUser): User {
    return { id: user.idUsuario, nombre: [user.primerNombre, user.segundoNombre, user.primerApellido, user.segundoApellido].filter(Boolean).join(' '),
      email: user.correo, phone: user.telefono ?? undefined, fotoPerfil: user.fotoPerfil ?? undefined,
      roleId: user.idRol as RoleId, active: user.estado, createdAt: user.createdAt || '', updatedAt: '' };
  }
  async load(): Promise<void> {
    this.loading.set(true); this.error.set('');
    try { this.users.set((await firstValueFrom(this.api.users())).map((user) => this.mapUser(user))); }
    catch { this.error.set('No fue posible cargar la lista de usuarios. Actualiza la página o vuelve a iniciar sesión.'); }
    finally { this.loading.set(false); }
  }
  async toggle(user: User): Promise<void> {
    if (user.id === this.auth.currentUser()?.id) return;
    this.busyId.set(user.id); this.error.set('');
    try { await firstValueFrom(this.api.setUserActive(user.id, !user.active)); await this.load(); }
    catch { this.error.set('No se pudo actualizar el acceso de esta cuenta.'); }
    finally { this.busyId.set(null); }
  }
}
