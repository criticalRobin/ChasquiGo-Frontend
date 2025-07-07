import { Routes } from '@angular/router';
import { AuthGuard } from '@utils/guards/auth.guard';

export const homePageRoutes: Routes = [
  {
    path: 'inicio',
    loadComponent: () =>
      import('./homepage.component').then((c) => c.HomepageComponent),
    canActivate: [AuthGuard],
  },
];
