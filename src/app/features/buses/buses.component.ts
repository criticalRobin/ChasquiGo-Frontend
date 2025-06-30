import { Component, OnInit, ChangeDetectorRef, AfterViewInit, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { FormBusesComponent } from './components/form-buses/form-buses.component';
import { ListBusesComponent } from './components/list-buses/list-buses.component';
import { SeatConfigurationComponent } from './components/seat-configuration/seat-configuration.component';
import { IBuses, IBusSeat, IBusType } from './models/buses.interface';
import { BusesService } from './services/buses.service';
import { BusFormCacheService } from './services/bus-form-cache.service';
import { AlertService } from '@shared/services/alert.service';
import { AlertType } from '@utils/enums/alert-type.enum';

@Component({
  selector: 'app-buses',
  standalone: true,
  imports: [CommonModule, RouterLink, FormBusesComponent, ListBusesComponent, SeatConfigurationComponent],
  templateUrl: './buses.component.html',
  styleUrl: './buses.component.css'
})
export class BusesComponent implements OnInit, AfterViewInit {
  currentStep = 1;
  currentBus: IBuses | null = null;
  selectedBusType: IBusType | null = null;
  loadingBusType = false;
  busTypeError = false;
  isFormValid = false;
  isEditing = false;
  viewMode: 'list' | 'form' = 'list'; // Por defecto mostrar la lista de buses
    constructor(
    private busService: BusesService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
    private busFormCacheService: BusFormCacheService,
    private router: Router,
    private route: ActivatedRoute,
    private alertService: AlertService
  ) {}

  ngOnInit(): void {
    // Check if we're on the create-bus route
    this.route.url.subscribe(url => {
      if (url.length > 1 && url[1].path === 'create-bus') {
        this.startCreatingBus();
      }
    });
  }

  ngAfterViewInit(): void {
    // This ensures that initial change detection has completed
    this.cdr.detectChanges();
  }
    // Métodos para manejo de la vista
  startCreatingBus(): void {
    this.ngZone.run(() => {
      this.viewMode = 'form';
      this.currentStep = 1;
      this.currentBus = null;
      this.isEditing = false;
      this.cdr.markForCheck();
      // Navigate to create-bus URL if not already there
      if (this.router.url !== '/buses/create-bus') {
        this.router.navigate(['/buses/create-bus']);
      }
    });
  }
    startEditingBus(bus: IBuses): void {
    if (bus && bus.id) {
      this.router.navigate(['/buses/editar', bus.id]);
    } else {
      console.error('No se puede editar el bus porque no tiene un ID válido');
    }
  }
  
  returnToList(): void {
    this.ngZone.run(() => {
      this.viewMode = 'list';
      this.resetForm();
      this.cdr.markForCheck();
      // Navigate back to buses list
      this.router.navigate(['/buses']);
    });
  }
  
  onFormSubmitted(bus: IBuses): void {
    // Use NgZone to run this outside Angular's change detection
    this.ngZone.run(() => {
      this.currentBus = bus;
      this.isFormValid = true;
      this.loadingBusType = true;
      this.busTypeError = false;
      
      console.log('Form submitted, bus data:', bus);
      
      // Obtener el tipo de bus seleccionado
      if (bus.busTypeId) {
        console.log('Loading bus type for ID:', bus.busTypeId);
        this.busService.getBusTypes().subscribe({
          next: (busTypes: IBusType[]) => {
            console.log('Bus types loaded:', busTypes);
            console.log('Looking for busTypeId:', bus.busTypeId, 'type:', typeof bus.busTypeId);
            
            // Asegurar que ambos sean números para la comparación
            const busTypeIdNumber = Number(bus.busTypeId);
            this.selectedBusType = busTypes.find(type => type.id === busTypeIdNumber) || null;
            
            console.log('Selected bus type:', this.selectedBusType);
            
            if (this.selectedBusType) {
              this.loadingBusType = false;
              this.currentStep = 2;
              
              // Cache the form data
              this.busFormCacheService.cacheFormData(bus);
              
              // Use setTimeout to ensure this runs after change detection cycle
              setTimeout(() => {
                this.cdr.markForCheck();
              });
            } else {
              console.error('Bus type not found! Available IDs:', busTypes.map(t => t.id));
              this.loadingBusType = false;
              this.busTypeError = true;
            }
          },
          error: (error) => {
            console.error('Error al cargar tipos de bus:', error);
            this.loadingBusType = false;
            this.busTypeError = true;
          }
        });
      } else {
        console.error('No busTypeId found in bus data');
        this.loadingBusType = false;
        this.busTypeError = true;
      }
    });
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      // Use NgZone to handle the step change properly
      this.ngZone.run(() => {
        this.currentStep--;
        this.busTypeError = false; // Limpiar error al retroceder
        setTimeout(() => {
          this.cdr.markForCheck();
        });
      });
    }
  }

  cancel(): void {
    this.ngZone.run(() => {
      this.returnToList();
    });
  }
  
  saveBus(): void {
    if (this.currentBus) {
      // Obtener el ID de la cooperativa del localStorage
      const userCooperative = localStorage.getItem('userCooperative');
      let cooperativeId = 1; // valor por defecto
      
      if (userCooperative) {
        try {
          const cooperativeData = JSON.parse(userCooperative);
          cooperativeId = cooperativeData.id;
        } catch (error) {
          console.error('Error al parsear datos de cooperativa:', error);
        }
      }
      
      // Crear una copia limpia del bus actual según la nueva estructura del backend
      const busCopy: any = {
        cooperativeId: cooperativeId,
        licensePlate: this.currentBus.licensePlate,
        chassisBrand: this.currentBus.chassisBrand,
        bodyworkBrand: this.currentBus.bodyworkBrand,
        busTypeId: this.currentBus.busTypeId || 1
      };
      
      // Si hay fotos, usar solo la primera como 'photo'
      if (this.currentBus.photos && this.currentBus.photos.length > 0) {
        busCopy.photo = this.currentBus.photos[0];
      } else {
        busCopy.photo = "https://ejemplo.com/foto-default.jpg"; // URL por defecto
      }
      
      // Configurar asientos según la nueva estructura
      if (this.currentBus.seats && this.currentBus.seats.length > 0) {
        console.log('Using configured seats:', this.currentBus.seats);
        // Map seats to the format expected by the API
        busCopy.seats = this.currentBus.seats.map((seat: any) => ({
          floor: seat.floor || 1,
          number: parseInt(seat.number.toString()),
          type: seat.type.toUpperCase(),
          location: seat.location.toUpperCase()
        }));
      } else {
        // Si no hay asientos configurados, crear asientos por defecto
        console.log('No seats configured, generating defaults...');
        busCopy.seats = this.generateDefaultSeats(this.currentBus.capacity || 20, this.currentBus.floorCount || 1);
      }
      
      console.log('Sending bus data to backend:', busCopy);
      
      if (this.isEditing) {
        this.busService.updateBus(this.currentBus.id!, busCopy).subscribe({
          next: () => {
            this.ngZone.run(() => {
              // Mostrar alerta de éxito
              this.alertService.showAlert({
                alertType: AlertType.SUCCESS,
                mainMessage: 'BUS ACTUALIZADO',
                subMessage: 'El bus ha sido actualizado exitosamente'
              });
              this.returnToList();
            });
          },
          error: (error) => {
            console.error('Error al actualizar el bus:', error);
            // Mostrar alerta de error
            this.alertService.showAlert({
              alertType: AlertType.ERROR,
              mainMessage: 'Error al actualizar bus',
              subMessage: 'Ocurrió un error al actualizar el bus. Inténtalo nuevamente.'
            });
          }
        });
      } else {
        this.busService.createBus(busCopy).subscribe({
          next: () => {
            this.ngZone.run(() => {
              // Mostrar alerta de éxito
              this.alertService.showAlert({
                alertType: AlertType.SUCCESS,
                mainMessage: 'BUS CREADO',
                subMessage: 'El bus ha sido creado exitosamente'
              });
              this.returnToList();
            });
          },
          error: (error) => {
            console.error('Error al crear el bus:', error);
            // Mostrar alerta de error
            this.alertService.showAlert({
              alertType: AlertType.ERROR,
              mainMessage: 'Error al crear bus',
              subMessage: 'Ocurrió un error al crear el bus. Inténtalo nuevamente.'
            });
          }
        });
      }
    }
  }

  updateBusSeats(updatedBus: IBuses): void {
    // Update the current bus with the configured seats
    this.currentBus = updatedBus;
  }

  onSeatsConfigured(seats: IBusSeat[]): void {
    if (this.currentBus) {
      this.currentBus.seats = seats;
      // Proceder a guardar el bus
      this.saveBus();
    }
  }

  onBackFromSeats(): void {
    this.previousStep();
  }

  /**
   * Generates default seat configurations when no seats have been configured
   * @param capacity Total seat capacity of the bus
   * @param floorCount Number of floors (1 or 2)
   * @returns Array of seat objects in the format expected by the API
   */  
  private generateDefaultSeats(capacity: number, floorCount: number): any[] {
    const seats = [];
    
    for (let i = 1; i <= capacity; i++) {
      seats.push({
        floor: Math.ceil(i / Math.ceil(capacity / floorCount)),
        number: i,
        type: 'NORMAL',
        location: i % 2 === 0 ? 'PASILLO' : 'WINDOW'
      });
    }
    
    return seats;
  }

  private resetForm(): void {
    this.currentStep = 1;
    this.currentBus = null;
    this.selectedBusType = null;
    this.loadingBusType = false;
    this.busTypeError = false;
    this.isFormValid = false;
    this.isEditing = false;
  }
}
