import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { RoleId } from '../models/ciudad-sana.models';
import { AuthService } from '../services/auth.service';
import { ApiService } from '../services/api.service';
import { firstValueFrom } from 'rxjs';

export const roleGuard =
  (roles?: RoleId[]): CanActivateFn =>
  async () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    await auth.ready;
    if (!auth.signedIn()) return router.createUrlTree(['/acceso']);
    if (roles && !auth.hasRole(...roles)) return router.createUrlTree(['/panel']);
    return true;
  };

export const moduleGuard = (moduleIds: number | number[]): CanActivateFn => async () => {
  const auth = inject(AuthService);
  const api = inject(ApiService);
  const router = inject(Router);
  await auth.ready;
  if (!auth.signedIn()) return router.createUrlTree(['/acceso']);

  try {
    const allowedIds = Array.isArray(moduleIds) ? moduleIds : [moduleIds];
    const modules = await firstValueFrom(api.modules());
    return modules.some((module) => allowedIds.includes(module.idModulo))
      ? true
      : router.createUrlTree(['/panel']);
  } catch {
    return router.createUrlTree(['/panel']);
  }
};
