import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { LocalDataService } from '../../../../core/services/local-data.service';
import { Report, ReportStatus, STATUSES } from '../../../../core/models/ciudad-sana.models';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { PageHeadingComponent } from '../../../../shared/components/page-heading/page-heading.component';
import { InlineNoticeComponent } from '../../../../shared/components/inline-notice/inline-notice.component';
import { ApiService, ApiState, ApiReport } from '../../../../core/services/api.service';
import { firstValueFrom } from 'rxjs';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  standalone: true,
  imports: [
    FormsModule,
    DatePipe,
    RouterLink,
    StatusBadgeComponent,
    EmptyStateComponent,
    PageHeadingComponent,
    InlineNoticeComponent,
  ],
  template: `
    <app-page-heading eyebrow="GESTIÓN CIUDADANA" [title]="heading()" [subtitle]="subtitle()">
      @if (auth.hasRole(3)) {
        <a pageAction routerLink="/reportes/nuevo" class="button button-primary"
          >＋ Nuevo reporte</a
        >
      }
    </app-page-heading>
    @if (feedback()['load-error']) {
      <app-inline-notice tone="error">{{ feedback()['load-error'] }}</app-inline-notice>
    }
    @if (feedback()['submit-success']) {
      <app-inline-notice tone="success">{{ feedback()['submit-success'] }}</app-inline-notice>
    }
    @if (feedback()['technicians-error']) {
      <app-inline-notice tone="error">{{ feedback()['technicians-error'] }}</app-inline-notice>
    }
    <section class="surface-card filter-panel">
      <div class="filter-search">
        <span>⌕</span><label class="visually-hidden" for="report-search">Buscar reportes</label
        ><input
          id="report-search"
          [ngModel]="query()" (ngModelChange)="query.set($event)"
          placeholder="Buscar por título o ubicación"
        />
      </div>
      <label class="filter-select"
        >Categoría<select [ngModel]="categoryFilter()" (ngModelChange)="categoryFilter.set($event)">
          <option value="">Todas las categorías</option>
          @for (category of local.data().categories; track category.id) {
            <option [value]="category.id">{{ category.name }}</option>
          }
        </select></label
      >
      <label class="filter-select"
        >Estado<select [ngModel]="statusFilter()" (ngModelChange)="statusFilter.set($event)">
          <option value="">Todos los estados</option>
          @for (status of statuses; track status) {
            <option>{{ status }}</option>
          }
        </select></label
      >
      <label class="filter-select"
        >Fecha<select [ngModel]="dateFilter()" (ngModelChange)="dateFilter.set($event)">
          <option value="">Cualquier fecha</option>
          <option value="7">Últimos 7 días</option>
          <option value="30">Últimos 30 días</option>
        </select></label
      ><label class="filter-select"
        >Orden<select [ngModel]="sortOrder()" (ngModelChange)="sortOrder.set($event)">
          <option value="newest">Más recientes</option>
          <option value="oldest">Más antiguos</option>
        </select></label
      ><span class="result-count">{{ filtered().length }} resultados</span>
    </section>
    @if (filtered().length) {
      <section class="report-list">
        @for (report of pagedReports(); track report.id) {
          <article class="report-card surface-card" [attr.id]="report.id">
            <div class="report-summary">
              <button
                class="report-title-button"
                (click)="toggle(report.id)"
                [attr.aria-expanded]="expanded() === report.id"
              >
                <strong>{{ report.title }}</strong></button
              ><app-status-badge [status]="report.status" /><span class="report-category">{{
                categoryName(report.categoryId)
              }}</span
              ><span class="report-location"><span>⌖</span>{{ report.location }}</span
              ><span class="report-updated">{{ report.updatedAt | date: 'd MMM, y' }}</span
              ><button
                class="icon-button"
                (click)="toggle(report.id)"
                [attr.aria-label]="expanded() === report.id ? 'Ocultar detalles' : 'Ver detalles'"
              >
                {{ expanded() === report.id ? '−' : '＋' }}
              </button>
            </div>
            @if (expanded() === report.id) {
              <div class="report-detail">
                <div class="detail-grid">
                  <section>
                    <span class="detail-label">DIRECCIÓN DE REFERENCIA</span>
                    <p>{{ report.location || 'Sin dirección de referencia' }}</p>
                  </section>
                  @if (reportDetails()[report.id]; as detail) {
                    <section>
                      <span class="detail-label">UBICACIÓN EXACTA</span>
                      <p>{{ detail.nombreBarrio || 'Barrio no disponible' }} · Latitud {{ detail.latitud }} · Longitud {{ detail.longitud }}</p>
                    </section>
                    <section>
                      <span class="detail-label">REPORTADO POR</span>
                      <p>{{ detail.nombreCiudadano || 'No disponible' }}</p>
                    </section>
                    @if (detail.nombreTecnico) {
                      <section><span class="detail-label">TÉCNICO ASIGNADO</span><p>{{ detail.nombreTecnico }}</p></section>
                    }
                    @if (detail.latitud && detail.longitud) {
                      <section class="report-map-section">
                        <span class="detail-label">PUNTO DEL REPORTE</span>
                        <iframe title="Mapa de ubicación del reporte" loading="lazy" [src]="mapUrl(detail.latitud, detail.longitud)"></iframe>
                        <a [href]="externalMapUrl(detail.latitud, detail.longitud)" target="_blank" rel="noopener">Abrir coordenadas en OpenStreetMap</a>
                      </section>
                    }
                    <section class="report-evidence-section">
                      <span class="detail-label">FOTOGRAFÍAS ADJUNTAS</span>
                      @if (detail.evidencias?.length) {
                        @for (evidence of detail.evidencias; track evidence.idEvidencia) {
                          @if (evidenceUrls()[evidence.idEvidencia]; as imageUrl) {
                            <a [href]="imageUrl" target="_blank" rel="noopener"><img [src]="imageUrl" [alt]="evidence.nombreOriginal" /><span>{{ evidence.nombreOriginal }}</span></a>
                          } @else { <p>{{ evidence.nombreOriginal }} · cargando imagen…</p> }
                        }
                      } @else { <p>Sin evidencias fotográficas.</p> }
                    </section>
                  }
                  <section>
                    <span class="detail-label">DESCRIPCIÓN</span>
                    <p>{{ report.description }}</p>
                  </section>
                  <section>
                    <span class="detail-label">EVIDENCIAS</span>
                    <p>
                      {{
                        report.evidence.length
                          ? report.evidence.join(', ')
                          : 'Sin evidencias adjuntas'
                      }}
                    </p>
                  </section>
                  @if (report.validation) {
                    <section>
                      <span class="detail-label">VALIDACIÓN DE IMAGEN</span>
                      <p>{{ report.validation.result }} · {{ report.validation.message }}</p>
                      @if (report.validation.requiresHumanReview) { <p>Requiere revisión de un funcionario.</p> }
                      @if (auth.hasRole(1, 2, 4)) {
                        <details><summary>Detecciones y confianza</summary><pre>{{ report.validation.detectionsJson }}</pre></details>
                      }
                    </section>
                  }
                  <section>
                    <span class="detail-label">ZONA</span>
                    <p>{{ report.zone }}</p>
                  </section>
                  <section>
                    <span class="detail-label">OBSERVACIONES DISPONIBLES</span>
                    <p>{{ report.observations || 'Aún no hay observaciones.' }}</p>
                  </section>
                </div>
                @if (auth.hasRole(1, 2)) {
                  <div class="report-controls">
                    <label
                      >Asignar técnico<select
                        [ngModel]="pendingTechnicians()[report.id] || report.assignedTo || ''"
                        (ngModelChange)="selectTechnician(report.id, $event)"
                      >
                        <option value="" disabled>{{ technicians().length ? 'Selecciona un técnico' : 'No hay técnicos activos cargados' }}</option>
                        @for (tech of technicians(); track tech.id) {
                          <option [value]="tech.id">{{ tech.nombre }}</option>
                        }
                      </select></label
                    ><label
                      >Actualizar estado<select
                        [ngModel]="pendingStatuses()[report.id] || report.status"
                        (ngModelChange)="selectStatus(report.id, $event)"
                      >
                        @for (status of managementStatuses; track status) {
                          <option [value]="status">{{ status }}</option>
                        }
                      </select></label>
                    @if (['Resuelto', 'Rechazado'].includes(pendingStatuses()[report.id] || report.status)) {
                      <label class="note-input">Observación obligatoria<input [ngModel]="statusObservations()[report.id] || ''" (ngModelChange)="setStatusObservation(report.id, $event)" placeholder="Explica el cierre o rechazo" /></label>
                    }
                    <button class="button button-primary button-small" [disabled]="saving().includes(report.id) || !hasManagementChanges(report) || (['Resuelto', 'Rechazado'].includes(pendingStatuses()[report.id] || report.status) && !(statusObservations()[report.id] || '').trim())" (click)="saveManagementChanges(report)">Guardar cambios</button>
                  </div>
                }
                @if (auth.hasRole(4)) {
                  <div class="report-controls technician-controls">
                    <label class="note-input"
                      >Observación de solución<input
                        [ngModel]="noteDrafts()[report.id] || ''"
                        (ngModelChange)="draft(report.id, $event)"
                        placeholder="Describe el avance o la solución" /></label
                    ><button class="button button-primary button-small" [disabled]="report.status !== 'En Proceso' || !(noteDrafts()[report.id] || '').trim()" (click)="saveNote(report)">
                      Marcar como resuelto
                    </button>
                    <label class="note-input">Evidencia de reparación<input type="file" accept="image/jpeg,image/png" multiple (change)="selectRepairEvidence(report.id, $event)" /></label>
                    @if (repairFiles()[report.id]?.length) { <button class="button button-outline button-small" [disabled]="saving().includes(report.id)" (click)="uploadRepairEvidence(report)">Subir evidencias</button> }
                  </div>
                }
                @if (feedback()[report.id]) {
                  <app-inline-notice tone="success">{{ feedback()[report.id] }}</app-inline-notice>
                }
                <div class="history-block">
                  <span class="detail-label">HISTORIAL DEL REPORTE</span>
                  <ol class="history-list">
                    @for (event of report.history; track $index) {
                      <li>
                        <span class="history-dot"></span>
                        <div>
                          <strong
                            >{{ event.status }} <small>· {{ event.by }}</small></strong
                          >
                          <p>{{ event.note }}</p>
                          <time>{{ event.at | date: 'd MMM y, h:mm a' }}</time>
                        </div>
                      </li>
                    }
                  </ol>
                </div>
              </div>
            }
          </article>
        }
      </section>
      <nav class="list-pagination" aria-label="Paginación de reportes">
        <label>Filas<select [ngModel]="pageSize()" (ngModelChange)="setPageSize($event)"><option [value]="10">10</option><option [value]="25">25</option><option [value]="50">50</option></select></label>
        <span>{{ pageStart() }}–{{ pageEnd() }} de {{ filtered().length }}</span>
        <button type="button" class="button button-outline button-small" [disabled]="page() === 0" (click)="previousPage()">Anterior</button>
        <button type="button" class="button button-outline button-small" [disabled]="page() >= pageCount() - 1" (click)="nextPage()">Siguiente</button>
      </nav>
    } @else {
      <app-empty-state
        title="No encontramos reportes"
        message="Ajusta los filtros o crea un reporte para comenzar."
        icon="▤"
      >
        @if (auth.hasRole(3)) {
          <a class="button button-primary button-small" routerLink="/reportes/nuevo"
            >Crear reporte</a
          >
        }
      </app-empty-state>
    }
  `,
})
export class ReportesPageComponent {
  readonly auth = inject(AuthService);
  private readonly sanitizer = inject(DomSanitizer);
  readonly local = inject(LocalDataService);
  private readonly api = inject(ApiService);
  readonly statuses = STATUSES;
  readonly managementStatuses: ReportStatus[] = STATUSES;
  readonly query = signal('');
  readonly categoryFilter = signal('');
  readonly statusFilter = signal('');
  readonly dateFilter = signal('');
  readonly sortOrder = signal('newest');
  readonly expanded = signal('');
  readonly noteDrafts = signal<Record<string, string>>({});
  readonly statusObservations = signal<Record<string, string>>({});
  readonly pendingStatuses = signal<Record<string, ReportStatus>>({});
  readonly pendingTechnicians = signal<Record<string, string>>({});
  readonly repairFiles = signal<Record<string, File[]>>({});
  readonly saving = signal<string[]>([]);
  readonly page = signal(0);
  readonly pageSize = signal(10);
  readonly feedback = signal<Record<string, string>>({});
  readonly reportDetails = signal<Record<string, ApiReport>>({});
  readonly evidenceUrls = signal<Record<number, string>>({});
  readonly technicians = signal(this.api.enabled ? [] : this.local.data().users.filter((user) => user.roleId === 4 && user.active));
  private stateIds = new Map<string, number>();
  readonly heading = () =>
    this.auth.hasRole(3)
      ? 'Mis reportes'
      : this.auth.hasRole(4)
        ? 'Reportes asignados'
        : 'Reportes de la ciudad';
  readonly subtitle = () =>
    this.auth.hasRole(3)
      ? 'Consulta el estado, las observaciones y el historial de tus reportes.'
      : this.auth.hasRole(4)
        ? 'Aquí se muestran únicamente los reportes asignados a tu usuario.'
        : 'Busca, revisa y actualiza los reportes recibidos en la ciudad.';
  constructor() {
    const message = sessionStorage.getItem('reporte-enviado');
    if (message) {
      sessionStorage.removeItem('reporte-enviado');
      this.feedback.set({ 'submit-success': message });
    }
    if (this.api.enabled) void this.loadServerData();
  }
  private async loadServerData(): Promise<void> {
    try {
      const role = this.auth.currentUser()?.roleId;
      const categoryRows = await firstValueFrom(this.api.categories());
      this.local.replaceCategories(categoryRows.filter((category) => category.estado).map((category) => ({
        id: String(category.idCategoria), name: category.nombre,
        description: category.descripcion || '', active: category.estado,
      })));
      const states = await firstValueFrom(this.api.states());
      this.stateIds = new Map(states.map((state: ApiState) => [state.nombre, state.idEstado]));
      const rows = role === 3 ? await firstValueFrom(this.api.myReports())
        : role === 4 ? await firstValueFrom(this.api.assignedReports())
          : await firstValueFrom(this.api.allReports());
      const historyLists = await Promise.all(rows.map((item) => firstValueFrom(this.api.history(item.idReporte)).catch(() => [])));
      const statusById = new Map(states.map((state) => [state.idEstado, state.nombre as ReportStatus]));
      this.local.replaceReports(rows.map((row: ApiReport, index) => {
        const status = statusById.get(row.idEstado) || 'Pendiente';
        const evidence = row.evidencias || [];
        const validation = evidence.map((item) => item.validacion).find((item) => !!item);
        return {
          id: String(row.idReporte), title: row.titulo, description: row.descripcion,
          categoryId: String(row.idCategoria), location: row.direccionReferencia || '', zone: '',
          createdAt: row.fechaReporte, updatedAt: row.fechaReporte, citizenId: row.idCiudadano || '',
          assignedTo: row.idTecnico, status, evidence: evidence.map((item) => item.nombreOriginal),
          observations: '',
          history: historyLists[index].map((event) => ({
            at: event.fechaCambio, by: event.responsable,
            status: statusById.get(event.idEstado) || 'Pendiente', note: event.observacion || '',
          })),
          validation: validation ? { result: validation.resultado, message: validation.mensaje, detectionsJson: validation.deteccionesJson, requiresHumanReview: validation.requiereRevisionHumana } : undefined,
        };
      }));
      this.reportDetails.set(Object.fromEntries(rows.map((row) => [String(row.idReporte), row])));
      if (this.auth.hasRole(1, 2)) {
        try {
          const users = await firstValueFrom(this.api.technicians());
          this.technicians.set(users.map((user) => ({
            id: user.idUsuario, nombre: user.nombre, email: '',
            roleId: 4, active: true, createdAt: '', updatedAt: '',
          })));
        } catch {
          this.technicians.set([]);
          this.feedback.update((messages) => ({ ...messages, 'technicians-error': 'No se pudo cargar la lista de técnicos activos.' }));
        }
      }
    } catch {
      this.feedback.set({ 'load-error': 'No se pudieron cargar los reportes. Inténtalo nuevamente.' });
    }
  }
  readonly filtered = computed(() => {
    const user = this.auth.currentUser();
    if (!user) return [];
    const q = this.query().toLocaleLowerCase().trim();
    const cutoff = this.dateFilter() ? Date.now() - Number(this.dateFilter()) * 86400000 : 0;
    return this.local
      .data()
      .reports.filter(
        (r) =>
          (user.roleId === 3
            ? r.citizenId === user.id
            : user.roleId === 4
              ? r.assignedTo === user.id
              : true) &&
          (!this.categoryFilter() || r.categoryId === this.categoryFilter()) &&
          (!this.statusFilter() || r.status === this.statusFilter()) &&
          (!cutoff || Date.parse(r.createdAt) >= cutoff) &&
          (!q ||
            `${r.title} ${r.location} ${r.id} ${r.description}`.toLocaleLowerCase().includes(q)),
      )
      .sort((a, b) =>
        this.sortOrder() === 'oldest'
          ? a.createdAt.localeCompare(b.createdAt)
          : b.createdAt.localeCompare(a.createdAt),
      );
  });
  readonly pageCount = computed(() => Math.max(1, Math.ceil(this.filtered().length / this.pageSize())));
  readonly pageStart = computed(() => this.filtered().length ? Math.min(this.page(), this.pageCount() - 1) * this.pageSize() + 1 : 0);
  readonly pageEnd = computed(() => Math.min(this.pageStart() + this.pageSize() - 1, this.filtered().length));
  readonly pagedReports = computed(() => {
    const current = Math.min(this.page(), this.pageCount() - 1);
    return this.filtered().slice(current * this.pageSize(), (current + 1) * this.pageSize());
  });
  setPageSize(size: number | string): void { this.pageSize.set(Number(size)); this.page.set(0); }
  previousPage(): void { this.page.update((value) => Math.max(0, value - 1)); }
  nextPage(): void { this.page.update((value) => Math.min(this.pageCount() - 1, value + 1)); }
  toggle(id: string): void {
    const next = this.expanded() === id ? '' : id;
    this.expanded.set(next);
    if (next) void this.loadEvidenceImages(next);
  }
  selectStatus(id: string, status: ReportStatus): void { this.pendingStatuses.update((values) => ({ ...values, [id]: status })); }
  selectTechnician(id: string, value: string): void { this.pendingTechnicians.update((values) => ({ ...values, [id]: value })); }
  setStatusObservation(id: string, value: string): void { this.statusObservations.update((values) => ({ ...values, [id]: value })); }
  hasManagementChanges(report: Report): boolean {
    return (!!this.pendingTechnicians()[report.id] && this.pendingTechnicians()[report.id] !== report.assignedTo)
      || (!!this.pendingStatuses()[report.id] && this.pendingStatuses()[report.id] !== report.status);
  }
  async saveManagementChanges(report: Report): Promise<void> {
    const selectedTech = this.pendingTechnicians()[report.id];
    const selectedStatus = this.pendingStatuses()[report.id];
    if (selectedTech && selectedTech !== report.assignedTo) {
      await this.assign(report, selectedTech);
      if (this.feedback()[report.id] !== 'Reporte asignado correctamente.') return;
    }
    if (selectedStatus && selectedStatus !== report.status && !(selectedTech && selectedTech !== report.assignedTo && selectedStatus === 'En Proceso')) {
      await this.setStatus(report, selectedStatus);
      return;
    }
    this.pendingTechnicians.update((values) => { const next = { ...values }; delete next[report.id]; return next; });
    this.pendingStatuses.update((values) => { const next = { ...values }; delete next[report.id]; return next; });
  }
  selectRepairEvidence(reportId: string, event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files || []);
    input.value = '';
    const invalid = files.find((file) => !['image/jpeg', 'image/png'].includes(file.type) || file.size > 5 * 1024 * 1024);
    if (invalid) { this.feedback.update((messages) => ({ ...messages, [reportId]: 'Adjunta JPG o PNG de máximo 5 MB cada uno.' })); return; }
    this.repairFiles.update((all) => ({ ...all, [reportId]: files }));
  }
  async uploadRepairEvidence(report: Report): Promise<void> {
    const files = this.repairFiles()[report.id] || [];
    if (!files.length) return;
    this.saving.update((ids) => [...ids, report.id]);
    try {
      for (const file of files) await firstValueFrom(this.api.uploadEvidence(Number(report.id), file));
      this.repairFiles.update((all) => { const next = { ...all }; delete next[report.id]; return next; });
      this.feedback.update((messages) => ({ ...messages, [report.id]: 'Evidencias de reparación guardadas.' }));
      await this.loadServerData();
      if (this.expanded() === report.id) await this.loadEvidenceImages(report.id);
    } catch (error) { this.feedback.update((messages) => ({ ...messages, [report.id]: this.apiMessage(error, 'No se pudieron subir las evidencias.') })); }
    finally { this.saving.update((ids) => ids.filter((value) => value !== report.id)); }
  }
  private async loadEvidenceImages(reportId: string): Promise<void> {
    const evidence = this.reportDetails()[reportId]?.evidencias || [];
    for (const item of evidence) {
      if (this.evidenceUrls()[item.idEvidencia]) continue;
      try {
        const blob = await firstValueFrom(this.api.evidenceFile(item.idEvidencia));
        this.evidenceUrls.update((urls) => ({ ...urls, [item.idEvidencia]: URL.createObjectURL(blob) }));
      } catch { this.feedback.update((messages) => ({ ...messages, [reportId]: 'No se pudo abrir la foto de este reporte.' })); }
    }
  }
  mapUrl(lat: number, lng: number): SafeResourceUrl {
    const url = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.005}%2C${lat - 0.003}%2C${lng + 0.005}%2C${lat + 0.003}&layer=mapnik&marker=${lat}%2C${lng}`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
  externalMapUrl(lat: number, lng: number): string { return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=18/${lat}/${lng}`; }
  categoryName(id: string): string {
    return this.local.data().categories.find((c) => c.id === id)?.name ?? 'Categoría inactiva';
  }
  private actor(): string {
    return this.auth.currentUser()?.nombre ?? 'Equipo Ciudad Sana';
  }
  async assign(report: Report, id: string): Promise<void> {
    if (!id) return;
    if (this.api.enabled) {
      this.saving.update((ids) => [...ids, report.id]);
      try {
        await firstValueFrom(this.api.assignReport(Number(report.id), id));
        this.feedback.update((messages) => ({ ...messages, [report.id]: 'Reporte asignado correctamente.' }));
        await this.loadServerData();
      } catch (error) { this.feedback.update((messages) => ({ ...messages, [report.id]: this.apiMessage(error, 'No se pudo guardar la asignación.') })); }
      finally { this.saving.update((ids) => ids.filter((value) => value !== report.id)); }
      return;
    }
    const tech = this.technicians().find((user) => user.id === id);
    const status: ReportStatus = id ? 'En Proceso' : 'Pendiente';
    this.local.updateReport(
      report.id,
      { assignedTo: id || undefined, status },
      {
        by: this.actor(),
        status,
        note: tech ? `Asignado a ${tech.nombre}.` : 'El reporte quedó sin técnico asignado.',
      },
    );
    this.feedback.update((messages) => ({
      ...messages,
      [report.id]: tech ? `Reporte asignado a ${tech.nombre}.` : 'Asignación actualizada.',
    }));
  }
  async setStatus(report: Report, status: ReportStatus): Promise<void> {
    if (this.api.enabled) {
      const idEstado = this.stateIds.get(status);
      if (idEstado === undefined) return;
      const observation = this.statusObservations()[report.id]?.trim();
      if ((status === 'Resuelto' || status === 'Rechazado') && !observation) {
        this.feedback.update((messages) => ({ ...messages, [report.id]: 'La observación es obligatoria para cerrar o rechazar el reporte.' }));
        return;
      }
      this.saving.update((ids) => [...ids, report.id]);
      try {
        await firstValueFrom(this.api.changeReportState(Number(report.id), idEstado, observation));
        this.feedback.update((messages) => ({ ...messages, [report.id]: 'Estado actualizado.' }));
        this.pendingStatuses.update((values) => { const next = { ...values }; delete next[report.id]; return next; });
        this.statusObservations.update((values) => { const next = { ...values }; delete next[report.id]; return next; });
        await this.loadServerData();
      } catch (error) { this.feedback.update((messages) => ({ ...messages, [report.id]: this.apiMessage(error, 'No se pudo actualizar el estado.') })); }
      finally { this.saving.update((ids) => ids.filter((value) => value !== report.id)); }
      return;
    }
    this.local.updateReport(
      report.id,
      { status },
      { by: this.actor(), status, note: `Estado actualizado a ${status}.` },
    );
    this.feedback.update((messages) => ({
      ...messages,
      [report.id]: `El estado cambió a “${status}”.`,
    }));
  }
  draft(id: string, value: string): void {
    this.noteDrafts.update((d) => ({ ...d, [id]: value }));
  }
  async saveNote(report: Report): Promise<void> {
    const note = this.noteDrafts()[report.id]?.trim();
    if (!note) return;
    if (this.api.enabled) {
      try {
        await firstValueFrom(this.api.resolveReport(Number(report.id), note));
        this.noteDrafts.update((drafts) => ({ ...drafts, [report.id]: '' }));
        this.feedback.update((messages) => ({ ...messages, [report.id]: 'Reporte marcado como resuelto.' }));
        await this.loadServerData();
      } catch { this.feedback.update((messages) => ({ ...messages, [report.id]: 'No se pudo guardar la resolución. Verifica que el reporte esté en proceso y asignado a tu usuario.' })); }
      return;
    }
    this.local.updateReport(
      report.id,
      { observations: note },
      { by: this.actor(), status: report.status, note },
    );
    this.noteDrafts.update((d) => ({ ...d, [report.id]: '' }));
    this.feedback.update((messages) => ({
      ...messages,
      [report.id]: 'Observación guardada en el historial del reporte.',
    }));
  }
  private apiMessage(error: unknown, fallback: string): string {
    const detail = (error as { error?: { message?: string; detail?: string } })?.error;
    return detail?.message || detail?.detail || fallback;
  }
}
