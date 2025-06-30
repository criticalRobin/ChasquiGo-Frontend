import { Routes } from '@angular/router';
import { authRoutes } from './core/login/auth.routes';
import { homePageRoutes } from '@features/homepage/hompage.routes';
import { coopsRoutes } from '@features/coops/coops.routes';
import { busesRoutes } from '@features/buses/buses.routes';
import { busTypesRoutes } from '@features/bus-types/bus-types.routes';
import { frequenciesRoutes } from '@features/frequencies/routes.routes';
import { driversRoutes } from '@features/drivers/drivers.routes';
import { clerksRoutes } from '@features/clerks/clerks.routes';
import { ROUTE_SHEETS_ROUTES } from '@features/route-sheets/sheets.routes';
import { ticketsRoutes } from '@features/tickets-sale/tickets.routes';

export const routes: Routes = [
  ...authRoutes,
  ...homePageRoutes,
  ...coopsRoutes,
  ...busesRoutes,
  ...busTypesRoutes,
  ...frequenciesRoutes,
  ...driversRoutes,
  ...clerksRoutes,
  ...ROUTE_SHEETS_ROUTES,
  ...ticketsRoutes,
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
