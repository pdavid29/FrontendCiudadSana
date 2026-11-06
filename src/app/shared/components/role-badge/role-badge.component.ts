import { Component, input } from '@angular/core';
import { ROLE_NAMES, RoleId } from '../../../core/models/ciudad-sana.models';
@Component({
  selector: 'app-role-badge',
  standalone: true,
  template: `<span class="role-tag" [class]="'role-tag role-' + role()">{{
    ROLE_NAMES[role()]
  }}</span>`,
})
export class RoleBadgeComponent {
  readonly role = input.required<RoleId>();
  readonly ROLE_NAMES = ROLE_NAMES;
}
