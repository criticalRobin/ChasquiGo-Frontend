import { Routes } from '@angular/router';
import { AuthGuard } from '@utils/guards/auth.guard';

export const ticketsRoutes: Routes = [
  {
    path: 'tickets',
    loadComponent: () =>
      import('./tickets-sale.component').then((c) => c.TicketsSaleComponent),
    canActivate: [AuthGuard],
  },
];
