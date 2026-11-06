import { Component, input } from '@angular/core';
import { ReportStatus } from '../../../core/models/ciudad-sana.models';
@Component({
  selector: 'app-status-badge',
  standalone: true,
  template: `<span class="status-badge" [class]="'status-badge status-' + statusClass()"
    ><span></span>{{ status() }}</span
  >`,
})
export class StatusBadgeComponent {
  readonly status = input.required<ReportStatus>();
  statusClass(): string {
    return (
      (
        {
          Pendiente: 'received',
          'En Proceso': 'progress',
          Rechazado: 'closed',
          Recibido: 'received',
          'En revisión': 'review',
          Asignado: 'assigned',
          'En atención': 'progress',
          Resuelto: 'resolved',
          'No procedente': 'closed',
        } as Record<string, string>
      )[this.status()] ?? 'received'
    );
  }
}
