import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IBuses } from '../../models/buses.interface';
import { BusesService } from '../../services/buses.service';
import { CooperativeService } from '../../services/cooperative.service';

interface Cooperative {
  id: number;
  name: string;
}

@Component({
  selector: 'app-list-buses',
  standalone: true,
  imports: [CommonModule, FormsModule], 
  templateUrl: './list-buses.component.html',
  styleUrl: './list-buses.component.css'
})
export class ListBusesComponent implements OnInit {
  @Output() createBusClicked = new EventEmitter<void>();
  @Output() editBusClicked = new EventEmitter<IBuses>();
  
  buses: IBuses[] = [];
  cooperatives: Cooperative[] = [];
  selectedCooperativeId: number | null = null;
  loading: boolean = true;
  busToDelete: IBuses | null = null;
  showDeleteModal = false;
    constructor(
    private busService: BusesService,
    private cooperativeService: CooperativeService,
    private router: Router
  ) {}
  
  ngOnInit(): void {
    this.loadCooperatives();
    this.loadBuses();
  }
  
  loadCooperatives(): void {
    this.cooperativeService.getCooperatives().subscribe({
      next: (coops) => {
        this.cooperatives = coops;
      },
      error: (error) => {
        console.error('Error loading cooperatives:', error);
      }
    });
  }
  
  loadBuses(): void {
    this.loading = true;
    const userCooperativeString = localStorage.getItem('userCooperative');
    let cooperativeId: number | null = null;

    if (userCooperativeString) {
      try {
        const userCooperative = JSON.parse(userCooperativeString);
        if (userCooperative && typeof userCooperative.id === 'number') {
          cooperativeId = userCooperative.id;
        }
      } catch (e) {
        console.error('Error parsing userCooperative from localStorage', e);
      }
    }

    if (cooperativeId !== null) {
      // Use the new endpoint for the specific cooperative
      this.busService.getBusesByCooperative(cooperativeId).subscribe({
        next: (buses: IBuses[]) => {
          this.buses = buses;
          this.loading = false;
        },
        error: (error: any) => {
          console.error('Error loading buses by cooperative:', error);
          this.loading = false;
        }
      });
    } else {
      // Fallback to loading all buses if cooperativeId is not found or invalid
      console.warn('userCooperative ID not found in localStorage or invalid. Loading all buses.');
      this.busService.getBuses().subscribe({
        next: (buses: IBuses[]) => {
          this.buses = buses;
          this.loading = false;
        },
        error: (error: any) => {
          console.error('Error loading all buses:', error);
          this.loading = false;
        }
      });
    }
  }
  
  filterBuses(): void {
    if (this.selectedCooperativeId) {
      // Assuming this.buses already contains buses for the user's cooperative
      // Filter locally if selectedCooperativeId is different from user's cooperative id
      const userCooperativeString = localStorage.getItem('userCooperative');
      let userCoopId: number | null = null;
      if (userCooperativeString) {
        try {
          const userCooperative = JSON.parse(userCooperativeString);
          if (userCooperative && typeof userCooperative.id === 'number') {
            userCoopId = userCooperative.id;
          }
        } catch (e) {
          console.error('Error parsing userCooperative from localStorage', e);
        }
      }

      if (this.selectedCooperativeId === userCoopId) {
        // If filtering by user's own cooperative, just reload all buses (which are already filtered by coop)
        this.loadBuses(); 
      } else {
        // If filtering by a different cooperative (not typical for this feature, but just in case)
        // You would typically make another API call to /buses/cooperative/{selectedCooperativeId}
        // For now, filter from already loaded buses if any
        this.busService.getBuses().subscribe({
          next: (buses) => {
            this.buses = buses.filter(bus => bus.cooperativeId === this.selectedCooperativeId);
            this.loading = false;
          },
          error: (error) => {
            console.error('Error filtering buses:', error);
            this.loading = false;
          }
        });
      }
    } else {
      this.loadBuses();
    }
  }
    onCreateBus(): void {
    console.log('Botón Crear Bus clickeado');
    this.createBusClicked.emit();
  }  onEditBus(bus: IBuses): void {
    if (bus && bus.id) {
      console.log('Redirigiendo a editar bus:', bus.id);
      this.router.navigate(['/buses/editar', bus.id]);
    } else {
      console.error('No se puede editar el bus porque no tiene un ID válido', bus);
    }
  }
  
  onDeleteBus(bus: IBuses): void {
    console.log('Botón Eliminar clickeado para bus:', bus);
    this.busToDelete = bus;
    this.showDeleteModal = true;
  }
  
  confirmDelete(): void {
    if (this.busToDelete && this.busToDelete.id) {
      this.busService.deleteBus(this.busToDelete.id).subscribe({
        next: () => {
          this.loadBuses();
          this.cancelDelete();
        },
        error: (error) => {
          console.error('Error al eliminar el bus:', error);
          this.cancelDelete();
        }
      });
    }
  }
  
  cancelDelete(): void {
    this.showDeleteModal = false;
    this.busToDelete = null;
  }

  getCooperativeName(cooperativeId: number): string {
    const coop = this.cooperatives.find(c => c.id === cooperativeId);
    return coop ? coop.name : 'No asignada';
  }
}
