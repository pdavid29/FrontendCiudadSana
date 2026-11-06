import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ApiCategory, ApiService } from '../../../../core/services/api.service';
import { InlineNoticeComponent } from '../../../../shared/components/inline-notice/inline-notice.component';

@Component({
  standalone: true,
  imports: [FormsModule, InlineNoticeComponent],
  template: `<section class="page-heading"><div><span class="eyebrow">CONFIGURACIÓN DEL PORTAL</span>
    <h1>Categorías de reporte</h1><p>Organiza las situaciones para facilitar su revisión y asignación.</p></div>
    <button class="button button-primary" (click)="showForm.update((value) => !value)">＋ Nueva categoría</button></section>
    @if (error()) { <app-inline-notice tone="error">{{ error() }}</app-inline-notice> }
    @if (showForm()) { <form class="surface-card category-form" (ngSubmit)="add()" #form="ngForm">
      <div><strong>Agregar categoría</strong><p>La nueva opción estará disponible para crear reportes.</p></div>
      <label>Nombre<input name="name" [(ngModel)]="name" required minlength="3" maxlength="255" placeholder="Ej.: Seguridad vial" /></label>
      <label>Descripción<input name="description" [(ngModel)]="description" required minlength="8" maxlength="255" placeholder="¿Qué situaciones incluye?" /></label>
      <button class="button button-primary button-small" [disabled]="form.invalid || busy()">Guardar categoría</button>
    </form> }
    @if (loading()) { <div class="surface-card table-empty">Cargando categorías…</div> }
    <div class="category-grid">@for (category of categories(); track category.idCategoria) {
      <article class="surface-card category-card"><div class="category-top"><span class="category-icon">☷</span>
        <span class="account-state" [class.inactive]="!category.estado"><i></i>{{ category.estado ? 'Activa' : 'Inactiva' }}</span></div>
        <h2>{{ category.nombre }}</h2><p>{{ category.descripcion }}</p>
        <div class="category-bottom"><span>{{ counts()[category.idCategoria] || 0 }} reportes asociados</span>
          <button class="text-button" [disabled]="busy()" (click)="toggle(category)">{{ category.estado ? 'Desactivar' : 'Activar' }}</button></div>
      </article>
    }</div>
    @if (!loading() && !categories().length && !error()) { <div class="surface-card table-empty">No hay categorías registradas.</div> }
    <p class="management-note"><span>i</span> Las categorías inactivas se conservan en los reportes existentes, pero dejan de mostrarse para nuevos reportes.</p>`,
})
export class CategoriasPageComponent {
  private readonly api = inject(ApiService);
  readonly categories = signal<ApiCategory[]>([]);
  readonly counts = signal<Record<number, number>>({});
  readonly showForm = signal(false);
  readonly loading = signal(true);
  readonly busy = signal(false);
  readonly error = signal('');
  name = '';
  description = '';
  constructor() { void this.load(); }
  private async load(): Promise<void> {
    this.loading.set(true);
    try {
      const [categories, reports] = await Promise.all([firstValueFrom(this.api.categories()), firstValueFrom(this.api.allReports())]);
      this.categories.set(categories);
      const counts: Record<number, number> = {};
      for (const report of reports) counts[report.idCategoria] = (counts[report.idCategoria] || 0) + 1;
      this.counts.set(counts);
      this.error.set('');
    } catch { this.error.set('No fue posible consultar las categorías. Actualiza la página o vuelve a iniciar sesión.'); }
    finally { this.loading.set(false); }
  }
  async add(): Promise<void> {
    if (!this.name.trim() || !this.description.trim()) return;
    this.busy.set(true); this.error.set('');
    try {
      await firstValueFrom(this.api.createCategory({ nombre: this.name.trim(), descripcion: this.description.trim(), estado: true }));
      this.name = ''; this.description = ''; this.showForm.set(false); await this.load();
    } catch { this.error.set('No se pudo guardar la categoría. Revisa que el nombre no esté repetido.'); }
    finally { this.busy.set(false); }
  }
  async toggle(category: ApiCategory): Promise<void> {
    this.busy.set(true); this.error.set('');
    try {
      await firstValueFrom(this.api.updateCategory(category.idCategoria, { ...category, estado: !category.estado }));
      await this.load();
    } catch { this.error.set('No se pudo actualizar el estado de la categoría.'); }
    finally { this.busy.set(false); }
  }
}
