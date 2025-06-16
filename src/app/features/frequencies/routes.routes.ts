import { Routes } from '@angular/router';
import { AuthGuard } from '@utils/guards/auth.guard';

export const frequenciesRoutes: Routes = [
  {
    path: 'frecuencias',
    loadComponent: () =>
      import('./frequencies.component').then((c) => c.RoutesComponent),
    canActivate: [AuthGuard],
  },
  {
    path: 'frecuencias/crear',
    loadComponent: () =>
      import('./components/frequencies-form/frequencies-form.component').then((c) => c.RouteFormComponent),
    canActivate: [AuthGuard],
  },
  {
    path: 'frecuencias/editar/:id',
    loadComponent: () =>
      import('./components/frequencies-form/frequencies-form.component').then((c) => c.RouteFormComponent),
    canActivate: [AuthGuard],
  },
  {
    path: 'frecuencias/:id',
    loadComponent: () =>
      import('./components/frequencies-detail/frequencies-detail.component').then((c) => c.RouteDetailComponent),
    canActivate: [AuthGuard],
  },
]; 