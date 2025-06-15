import { Routes } from '@angular/router';
import { AuthGuard } from '@utils/guards/auth.guard';

export const routesRoutes: Routes = [
  {
    path: 'rutas',
    loadComponent: () =>
      import('./routes.component').then((c) => c.RoutesComponent),
    canActivate: [AuthGuard],
  },
  {
    path: 'rutas/crear',
    loadComponent: () =>
      import('./components/route-form/route-form.component').then((c) => c.RouteFormComponent),
    canActivate: [AuthGuard],
  },
  {
    path: 'rutas/editar/:id',
    loadComponent: () =>
      import('./components/route-form/route-form.component').then((c) => c.RouteFormComponent),
    canActivate: [AuthGuard],
  },
  {
    path: 'rutas/:id',
    loadComponent: () =>
      import('./components/route-detail/route-detail.component').then((c) => c.RouteDetailComponent),
    canActivate: [AuthGuard],
  },
]; 