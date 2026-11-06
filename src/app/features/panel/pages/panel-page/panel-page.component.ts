import { Component, computed, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { LocalDataService } from '../../../../core/services/local-data.service';
import { Report, ROLE_NAMES } from '../../../../core/models/ciudad-sana.models';
import { MetricCardComponent } from '../../../../shared/components/metric-card/metric-card.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { PageHeadingComponent } from '../../../../shared/components/page-heading/page-heading.component';
import { ApiService, ApiReport, ApiState } from '../../../../core/services/api.service';
import { firstValueFrom } from 'rxjs';

@Component({
  standalone: true,
  imports: [
    RouterLink,
    DatePipe,
    MetricCardComponent,
    StatusBadgeComponent,
    EmptyStateComponent,
    PageHeadingComponent,
  ],
  template: `
    <app-page-heading
      [eyebrow]="roleEyebrow()"
      [title]="greeting() + ', ' + name()"
      [subtitle]="description()"
    >
      @if (auth.hasRole(3)) {
        <a pageAction routerLink="/reportes/nuevo" class="button button-primary"
          >＋ Crear reporte</a
        >
      }
    </app-page-heading>
    @if (auth.hasRole(3)) {
      <section class="citizen-banner">
        <div>
          <span class="banner-icon">✳</span>
          <div>
            <strong>Tu voz puede transformar tu entorno</strong>
            <p>Cuéntanos qué situación merece atención en tu barrio.</p>
          </div>
        </div>
        <a routerLink="/reportes/nuevo">Crear un reporte <span>→</span></a>
      </section>
    }
    <section class="metrics-grid">
      @if (auth.hasRole(1, 2)) {
        <app-metric-card
          label="Reportes recibidos"
          [value]="reports().length"
          icon="▤"
          note="En toda la ciudad"
        /><app-metric-card
          label="Por asignar"
          [value]="unassigned()"
          icon="⌖"
          tone="amber"
          note="Requieren gestión"
        /><app-metric-card
          label="En atención"
          [value]="inProgress()"
          icon="◷"
          tone="violet"
          note="En proceso"
        /><app-metric-card
          label="Resueltos"
          [value]="resolved()"
          icon="✓"
          tone="green"
          note="Atención completada"
        />
      }
      @if (auth.hasRole(3)) {
        <app-metric-card
          label="Mis reportes"
          [value]="reports().length"
          icon="▤"
          note="Reportes registrados"
        /><app-metric-card
          label="En seguimiento"
          [value]="openCount()"
          icon="◷"
          tone="amber"
          note="Con atención pendiente"
        /><app-metric-card
          label="Resueltos"
          [value]="resolved()"
          icon="✓"
          tone="green"
          note="Con respuesta"
        /><app-metric-card
          label="Categorías"
          [value]="categoriesCount()"
          icon="☷"
          tone="violet"
          note="Disponibles para reportar"
        />
      }
      @if (auth.hasRole(4)) {
        <app-metric-card
          label="Asignados a mí"
          [value]="reports().length"
          icon="▤"
          note="Reportes de atención"
        /><app-metric-card
          label="Por iniciar"
          [value]="assignedCount()"
          icon="⌖"
          tone="amber"
          note="Pendientes de visita"
        /><app-metric-card
          label="En atención"
          [value]="inProgress()"
          icon="◷"
          tone="violet"
          note="En proceso"
        /><app-metric-card
          label="Resueltos"
          [value]="resolved()"
          icon="✓"
          tone="green"
          note="Trabajo finalizado"
        />
      }
    </section>
    <section class="dashboard-columns">
      <div class="surface-card dashboard-recent">
        <div class="card-heading">
          <div>
            <span class="eyebrow">ACTIVIDAD RECIENTE</span>
            <h2>
              {{
                auth.hasRole(3)
                  ? 'Mis últimos reportes'
                  : auth.hasRole(4)
                    ? 'Reportes asignados'
                    : 'Reportes de la ciudad'
              }}
            </h2>
          </div>
          <a routerLink="/reportes">Ver todos <span>→</span></a>
        </div>
        @if (recent().length) {
          <div class="recent-list">
            @for (report of recent(); track report.id) {
              <a class="recent-row" [routerLink]="['/reportes']" [fragment]="report.id"
                ><span class="recent-file">▤</span
                ><span class="recent-main"
                  ><strong>{{ report.title }}</strong
                  ><small>{{ report.location }}</small></span
                ><span class="recent-date">{{ report.updatedAt | date: 'd MMM' }}</span
                ><app-status-badge [status]="report.status"
              /></a>
            }
          </div>
        } @else {
          <app-empty-state
            title="Sin reportes todavía"
            message="Aquí aparecerán los reportes relacionados con tu espacio."
          />
        }
      </div>
      <aside class="surface-card attention-card">
        <span class="eyebrow">TU ESPACIO</span>
        <div class="attention-symbol">
          {{ auth.hasRole(3) ? '◎' : auth.hasRole(4) ? '⌖' : '▦' }}
        </div>
        <h2>
          {{
            auth.hasRole(3)
              ? 'Participa en tu comunidad'
              : auth.hasRole(4)
                ? 'Tu trabajo hace la diferencia'
                : 'Gestión para una ciudad mejor'
          }}
        </h2>
        <p>
          {{
            auth.hasRole(3)
              ? 'Comparte una situación y consulta en cualquier momento cómo avanza su atención.'
              : auth.hasRole(4)
                ? 'Consulta los detalles, registra tus avances y deja observaciones de solución.'
                : 'Mantén la información organizada y facilita el seguimiento oportuno de cada reporte.'
          }}
        </p>
        <a [routerLink]="auth.hasRole(3) ? '/reportes/nuevo' : '/reportes'"
          >{{ auth.hasRole(3) ? 'Crear reporte' : 'Ir a reportes' }} <span>→</span></a
        >
        <div class="decor-ring"></div>
      </aside>
    </section>
  `,
})
export class PanelPageComponent {
  readonly auth = inject(AuthService);
  private local = inject(LocalDataService);
  private readonly api = inject(ApiService);
  constructor() { if (this.api.enabled) void this.loadDashboard(); }
  private async loadDashboard(): Promise<void> {
    try {
      const role = this.auth.currentUser()?.roleId;
      const [categories, states, reports] = await Promise.all([
        firstValueFrom(this.api.categories()), firstValueFrom(this.api.states()),
        role === 3 ? firstValueFrom(this.api.myReports()) : role === 4 ? firstValueFrom(this.api.assignedReports()) : firstValueFrom(this.api.allReports()),
      ]);
      this.local.replaceCategories(categories.map((category) => ({ id: String(category.idCategoria), name: category.nombre,
        description: category.descripcion || '', active: category.estado })));
      const labels = new Map(states.map((state: ApiState) => [state.idEstado, state.nombre as Report['status']]));
      this.local.replaceReports(reports.map((row: ApiReport) => ({
        id: String(row.idReporte), title: row.titulo, description: row.descripcion, categoryId: String(row.idCategoria),
        location: row.direccionReferencia || '', zone: '', createdAt: row.fechaReporte, updatedAt: row.fechaReporte,
        citizenId: row.idCiudadano || '', assignedTo: row.idTecnico, status: labels.get(row.idEstado) || 'Pendiente',
        evidence: (row.evidencias || []).map((item) => item.nombreOriginal), observations: '', history: [],
      })));
    } catch { /* El panel permanece vacío hasta que el servicio esté disponible. */ }
  }
  readonly reports = computed(() => {
    const user = this.auth.currentUser();
    const all = this.local.data().reports;
    if (!user) return [];
    if (user.roleId === 3) return all.filter((r) => r.citizenId === user.id);
    if (user.roleId === 4) return all.filter((r) => r.assignedTo === user.id);
    return all;
  });
  readonly recent = computed(() =>
    [...this.reports()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 4),
  );
  readonly resolved = computed(() => this.reports().filter((r) => r.status === 'Resuelto').length);
  readonly openCount = computed(
    () =>
      this.reports().filter((r) => r.status !== 'Resuelto' && r.status !== 'Rechazado').length,
  );
  readonly inProgress = computed(
    () => this.reports().filter((r) => r.status === 'En Proceso').length,
  );
  readonly unassigned = computed(
    () =>
      this.local.data().reports.filter((r) => !r.assignedTo && r.status !== 'Resuelto' && r.status !== 'Rechazado').length,
  );
  readonly assignedCount = computed(
    () => this.reports().filter((r) => r.status === 'En Proceso').length,
  );
  readonly categoriesCount = computed(
    () => this.local.data().categories.filter((c) => c.active).length,
  );
  name = () => this.auth.currentUser()?.nombre.split(' ')[0] ?? '';
  greeting = () => {
    const h = new Date().getHours();
    return h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches';
  };
  roleEyebrow = () =>
    (this.auth.currentUser()?.roleId
      ? ROLE_NAMES[this.auth.currentUser()!.roleId]
      : 'CIUDAD SANA'
    ).toUpperCase();
  description = () =>
    this.auth.hasRole(3)
      ? 'Desde aquí puedes crear reportes y seguir las respuestas a tu comunidad.'
      : this.auth.hasRole(4)
        ? 'Consulta tus asignaciones y registra el avance de la atención.'
        : 'Aquí tienes un resumen de la actividad y las tareas de gestión.';
}
