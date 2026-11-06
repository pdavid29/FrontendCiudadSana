import { Routes } from '@angular/router';
import { moduleGuard, roleGuard } from './core/guards/role.guard';
import { PrivateShellComponent } from './layout/private-shell/private-shell.component';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./features/principal/pages/principal-page/principal-page.component').then(
        (m) => m.PrincipalPageComponent,
      ),
  },
  {
    path: 'como-funciona',
    loadComponent: () =>
      import('./features/principal/pages/como-funciona-page/como-funciona-page.component').then(
        (m) => m.ComoFuncionaPageComponent,
      ),
  },
  {
    path: 'acceso',
    loadComponent: () =>
      import('./features/acceso/pages/acceso-page/acceso-page.component').then(
        (m) => m.AccesoPageComponent,
      ),
  },
  {
    path: 'registro',
    loadComponent: () =>
      import('./features/acceso/pages/registro-page/registro-page.component').then(
        (m) => m.RegistroPageComponent,
      ),
  },
  {
    path: '',
    component: PrivateShellComponent,
    canActivate: [roleGuard()],
    children: [
      {
        path: 'panel',
        loadComponent: () =>
          import('./features/panel/pages/panel-page/panel-page.component').then(
            (m) => m.PanelPageComponent,
          ),
      },
      {
        path: 'reportes/nuevo',
        canActivate: [moduleGuard(4)],
        loadComponent: () =>
          import('./features/reportes/pages/crear-reporte-page/crear-reporte-page.component').then(
            (m) => m.CrearReportePageComponent,
          ),
      },
      {
        path: 'reportes',
        canActivate: [moduleGuard([3, 4, 5])],
        loadComponent: () =>
          import('./features/reportes/pages/reportes-page/reportes-page.component').then(
            (m) => m.ReportesPageComponent,
          ),
      },
      {
        path: 'usuarios',
        canActivate: [moduleGuard(1)],
        loadComponent: () =>
          import('./features/usuarios/pages/usuarios-page/usuarios-page.component').then(
            (m) => m.UsuariosPageComponent,
          ),
      },
      {
        path: 'categorias',
        canActivate: [moduleGuard(2)],
        loadComponent: () =>
          import('./features/categorias/pages/categorias-page/categorias-page.component').then(
            (m) => m.CategoriasPageComponent,
          ),
      },
      {
        path: 'estadisticas',
        canActivate: [moduleGuard(6)],
        loadComponent: () =>
          import('./features/estadisticas/pages/estadisticas-page/estadisticas-page.component').then(
            (m) => m.EstadisticasPageComponent,
          ),
      },
      {
        path: 'perfil',
        loadComponent: () =>
          import('./features/perfil/pages/perfil-page/perfil-page.component').then(
            (m) => m.PerfilPageComponent,
          ),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
