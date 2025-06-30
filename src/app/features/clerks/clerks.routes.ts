import { Routes } from '@angular/router';
import { AuthGuard } from '@utils/guards/auth.guard';

export const clerksRoutes: Routes = [
  {
    path: 'oficinistas',
    loadComponent: () =>
      import('./clerks.component').then((c) => c.ClerksComponent),
    canActivate: [AuthGuard],
  },
  {
    path: 'create-update-clerk',
    loadComponent: () =>
      import(
        './pages/create-update-clerk/create-update-clerk.component'
      ).then((c) => c.CreateUpdateClerkComponent),
    canActivate: [AuthGuard],
  },
  {
    path: 'create-update-clerk/:id',
    loadComponent: () =>
      import(
        './pages/create-update-clerk/create-update-clerk.component'
      ).then((c) => c.CreateUpdateClerkComponent),
    canActivate: [AuthGuard],
  },
];
