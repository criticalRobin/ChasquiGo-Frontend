import { Routes } from '@angular/router';
import { AuthGuard } from '@utils/guards/auth.guard';

export const routeSheetsRoutes: Routes = [
  {
    path: 'hojas-ruta',
    loadComponent: () =>
      import('./route-sheets.component').then((c) => c.RouteSheetsComponent),
    canActivate: [AuthGuard],
  },
];
