import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IDriver } from '../../models/driver.interface';
import { DriversService } from '../../services/drivers.service';
import { AlertService } from '@shared/services/alert.service';
import { AlertType } from '@utils/enums/alert-type.enum';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-driver-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './driver-card.component.html',
  styleUrl: './driver-card.component.css'
})
export class DriverCardComponent {
  @Input() driver!: IDriver;

  constructor(
    private router: Router,
    private driversService: DriversService,
    private alertService: AlertService
  ) {}

  onEdit(): void {
    this.router.navigate(['/create-update-driver', this.driver.id]);
  }

  confirmDelete(): void {
    this.driversService.deleteDriver(this.driver.id).subscribe({
      next: () => {
        this.alertService.showAlert({
          alertType: AlertType.SUCCESS,
          mainMessage: 'Conductor eliminado exitosamente'
        });
        
        // Recargar la página para actualizar la lista
        window.location.reload();
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error deleting driver:', error);
        this.alertService.showAlert({
          alertType: AlertType.ERROR,
          mainMessage: 'Error al eliminar el conductor'
        });
      }
    });
  }
}
