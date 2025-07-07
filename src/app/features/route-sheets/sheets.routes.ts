import { Routes } from '@angular/router';
import { RouteSheetsComponent } from './route-sheets.component';
import { CreateUpdateRouteSheetComponent } from './pages/create-update-route-sheet/create-update-route-sheet.component';
import { AuthGuard } from '@utils/guards/auth.guard';

export const ROUTE_SHEETS_ROUTES: Routes = [
  {
    path: 'hojas-ruta',
    component: RouteSheetsComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'hojas-ruta/create',
    component: CreateUpdateRouteSheetComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'hojas-ruta/edit/:id',
    component: CreateUpdateRouteSheetComponent,
    canActivate: [AuthGuard]
  }
];
