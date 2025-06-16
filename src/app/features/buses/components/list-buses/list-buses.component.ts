import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Bus } from '../../models/bus.model';
import { BusService } from '../../services/bus.service';
import { CooperativeService } from '../../services/cooperative.service';

interface Cooperative {
  id: number;
  name: string;
}

@Component({
  selector: 'app-list-buses',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './list-buses.component.html',
  styleUrl: './list-buses.component.css'
})
export class ListBusesComponent implements OnInit {
  @Output() createBusClicked = new EventEmitter<void>();
  @Output() editBusClicked = new EventEmitter<Bus>();
  
  buses: Bus[] = [];
  cooperatives: Cooperative[] = [];
  selectedCooperativeId: number | null = null;
  busToDelete: Bus | null = null;
  showDeleteModal = false;
  
  constructor(
    private busService: BusService,
    private cooperativeService: CooperativeService
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
    this.busService.getBuses().subscribe({
      next: (buses) => {
        this.buses = buses;
      },
      error: (error) => {
        console.error('Error loading buses:', error);
      }
    });
  }
  
  filterBuses(): void {
    if (this.selectedCooperativeId) {
      // En un escenario real, deberías tener un endpoint para filtrar por cooperativa
      // Por ahora, simplemente filtramos en el cliente
      this.busService.getBuses().subscribe({
        next: (buses) => {
          this.buses = buses.filter(bus => bus.cooperativeId === this.selectedCooperativeId);
        },
        error: (error) => {
          console.error('Error filtering buses:', error);
        }
      });
    } else {
      this.loadBuses();
    }
  }
    onCreateBus(): void {
    console.log('Botón Crear Bus clickeado');
    this.createBusClicked.emit();
  }

  onEditBus(bus: Bus): void {
    console.log('Botón Editar clickeado para bus:', bus);
    this.editBusClicked.emit(bus);
  }
  
  onDeleteBus(bus: Bus): void {
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
