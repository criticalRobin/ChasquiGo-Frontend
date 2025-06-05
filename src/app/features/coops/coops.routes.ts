import { Routes } from '@angular/router';
import { AuthGuard } from '@utils/guards/auth.guard';

export const coopsRoutes: Routes = [
  {
    path: 'coop',
    loadComponent: () =>
      import('./coops.component').then((c) => c.CoopsComponent),
    canActivate: [AuthGuard],
  },
];
