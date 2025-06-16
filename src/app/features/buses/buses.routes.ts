import { Routes } from '@angular/router';
import { AuthGuard } from '@utils/guards/auth.guard';

export const busesRoutes: Routes = [
  {
    path: 'buses',
    loadComponent: () =>
      import('./buses.component').then((c) => c.BusesComponent),
    canActivate: [AuthGuard],
  },
];
