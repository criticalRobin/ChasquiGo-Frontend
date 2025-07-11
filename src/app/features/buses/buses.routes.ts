import { Routes } from '@angular/router';
import { AuthGuard } from '@utils/guards/auth.guard';

export const busesRoutes: Routes = [
  {
    path: 'buses',
    loadComponent: () =>
      import('./buses.component').then((c) => c.BusesComponent),
    canActivate: [AuthGuard],
  },
  {
    path: 'buses/create-bus',
    loadComponent: () =>
      import('./buses.component').then((c) => c.BusesComponent),
    canActivate: [AuthGuard],
  },
  {
    path: 'buses/editar/:id',
    loadComponent: () =>
      import('./components/edit-seats/edit-seats.component').then((c) => c.EditSeatsComponent),
    canActivate: [AuthGuard],
  }
 /* {
    path: 'buses/editar/:id',
    loadComponent: () =>
      import('./components/edit-buses/edit-buses.component').then((c) => c.EditBusesComponent),
    canActivate: [AuthGuard],
  }*/
];
