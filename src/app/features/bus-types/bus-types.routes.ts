import { Routes } from '@angular/router';
import { BusTypesComponent } from './bus-types.component';
import { FormBusTypeComponent } from './components/form-bus-type/form-bus-type.component';

export const busTypesRoutes: Routes = [
  {
    path: 'bus-types',
    component: BusTypesComponent
  },
  {
    path: 'bus-types/create',
    component: FormBusTypeComponent
  },
  {
    path: 'bus-types/edit/:id',
    component: FormBusTypeComponent
  }
];
