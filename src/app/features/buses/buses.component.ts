import { Component, OnInit, ChangeDetectorRef, AfterViewInit, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBusesComponent } from './components/form-buses/form-buses.component';
import { BusesThreeComponent } from './components/buses-three/buses-three.component';
import { ListBusesComponent } from './components/list-buses/list-buses.component';
import { Bus } from './models/bus.model';
import { BusService } from './services/bus.service';
import { BusFormCacheService } from './services/bus-form-cache.service';

@Component({
  selector: 'app-buses',
  standalone: true,
  imports: [CommonModule, RouterLink, FormBusesComponent, BusesThreeComponent, ListBusesComponent],
  templateUrl: './buses.component.html',
  styleUrl: './buses.component.css'
})
export class BusesComponent implements OnInit, AfterViewInit {
  currentStep = 1;
  currentBus: Bus | null = null;
  isFormValid = false;
  isEditing = false;
  viewMode: 'list' | 'form' = 'list'; // Por defecto mostrar la lista de buses
  
  constructor(
    private busService: BusService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
    private busFormCacheService: BusFormCacheService
  ) {}

  ngOnInit(): void {
    // Initialize component state here
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
    });
  }
  
  startEditingBus(bus: Bus): void {
    this.ngZone.run(() => {
      this.viewMode = 'form';
      this.currentStep = 1;
      this.currentBus = { ...bus }; // Crear una copia para evitar modificaciones directas
      this.isEditing = true;
      
      // Cache the form data
      this.busFormCacheService.cacheFormData(this.currentBus);
      
      this.cdr.markForCheck();
    });
  }
  
  returnToList(): void {
    this.ngZone.run(() => {
      this.viewMode = 'list';
      this.resetForm();
      this.cdr.markForCheck();
    });
  }
  
  onFormSubmitted(bus: Bus): void {
    // Use NgZone to run this outside Angular's change detection
    this.ngZone.run(() => {
      this.currentBus = bus;
      this.isFormValid = true;
      this.currentStep = 2;
      
      // Cache the form data
      this.busFormCacheService.cacheFormData(bus);
      
      // Use setTimeout to ensure this runs after change detection cycle
      setTimeout(() => {
        this.cdr.markForCheck();
      });
    });
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      // Use NgZone to handle the step change properly
      this.ngZone.run(() => {
        this.currentStep--;
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
      // Crear una copia limpia del bus actual
      const busCopy: any = { ...this.currentBus };
      
      // Eliminar propiedades que no deben enviarse al backend
      delete busCopy.isDeleted;
      delete busCopy.capacity;
      delete busCopy.floorCount;
      delete busCopy.photos;
      
      // Si hay fotos, usar solo la primera como 'photo'
      if (this.currentBus.photos && this.currentBus.photos.length > 0) {
        busCopy.photo = this.currentBus.photos[0];
      } else {
        busCopy.photo = ""; // O una URL por defecto si es necesario
      }
      
      // Asegurarse de que busTypeId esté presente
      if (!busCopy.busTypeId) {
        busCopy.busTypeId = 1; // Valor por defecto
      }
        
      // Clean the seats array to match API expectations
      if (busCopy.seats && busCopy.seats.length > 0) {
        console.log('Using configured seats:', busCopy.seats);
          // Map seats to the format expected by the API
        busCopy.seats = busCopy.seats.map((seat: any) => {
          // Keep only the fields needed by the API
          return {
            number: seat.number,
            type: seat.type,
            location: seat.location
          };
        });
      } else {
        // Si no hay asientos configurados, crear asientos por defecto
        // usando capacity y floorCount como valores locales (no se envían al backend)
        console.log('No seats configured, generating defaults...');
        busCopy.seats = this.generateDefaultSeats(this.currentBus.capacity || 20, this.currentBus.floorCount || 1);
      }
      
      console.log('Sending bus data to backend:', busCopy);
      
      if (this.isEditing) {
        this.busService.updateBus(busCopy).subscribe({
          next: () => {
            this.ngZone.run(() => {
              this.returnToList();
            });
          },          error: (error) => {
            console.error('Error al actualizar el bus:', error);
          }
        });
      } else {
        this.busService.createBus(busCopy).subscribe({next: () => {
            this.ngZone.run(() => {
              this.returnToList();
            });
          },
          error: (error) => {
            console.error('Error al crear el bus:', error);
          }
        });
      }
    }
  }

  updateBusSeats(updatedBus: Bus): void {
    // Update the current bus with the configured seats
    this.currentBus = updatedBus;
  }

  /**
   * Generates default seat configurations when no seats have been configured
   * @param capacity Total seat capacity of the bus
   * @param floorCount Number of floors (1 or 2)
   * @returns Array of seat objects in the format expected by the API
   */  private generateDefaultSeats(capacity: number, floorCount: number): any[] {
    const seats = [];
    // Total capacity per floor (each floor gets the full capacity)
    const capacityPerFloor = capacity;
    // Seats per row (typically 4 - 2 on each side of aisle)
    const seatsPerRow = 4;
    // Calculate rows needed per floor
    const rowsPerFloor = Math.ceil(capacityPerFloor / seatsPerRow);
    // Total VIP seats (10% of total capacity per floor, rounded down)
    const vipSeatCount = Math.floor(capacityPerFloor * 0.1);
    
    let seatNumber = 1; // Contador secuencial global para los asientos
    
    for (let floor = 1; floor <= floorCount; floor++) {
      let floorSeatCounter = 0;
      
      for (let row = 1; row <= rowsPerFloor && floorSeatCounter < capacityPerFloor; row++) {
        // Each row has 4 seats max (2 on each side of aisle)
        for (let col = 0; col < 4 && floorSeatCounter < capacityPerFloor; col++) {
          floorSeatCounter++;
          
          // Determine seat location (window or aisle)
          const isWindow = col === 0 || col === 3;
          const location = isWindow ? 'ventana' : 'pasillo';
          
          // Determine seat type (first 10% are VIP)
          const type = floorSeatCounter <= vipSeatCount ? 'VIP' : 'NORMAL';
          
          seats.push({
            number: seatNumber.toString(), // Usar número secuencial como string
            type: type,
            location: location
          });
            seatNumber++; // Incrementar el contador secuencial
        }
      }
    }
    
    return seats;
  }

  private resetForm(): void {
    this.currentStep = 1;
    this.currentBus = null;
    this.isFormValid = false;
    this.isEditing = false;
  }
}
