export type RoleId = 1 | 2 | 3 | 4;
export type ReportStatus =
  'Pendiente' | 'En Proceso' | 'Resuelto' | 'Rechazado' |
  'Recibido' | 'En revisión' | 'Asignado' | 'En atención' | 'No procedente';

export interface User {
  id: string;
  nombre: string;
  email: string;
  phone?: string;
  fotoPerfil?: string;
  password?: string;
  roleId: RoleId;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}
export interface Category {
  id: string;
  name: string;
  description: string;
  active: boolean;
}
export interface ReportEvent {
  at: string;
  by: string;
  status: ReportStatus;
  note: string;
}
export interface Report {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  location: string;
  zone: string;
  createdAt: string;
  updatedAt: string;
  citizenId: string;
  assignedTo?: string;
  status: ReportStatus;
  evidence: string[];
  observations: string;
  history: ReportEvent[];
  validation?: { result: string; message: string; detectionsJson: string; requiresHumanReview: boolean };
}
export interface LocalData {
  users: User[];
  categories: Category[];
  reports: Report[];
}
export const ROLE_NAMES: Record<RoleId, string> = {
  1: 'Administrador',
  2: 'Asistente de gestión',
  3: 'Ciudadano',
  4: 'Técnico',
};
export const STATUSES: ReportStatus[] = [
  'Pendiente',
  'En Proceso',
  'Resuelto',
  'Rechazado',
];
