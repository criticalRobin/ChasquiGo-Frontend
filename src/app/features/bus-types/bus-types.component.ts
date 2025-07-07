import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { BusTypesService } from './services/bus-types.service';
import { IBusType } from './models/bus-type.interface';
import { AlertService } from '@shared/services/alert.service';
import { AlertType } from '@utils/enums/alert-type.enum';
import { ListBusTypesComponent } from './components/list-bus-types/list-bus-types.component';

@Component({
  selector: 'app-bus-types',
  standalone: true,
  imports: [CommonModule, RouterModule, ListBusTypesComponent],
  templateUrl: './bus-types.component.html',
  styleUrl: './bus-types.component.css'
})
export class BusTypesComponent implements OnInit {
  busTypes: IBusType[] = [];

  constructor(
    private busTypesService: BusTypesService,
    private alertService: AlertService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadBusTypes();
  }

  loadBusTypes(): void {
    this.busTypesService.getBusTypes().subscribe({
      next: (busTypes) => {
        this.busTypes = busTypes;
      },
      error: (error) => {
        console.error('Error al cargar tipos de bus:', error);
        this.alertService.showAlert({
          alertType: AlertType.ERROR,
          mainMessage: 'Error al cargar tipos de bus',
          subMessage: 'No se pudieron cargar los tipos de bus. Inténtalo nuevamente.'
        });
      }
    });
  }

  onCreateBusType(): void {
    this.router.navigate(['/bus-types/create']);
  }

  onEditBusType(id: number): void {
    this.router.navigate(['/bus-types/edit', id]);
  }

  onDeleteBusType(busType: IBusType): void {
    if (!busType.id) return;

    this.busTypesService.deleteBusType(busType.id).subscribe({
      next: () => {
        this.alertService.showAlert({
          alertType: AlertType.SUCCESS,
          mainMessage: 'Tipo eliminado',
          subMessage: `El tipo de bus "${busType.name}" ha sido dado de baja exitosamente.`
        });
        this.loadBusTypes(); // Recargar la lista
      },
      error: (error) => {
        console.error('Error al eliminar tipo de bus:', error);
        this.alertService.showAlert({
          alertType: AlertType.ERROR,
          mainMessage: 'Error al eliminar tipo',
          subMessage: 'No se pudo eliminar el tipo de bus. Inténtalo nuevamente.'
        });
      }
    });
  }
}
