import { Routes } from '@angular/router';
import { AuthGuard } from '@utils/guards/auth.guard';

export const driversRoutes: Routes = [
  {
    path: 'drivers',
    loadComponent: () =>
      import('./drivers.component').then((c) => c.DriversComponent),
    canActivate: [AuthGuard],
  },
  {
    path: 'create-update-driver',
    loadComponent: () =>
      import(
        './pages/create-update-driver/create-update-driver.component'
      ).then((c) => c.CreateUpdateDriverComponent),
    canActivate: [AuthGuard],
  },
  {
    path: 'drivers/edit/:id',
    loadComponent: () =>
      import(
        './pages/create-update-driver/create-update-driver.component'
      ).then((c) => c.CreateUpdateDriverComponent),
    canActivate: [AuthGuard],
  },
];
