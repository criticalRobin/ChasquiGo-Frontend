import { Routes } from '@angular/router';
import { authRoutes } from './core/login/auth.routes';
import { homePageRoutes } from '@features/homepage/hompage.routes';
import { coopsRoutes } from '@features/coops/coops.routes';
import { busesRoutes } from '@features/buses/buses.routes';
import { frequenciesRoutes } from '@features/frequencies/routes.routes';
import { driversRoutes } from '@features/drivers/drivers.routes';

export const routes: Routes = [
  ...authRoutes,
  ...homePageRoutes,
  ...coopsRoutes,
  ...busesRoutes,
  ...frequenciesRoutes,
  ...driversRoutes,
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: '/login',
    pathMatch: 'full',
  },
];
