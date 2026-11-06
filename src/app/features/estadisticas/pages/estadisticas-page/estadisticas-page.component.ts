import { Component, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiService, ApiStatistics } from '../../../../core/services/api.service';
import { InlineNoticeComponent } from '../../../../shared/components/inline-notice/inline-notice.component';

@Component({
  standalone: true,
  imports: [InlineNoticeComponent],
  template: `<section class="page-heading"><div><span class="eyebrow">SEGUIMIENTO GENERAL</span><h1>Estadísticas</h1>
    <p>Indicadores calculados a partir de los registros de atención.</p></div>
    <button class="button button-outline" (click)="load()" [disabled]="loading()">Actualizar</button></section>
    @if (error()) { <app-inline-notice tone="error">{{ error() }}</app-inline-notice> }
    @if (loading() && !stats()) { <div class="surface-card table-empty">Cargando indicadores…</div> }
    @if (stats(); as data) {
      <section class="metrics-grid statistics-metrics">
        <article class="metric-card"><div class="metric-top"><span class="metric-icon blue">▤</span></div><p>Total de reportes</p><strong>{{ data.totalReportes }}</strong></article>
        <article class="metric-card"><div class="metric-top"><span class="metric-icon amber">◷</span></div><p>Pendientes</p><strong>{{ data.pendientes }}</strong></article>
        <article class="metric-card"><div class="metric-top"><span class="metric-icon green">✓</span></div><p>Resueltos</p><strong>{{ data.resueltos }}</strong></article>
        <article class="metric-card"><div class="metric-top"><span class="metric-icon violet">♙</span></div><p>Usuarios activos</p><strong>{{ data.usuariosActivos }} <small>de {{ data.totalUsuarios }}</small></strong></article>
      </section>
      <section class="statistics-grid statistics-grid-real">
        <article class="surface-card statistics-card"><div class="card-heading"><div><span class="eyebrow">DISTRIBUCIÓN</span><h2>Reportes por categoría</h2></div></div>
          @for (item of rows(data.porCategoria); track item.label) { <div class="bar-row"><div><span>{{ item.label }}</span><strong>{{ item.count }}</strong></div><div class="bar-track"><span [style.width.%]="ratio(item.count, data.porCategoria)"></span></div></div> }
          @empty { <p class="field-help">Aún no hay reportes por categoría.</p> }</article>
        <article class="surface-card statistics-card"><div class="card-heading"><div><span class="eyebrow">FLUJO DE ATENCIÓN</span><h2>Reportes por estado</h2></div></div>
          @for (item of rows(data.porEstado); track item.label) { <div class="status-stat"><span class="status-dot received"></span><span>{{ item.label }}</span><strong>{{ item.count }}</strong></div> }
          @empty { <p class="field-help">Aún no hay reportes registrados.</p> }</article>
        <article class="surface-card statistics-card"><div class="card-heading"><div><span class="eyebrow">EVOLUCIÓN</span><h2>Reportes por mes</h2></div></div>
          @for (item of rows(data.porMes); track item.label) { <div class="bar-row"><div><span>{{ item.label }}</span><strong>{{ item.count }}</strong></div><div class="bar-track"><span [style.width.%]="ratio(item.count, data.porMes)"></span></div></div> }
          @empty { <p class="field-help">No hay periodos con actividad.</p> }</article>
        <article class="surface-card statistics-card"><div class="card-heading"><div><span class="eyebrow">NIVEL DE ATENCIÓN</span><h2>Reportes por prioridad</h2></div></div>
          @for (item of rows(data.porPrioridad); track item.label) { <div class="bar-row"><div><span>{{ item.label }}</span><strong>{{ item.count }}</strong></div><div class="bar-track"><span [style.width.%]="ratio(item.count, data.porPrioridad)"></span></div></div> }
          @empty { <p class="field-help">No hay prioridades con actividad.</p> }</article>
        <article class="surface-card statistics-card"><div class="card-heading"><div><span class="eyebrow">COBERTURA TERRITORIAL</span><h2>Barrios con más reportes</h2></div></div>
          @for (item of rows(data.porBarrio); track item.label) { <div class="bar-row"><div><span>{{ item.label }}</span><strong>{{ item.count }}</strong></div><div class="bar-track"><span [style.width.%]="ratio(item.count, data.porBarrio)"></span></div></div> }
          @empty { <p class="field-help">No hay reportes asociados a barrios.</p> }</article>
        <article class="surface-card statistics-card"><div class="card-heading"><div><span class="eyebrow">EVIDENCIA Y VALIDACIÓN</span><h2>Fotografías recibidas</h2></div></div>
          <div class="status-stat"><span>Fotografías adjuntas</span><strong>{{ data.evidencias }}</strong></div>
          <div class="status-stat"><span>Validaciones de imagen registradas</span><strong>{{ data.validacionesImagen }}</strong></div>
          <p class="field-help">El resultado visual apoya la revisión y no determina por sí solo la legitimidad de un reporte.</p></article>
      </section>
      <p class="management-note"><span>i</span> Los valores se consultan directamente del sistema de gestión.</p>
    }`,
})
export class EstadisticasPageComponent {
  private readonly api = inject(ApiService);
  readonly stats = signal<ApiStatistics | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');
  constructor() { void this.load(); }
  async load(): Promise<void> {
    this.loading.set(true); this.error.set('');
    try { this.stats.set(await firstValueFrom(this.api.statistics())); }
    catch { this.error.set('No fue posible consultar las estadísticas. Actualiza la página o vuelve a iniciar sesión.'); }
    finally { this.loading.set(false); }
  }
  rows(record: Record<string, number>): { label: string; count: number }[] {
    return Object.entries(record ?? {}).map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count);
  }
  ratio(value: number, record: Record<string, number>): number {
    const max = Math.max(1, ...Object.values(record ?? {}));
    return Math.max(value > 0 ? 4 : 0, Math.round(value / max * 100));
  }
}
