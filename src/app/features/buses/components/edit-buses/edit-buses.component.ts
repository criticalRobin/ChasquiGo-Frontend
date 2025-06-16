import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { BusesService } from '../../services/buses.service';
import { IBuses } from '../../models/buses.interface';
import { FormBusesComponent } from '../form-buses/form-buses.component';
// import { EditBusesThreeComponent } from '../edit-buses-three/edit-buses-three.component'; // Removed as per request
import { LoadingService } from '../../../../shared/services/loading.service';
import { AlertService } from '../../../../shared/services/alert.service';
import { AlertType } from '../../../../utils/enums/alert-type.enum';
import { CommonModule } from '@angular/common';
import { IBusSeat } from '../../models/buses.interface';

@Component({
  selector: 'app-edit-buses',
  templateUrl: './edit-buses.component.html',
  standalone: true,
  imports: [CommonModule, FormBusesComponent, RouterModule]
})
export class EditBusesComponent implements OnInit {
  currentBus: IBuses | null = null;
  // currentStep = 1; // Removed as per request
  isLoading = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private busesService: BusesService,
    private loadingService: LoadingService,
    private alertService: AlertService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      const id = +params['id']; // Convertir a número con el operador +
      if (id) {
        this.busesService.getBusById(id).subscribe({
          next: (bus) => {
            this.currentBus = bus;
            this.isLoading = false;
          },
          error: (error) => {
            this.alertService.showAlert({
              alertType: AlertType.ERROR,
              mainMessage: 'Error al cargar el bus',
              subMessage: error.message,
            });
            this.isLoading = false;
          },
        });
      }
    });
  }

  onFormSubmitted(bus: IBuses): void {
    // Simplified to directly save after form submission
    if (this.currentBus) {
      // Only update editable fields (chassisBrand, licensePlate, bodyworkBrand)
      this.currentBus.licensePlate = bus.licensePlate;
      this.currentBus.chassisBrand = bus.chassisBrand;
      this.currentBus.bodyworkBrand = bus.bodyworkBrand;
      this.saveBus();
    }
  }

  // updateBusSeats(bus: IBuses): void { // Removed as per request
  //   if (this.currentBus) {
  //     this.currentBus.seats = bus.seats;
  //     this.currentBus.capacity = bus.capacity;
  //     this.currentBus.floorCount = bus.floorCount;
  //   }
  // }

  saveBus(): void {
    if (!this.currentBus || !this.currentBus.id) return;

    this.loadingService.setLoading(true);

    // Construir la carga útil explícitamente para incluir solo las propiedades esperadas
    const busToSend = {
      cooperativeId: this.currentBus.cooperativeId,
      licensePlate: this.currentBus.licensePlate,
      chassisBrand: this.currentBus.chassisBrand,
      bodyworkBrand: this.currentBus.bodyworkBrand,
      photo: this.currentBus.photo || null, // Asegurar que sea null si no está definido o es vacío
      stoppageDays: this.currentBus.stoppageDays,
      busTypeId: this.currentBus.busTypeId,
      seats: this.currentBus.seats.map(seat => ({
        number: seat.number,
        type: seat.type.toUpperCase() as 'NORMAL' | 'VIP', // Convertir a mayúsculas
        location: seat.location,
      }))
    };

    this.busesService.updateBus(this.currentBus.id, busToSend).subscribe({
      next: () => {
        this.loadingService.setLoading(false);
        this.alertService.showAlert({
          alertType: AlertType.SUCCESS,
          mainMessage: 'Bus actualizado correctamente'
        });
        this.router.navigate(['/buses']);
      },
      error: (error) => {
        this.loadingService.setLoading(false);
        this.alertService.showAlert({
          alertType: AlertType.ERROR,
          mainMessage: 'Error al actualizar el bus',
          subMessage: error.message
        });
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/buses']);
  }
}
