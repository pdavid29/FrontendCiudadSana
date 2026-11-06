import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface ApiLoginResponse { accessToken: string; expiresIn: number; idRol: number; }
export interface ApiUser {
  idUsuario: string; primerNombre: string; segundoNombre?: string | null;
  primerApellido: string; segundoApellido?: string | null; correo: string;
  telefono?: string | null; idRol: number; estado: boolean; createdAt?: string | null;
  fotoPerfil?: string | null;
}
export interface ApiCategory {
  idCategoria: number; nombre: string; descripcion?: string; icono?: string | null; estado: boolean;
}
export interface ApiBarrio { idBarrio: number; nombre: string; }
export interface ApiDepartment { idDepartamento: number; nombre: string; }
export interface ApiMunicipality { idMunicipio: number; nombre: string; }
export interface ApiRegisterCatalogItem { id: number; nombre: string; }
export interface ApiRegisterCatalogs { tiposDocumento: ApiRegisterCatalogItem[]; sexos: ApiRegisterCatalogItem[]; }
export interface ApiModule { idModulo: number; nombre: string; url: string; }
export interface ApiStatistics {
  totalReportes: number; porEstado: Record<string, number>; porCategoria: Record<string, number>;
  pendientes: number; resueltos: number; totalUsuarios: number; usuariosActivos: number;
  porMes: Record<string, number>; porPrioridad: Record<string, number>;
  porBarrio: Record<string, number>; evidencias: number; validacionesImagen: number;
}
export interface ApiReport {
  idReporte: number; titulo: string; descripcion: string; direccionReferencia?: string;
  latitud: number; longitud: number; fechaReporte: string; idCategoria: number;
  idEstado: number; idCiudadano?: string; idTecnico?: string;
  nombreCiudadano?: string; nombreTecnico?: string;
  idBarrio?: number; nombreBarrio?: string;
  correoTecnico?: string;
  evidencias?: { idEvidencia: number; nombreOriginal: string; tipoContenido: string; tamanio: number; url: string; validacion?: { resultado: string; requiereRevisionHumana: boolean; mensaje: string; deteccionesJson: string; modeloDisponible: boolean } | null }[];
}
export interface ApiState { idEstado: number; nombre: string; }
export interface ApiHistory { idHistorial: number; idEstado: number; observacion?: string; fechaCambio: string; responsable: string; }

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;
  readonly enabled = environment.apiEnabled;

  login(correo: string, password: string) {
    return this.http.post<ApiLoginResponse>(`${this.base}/auth/login`, { correo, contrasena: password });
  }
  register(payload: object, photo?: File) {
    if (!photo) return this.http.post<ApiUser>(`${this.base}/auth/register`, payload);
    const form = new FormData();
    form.append('datos', new Blob([JSON.stringify(payload)], { type: 'application/json' }));
    form.append('foto', photo);
    return this.http.post<ApiUser>(`${this.base}/auth/register-con-foto`, form);
  }
  profile() { return this.http.get<ApiUser>(`${this.base}/usuarios/me`); }
  modules() { return this.http.get<ApiModule[]>(`${this.base}/usuarios/me/modulos`); }
  updateProfile(payload: object) { return this.http.patch<ApiUser>(`${this.base}/usuarios/me`, payload); }
  profilePhoto(userId?: string) { return this.http.get(`${this.base}${userId ? `/usuarios/${encodeURIComponent(userId)}/foto` : '/usuarios/me/foto'}`, { responseType: 'blob' }); }
  uploadProfilePhoto(file: File) {
    const form = new FormData(); form.append('archivo', file);
    return this.http.post<ApiUser>(`${this.base}/usuarios/me/foto`, form);
  }
  categories() { return this.http.get<ApiCategory[]>(`${this.base}/categorias`); }
  createCategory(payload: object) { return this.http.post<ApiCategory>(`${this.base}/categorias`, payload); }
  updateCategory(id: number, payload: object) { return this.http.put<ApiCategory>(`${this.base}/categorias/${id}`, payload); }
  myReports() { return this.http.get<ApiReport[]>(`${this.base}/reportes/mis-reportes`); }
  allReports() { return this.http.get<ApiReport[]>(`${this.base}/reportes`); }
  assignedReports() { return this.http.get<ApiReport[]>(`${this.base}/reportes/tecnico`); }
  states() { return this.http.get<ApiState[]>(`${this.base}/estados`); }
  history(id: number) { return this.http.get<ApiHistory[]>(`${this.base}/reportes/${id}/historial`); }
  evidenceFile(id: number) { return this.http.get(`${this.base}/reportes/evidencias/${id}/archivo`, { responseType: 'blob' }); }
  users() { return this.http.get<ApiUser[]>(`${this.base}/usuarios`); }
  setUserActive(id: string, active: boolean) {
    return this.http.patch<void>(`${this.base}/usuarios/${encodeURIComponent(id)}/estado?activo=${active}`, null);
  }
  statistics() { return this.http.get<ApiStatistics>(`${this.base}/estadisticas`); }
  departments() { return this.http.get<ApiDepartment[]>(`${this.base}/departamentos`); }
  municipalities(departmentId: number) {
    return this.http.get<ApiMunicipality[]>(`${this.base}/municipios?departamentoId=${departmentId}`);
  }
  barrios(municipalityId?: number) {
    const query = municipalityId ? `?municipioId=${municipalityId}` : '';
    return this.http.get<ApiBarrio[]>(`${this.base}/barrios${query}`);
  }
  registrationCatalogs() { return this.http.get<ApiRegisterCatalogs>(`${this.base}/catalogos/registro`); }
  technicians() { return this.http.get<{ idUsuario: string; nombre: string }[]>(`${this.base}/usuarios/tecnicos`); }
  createReport(payload: object) { return this.http.post<ApiReport>(`${this.base}/reportes`, payload); }
  assignReport(id: number, idTecnico: string) { return this.http.patch<ApiReport>(`${this.base}/reportes/${id}/asignar`, { idTecnico, idPrioridad: null }); }
  changeReportState(id: number, idEstado: number, observacion?: string) { return this.http.patch<ApiReport>(`${this.base}/reportes/${id}/estado`, { idEstado, observacion }); }
  resolveReport(id: number, observacion: string) { return this.http.patch<ApiReport>(`${this.base}/reportes/${id}/resolver`, { observacion }); }
  uploadEvidence(id: number, file: File) {
    const form = new FormData(); form.append('archivo', file);
    return this.http.post(`${this.base}/reportes/${id}/evidencias`, form);
  }
}
