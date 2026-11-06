import { AfterViewInit, Component, ElementRef, inject, OnDestroy, signal, ViewChild } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LocalDataService } from '../../../../core/services/local-data.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Report } from '../../../../core/models/ciudad-sana.models';
import { ApiService, ApiCategory, ApiBarrio, ApiDepartment, ApiMunicipality } from '../../../../core/services/api.service';
import { environment } from '../../../../../environments/environment';
import { InlineNoticeComponent } from '../../../../shared/components/inline-notice/inline-notice.component';
import { firstValueFrom } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
@Component({
  standalone: true,
  imports: [FormsModule, RouterLink, InlineNoticeComponent],
  template: `
    <section class="page-heading">
      <div>
        <span class="eyebrow">PARTICIPACIÓN CIUDADANA</span>
        <h1>Crear un reporte</h1>
        <p>Cuéntanos qué sucede y dónde para que podamos orientar la atención.</p>
      </div>
      <a routerLink="/reportes" class="back-link">← Volver a mis reportes</a>
    </section>
    <div class="form-layout report-creation-layout">
      <form class="surface-card report-form report-creation-form" (ngSubmit)="submit(form)" #form="ngForm" novalidate>
        @if (message()) { <app-inline-notice [tone]="messageTone()">{{ message() }}</app-inline-notice> }
        <div class="form-section-title">
          <span>01</span>
          <div>
            <h2>Describe la situación</h2>
            <p>Incluye detalles que ayuden a comprender el problema.</p>
          </div>
        </div>
        <div class="report-fields-grid">
        <label class="report-field-wide">Título del reporte<input
            name="title" [(ngModel)]="title" required minlength="8" maxlength="255"
            placeholder="Ej.: Luminaria apagada en el parque" /></label>
        <label>Categoría<select name="category" [(ngModel)]="categoryId" required>
            <option value="" disabled>Selecciona una categoría</option>
            @for (category of categories(); track category.id) {
              <option [value]="category.id">{{ category.name }}</option>
            }
          </select></label>
        <label class="report-field-wide">Descripción<textarea
            name="description"
            [(ngModel)]="description"
            required
            minlength="20"
            maxlength="255"
            rows="5"
            placeholder="¿Qué ocurre? ¿Desde cuándo? ¿A quiénes afecta?"
          ></textarea
          ><small class="field-help">Mínimo 20 caracteres; máximo 255 según el registro del reporte.</small></label>
        </div>
        <div class="form-section-title form-section-spaced">
          <span>02</span>
          <div>
            <h2>Ubica el lugar</h2>
            <p>Completa la ubicación administrativa y marca el punto exacto en el mapa.</p>
          </div>
        </div>
        <div class="report-fields-grid">
        <label>Departamento o ciudad<select name="departamento" [(ngModel)]="departmentId" required (ngModelChange)="selectDepartment()">
          <option value="" disabled>Selecciona un departamento o ciudad</option>
          @for (department of departments(); track department.idDepartamento) { <option [value]="department.idDepartamento">{{ department.nombre }}</option> }
        </select></label>
        <label>Municipio<select name="municipio" [(ngModel)]="municipalityId" required [disabled]="!departmentId || loadingMunicipalities()" (ngModelChange)="selectMunicipality()">
          <option value="" disabled>{{ loadingMunicipalities() ? 'Cargando municipios…' : 'Selecciona un municipio' }}</option>
          @for (municipality of municipalities(); track municipality.idMunicipio) { <option [value]="municipality.idMunicipio">{{ municipality.nombre }}</option> }
        </select></label>
        <label>Barrio<select name="barrio" [(ngModel)]="barrioId" required [disabled]="!municipalityId || loadingBarrios()">
          <option value="" disabled>{{ loadingBarrios() ? 'Cargando barrios…' : 'Selecciona un barrio' }}</option>
          @for (barrio of barrios(); track barrio.idBarrio) { <option [value]="barrio.idBarrio">{{ barrio.nombre }}</option> }
        </select></label>
        <label class="report-field-wide">Dirección o referencia<input name="location" [(ngModel)]="location" required minlength="5" maxlength="255" autocomplete="street-address" placeholder="Ej.: Calle 24 # 10-35, cerca del parque" /></label>
        <div class="report-field-wide gps-field">
          <div class="map-heading"><div><strong>Ubicación en el mapa <span class="required-mark">Obligatoria</span></strong><small>Haz clic para colocar el punto. Puedes mover el marcador para afinarlo.</small></div>
            <button type="button" class="button button-outline button-small" (click)="locate()">Usar GPS del equipo</button></div>
          @if (mapError()) { <app-inline-notice tone="error">{{ mapError() }}</app-inline-notice> }
          <div #mapContainer class="report-map" role="application" aria-label="Mapa interactivo para marcar la ubicación del reporte"></div>
          <div class="map-coordinate-status" [class.map-coordinate-selected]="coordinates()">
            @if (coordinates(); as point) { <span class="map-pin-dot"></span><span>Punto seleccionado</span><strong>Lat {{ point.latitude.toFixed(6) }} · Lon {{ point.longitude.toFixed(6) }}</strong> }
            @else { <span class="map-pin-dot map-pin-empty"></span><span>Selecciona en el mapa el lugar del reporte para continuar.</span> }
          </div>
        </div>
        </div>
        <div class="form-section-title form-section-spaced">
          <span>03</span>
          <div>
            <h2>Agrega evidencias</h2>
            <p>La fotografía es opcional; si no puedes adjuntarla, envía el reporte igualmente.</p>
          </div>
        </div>
        <label class="upload-box"
          ><input type="file" accept="image/jpeg,image/png,image/webp" capture="environment" multiple (change)="selectEvidence($event)" /><span
            class="upload-icon"
            >↑</span
          ><strong>Selecciona fotografías</strong
          ><small>Opcional · JPG o PNG · Hasta 5 MB por imagen</small></label
        >
        @if (evidence.length) {
          <div class="evidence-chips">
            @for (file of evidence; track file) {
              <span>▧ {{ file.name }}</span>
            }
          </div>
        }
        <div class="form-actions">
          <a routerLink="/reportes" class="button button-outline">Cancelar</a
          ><button class="button button-primary button-large" [disabled]="submitting() || !coordinates()">
            {{ submitting() ? 'Enviando…' : 'Enviar reporte' }} <span>→</span>
          </button>
        </div>
      </form>
      <aside class="form-sidebar">
        <div class="side-tip">
          <span>i</span>
          <h3>Un buen reporte ayuda más</h3>
          <ul>
            <li>Describe hechos concretos.</li>
            <li>Indica una ubicación precisa.</li>
            <li>Evita incluir datos personales de otras personas.</li>
          </ul>
        </div>
        <div class="privacy-card">
          <strong>Tratamiento responsable</strong>
          <p>La información del reporte se utiliza para gestionar y hacer seguimiento a la solicitud.</p>
        </div>
      </aside>
    </div>
  `,
})
export class CrearReportePageComponent {
  private local = inject(LocalDataService);
  private auth = inject(AuthService);
  private router = inject(Router);
  private api = inject(ApiService);
  @ViewChild('mapContainer') private mapContainer?: ElementRef<HTMLDivElement>;
  readonly categories = signal(this.local.data().categories.filter((category) => category.active));
  readonly departments = signal<ApiDepartment[]>([]);
  readonly municipalities = signal<ApiMunicipality[]>([]);
  readonly barrios = signal<ApiBarrio[]>([]);
  readonly loadingMunicipalities = signal(false);
  readonly loadingBarrios = signal(false);
  readonly messageTone = signal<'info' | 'success' | 'error'>('info');
  readonly mapError = signal('');
  departmentId = '';
  municipalityId = '';
  title = '';
  description = '';
  categoryId = '';
  location = '';
  zone = '';
  barrioId = '';
  evidence: File[] = [];
  readonly coordinates = signal<{ latitude: number; longitude: number } | null>(null);
  readonly message = signal('');
  readonly submitting = signal(false);
  private createdReportId?: number;
  private readonly uploadedEvidence = new Set<File>();
  private map: any;
  private marker: any;
  constructor() {
    if (this.api.enabled) { void this.loadCategories(); void this.loadDepartments(); }
  }
  ngAfterViewInit(): void { void this.initializeMap(); }
  ngOnDestroy(): void { this.map?.remove(); }
  private leaflet(): Promise<any> {
    const browserWindow = window as Window & { L?: any };
    if (browserWindow.L) return Promise.resolve(browserWindow.L);
    return new Promise((resolve, reject) => {
      if (!document.getElementById('ciudadsana-leaflet-css')) {
        const css = document.createElement('link');
        css.id = 'ciudadsana-leaflet-css';
        css.rel = 'stylesheet';
        css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(css);
      }
      let script = document.getElementById('ciudadsana-leaflet-js') as HTMLScriptElement | null;
      if (!script) {
        script = document.createElement('script');
        script.id = 'ciudadsana-leaflet-js';
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.async = true;
        document.head.appendChild(script);
      }
      const loaded = () => browserWindow.L ? resolve(browserWindow.L) : reject(new Error('Leaflet no disponible'));
      script.addEventListener('load', loaded, { once: true });
      script.addEventListener('error', () => reject(new Error('No se pudo descargar Leaflet')), { once: true });
      if (browserWindow.L) resolve(browserWindow.L);
    });
  }
  private async initializeMap(): Promise<void> {
    try {
      const L = await this.leaflet();
      if (!this.mapContainer) return;
      this.map = L.map(this.mapContainer.nativeElement, { scrollWheelZoom: true })
        .setView([10.9685, -74.7813], 13);
      L.tileLayer(environment.mapTileUrl, {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap contributors</a>',
      }).addTo(this.map);
      this.map.on('click', (event: any) => this.setMapPoint(event.latlng.lat, event.latlng.lng));
      window.setTimeout(() => this.map?.invalidateSize(), 100);
    } catch {
      this.mapError.set('No se pudo cargar el mapa. Revisa tu conexión a internet y vuelve a abrir el formulario.');
    }
  }
  private setMapPoint(latitude: number, longitude: number, recenter = false): void {
    this.coordinates.set({ latitude, longitude });
    if (!this.map) return;
    const L = (window as Window & { L?: any }).L;
    if (!this.marker) {
      this.marker = L.marker([latitude, longitude], { draggable: true }).addTo(this.map);
      this.marker.on('dragend', () => {
        const point = this.marker.getLatLng();
        this.coordinates.set({ latitude: point.lat, longitude: point.lng });
      });
    } else this.marker.setLatLng([latitude, longitude]);
    if (recenter) this.map.setView([latitude, longitude], Math.max(this.map.getZoom(), 16));
  }
  private clearMapPoint(): void {
    this.coordinates.set(null);
    if (this.marker && this.map) this.map.removeLayer(this.marker);
    this.marker = undefined;
  }
  private async loadDepartments(): Promise<void> {
    try { this.departments.set(await firstValueFrom(this.api.departments())); }
    catch { this.showMessage('No se pudieron cargar los departamentos. Actualiza la página e inténtalo nuevamente.', 'error'); }
  }
  async selectDepartment(): Promise<void> {
    this.municipalityId = '';
    this.barrioId = '';
    this.clearMapPoint();
    this.municipalities.set([]);
    this.barrios.set([]);
    if (!this.departmentId) return;
    this.loadingMunicipalities.set(true);
    try {
      this.municipalities.set(await firstValueFrom(this.api.municipalities(Number(this.departmentId))));
      this.showMessage(this.municipalities().length ? '' : 'No hay municipios activos para esta selección.', 'info');
    } catch { this.showMessage('No se pudieron cargar los municipios. Inténtalo nuevamente.', 'error'); }
    finally { this.loadingMunicipalities.set(false); }
  }
  async selectMunicipality(): Promise<void> {
    this.barrioId = '';
    this.clearMapPoint();
    this.barrios.set([]);
    if (!this.municipalityId) return;
    this.loadingBarrios.set(true);
    try {
      this.barrios.set(await firstValueFrom(this.api.barrios(Number(this.municipalityId))));
      this.showMessage(this.barrios().length ? '' : 'No hay barrios activos para este municipio.', 'info');
    } catch { this.showMessage('No se pudieron cargar los barrios del municipio. Inténtalo nuevamente.', 'error'); }
    finally { this.loadingBarrios.set(false); }
  }
  private async loadCategories(): Promise<void> {
    try {
      const items = await firstValueFrom(this.api.categories());
      this.categories.set(items.filter((category) => category.estado).map((category: ApiCategory) => ({
        id: String(category.idCategoria), name: category.nombre, description: category.descripcion || '', active: category.estado,
      })));
    } catch { this.showMessage('No se pudieron cargar las categorías. Actualiza la página e inténtalo nuevamente.', 'error'); }
  }
  locate(): void {
    if (!navigator.geolocation) { this.showMessage('Este navegador no ofrece geolocalización.', 'error'); return; }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => { this.setMapPoint(coords.latitude, coords.longitude, true); this.showMessage('Punto GPS agregado al mapa.', 'success'); },
      () => this.showMessage('No fue posible obtener la ubicación. Revisa el permiso del navegador y vuelve a intentar.', 'error'),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }
  selectEvidence(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.evidence = Array.from(input.files ?? []);
    input.value = '';
    const invalid = this.evidence.find((file) => !['image/jpeg', 'image/png'].includes(file.type) || file.size > 5 * 1024 * 1024);
    if (invalid) {
      this.evidence = [];
      this.showMessage('Selecciona imágenes JPG o PNG de hasta 5 MB cada una.', 'error');
    } else this.showMessage('', 'info');
  }
  private showMessage(text: string, tone: 'info' | 'success' | 'error'): void {
    this.message.set(text);
    this.messageTone.set(tone);
  }
  private requestError(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) return 'No se pudo completar el envío. Inténtalo nuevamente.';
    if (error.status === 0) return 'No hay conexión con el servidor. Verifica que el backend esté activo e inténtalo nuevamente.';
    if (error.status === 401) return 'Tu sesión venció. Inicia sesión nuevamente.';
    if (error.status === 403) return 'Tu cuenta no tiene permiso para crear este reporte.';
    if (error.status === 413) return 'La fotografía supera el tamaño permitido. Usa una imagen de hasta 5 MB.';
    const body = error.error as { message?: unknown; detail?: unknown } | string | null;
    const detail = typeof body === 'string' ? body : body && typeof body === 'object'
      ? [body.message, body.detail].find((value): value is string => typeof value === 'string' && !!value.trim())
      : undefined;
    if (error.status === 400 && detail && !/exception|sql|hibernate|spring|stack/i.test(detail)) return detail;
    if (this.createdReportId !== undefined) return 'El reporte se guardó, pero no se pudo completar la fotografía. Vuelve a intentarlo para adjuntarla.';
    return 'El servidor no pudo guardar el reporte. Revisa los datos e inténtalo de nuevo.';
  }
  async submit(form: NgForm): Promise<void> {
    const user = this.auth.currentUser();
    if (!user) { this.showMessage('Inicia sesión para registrar un reporte.', 'error'); return; }
    form.control.markAllAsTouched();
    if (form.invalid) {
      this.showMessage('Completa todos los campos obligatorios antes de enviar.', 'error');
      return;
    }
    const point = this.coordinates();
    if (!point) { this.showMessage('Marca en el mapa el lugar exacto del reporte.', 'error'); return; }
    if (this.api.enabled) {
      this.submitting.set(true);
      try {
        if (!this.createdReportId) {
          const created = await firstValueFrom(this.api.createReport({
            titulo: this.title.trim(), descripcion: this.description.trim(), direccionReferencia: this.location.trim() || null,
            latitud: point.latitude, longitud: point.longitude, idCategoria: Number(this.categoryId),
            idBarrio: Number(this.barrioId), idMunicipio: Number(this.municipalityId),
          }));
          this.createdReportId = created.idReporte;
        }
        let evidenceUploaded = 0;
        for (const file of this.evidence) {
          try {
            await firstValueFrom(this.api.uploadEvidence(this.createdReportId!, file));
            evidenceUploaded++;
          } catch {
            // La evidencia es opcional y no invalida el reporte ya guardado.
          }
        }
        this.createdReportId = undefined;
        this.uploadedEvidence.clear();
        const successMessage = evidenceUploaded === this.evidence.length && evidenceUploaded > 0
          ? 'Reporte enviado y fotografía cargada.'
          : 'Reporte enviado correctamente. Puedes adjuntar una fotografía más adelante.';
        sessionStorage.setItem('reporte-enviado', successMessage);
        this.showMessage(successMessage, 'success');
        window.location.assign('/reportes');
      } catch (error) {
        this.showMessage(this.requestError(error), 'error');
      } finally { this.submitting.set(false); }
      return;
    }
    this.showMessage('El servicio de reportes no está disponible. Inténtalo nuevamente más tarde.', 'error');
  }
}
