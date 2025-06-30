import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IBuses, IBusType } from '../../models/buses.interface';
import { BusesService } from '../../services/buses.service';

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
  busTypes: IBusType[] = [];
  filteredBuses: IBuses[] = [];
  loading: boolean = true;
  busToDelete: IBuses | null = null;
  showDeleteModal = false;
  searchTerm: string = '';
    constructor(
    private busService: BusesService,
    private router: Router
  ) {}
  
  ngOnInit(): void {
    this.loadBusTypes();
    this.loadBuses();
  }
  
  loadBuses(): void {
    this.loading = true;
    
    // Obtener el ID de la cooperativa del localStorage
    const userCooperative = localStorage.getItem('userCooperative');
    if (!userCooperative) {
      console.error('No se encontró información de la cooperativa en localStorage');
      this.loading = false;
      return;
    }
    
    let cooperativeId: number;
    try {
      const cooperativeData = JSON.parse(userCooperative);
      cooperativeId = cooperativeData.id;
      
      if (!cooperativeId) {
        console.error('ID de cooperativa no válido:', cooperativeData);
        this.loading = false;
        return;
      }
    } catch (error) {
      console.error('Error al parsear datos de cooperativa desde localStorage:', error);
      this.loading = false;
      return;
    }
    
    // Usar el nuevo endpoint con el ID de la cooperativa
    this.busService.getBusesByCooperativeId(cooperativeId).subscribe({
      next: (buses: IBuses[]) => {
        this.buses = buses;
        this.filteredBuses = [...buses]; // Inicializar la lista filtrada
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error loading buses:', error);
        this.loading = false;
      }
    });
  }

  loadBusTypes(): void {
    this.busService.getBusTypes().subscribe({
      next: (types: IBusType[]) => {
        this.busTypes = types;
      },
      error: (error) => {
        console.error('Error al cargar los tipos de bus:', error);
      }
    });
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
      this.loading = true;
      this.busService.deleteBus(this.busToDelete.id).subscribe({
        next: () => {
          this.loadBuses(); // Esto ya actualiza filteredBuses
          this.cancelDelete();
        },
        error: (error) => {
          console.error('Error al eliminar el bus:', error);
          this.loading = false;
          this.cancelDelete();
        }
      });
    }
  }
  
  cancelDelete(): void {
    this.showDeleteModal = false;
    this.busToDelete = null;
  }

  getBusTypeName(busTypeId: number): string {
    const busType = this.busTypes.find(type => type.id === busTypeId);
    return busType ? busType.name : `Tipo ${busTypeId}`;
  }

  onSearchChange(): void {
    this.filterBuses();
  }

  filterBuses(): void {
    if (!this.searchTerm.trim()) {
      // Si no hay término de búsqueda, mostrar todos los buses
      this.filteredBuses = [...this.buses];
      return;
    }

    const searchTermLower = this.searchTerm.toLowerCase().trim();
    
    this.filteredBuses = this.buses.filter(bus => {
      // Filtrar por placa
      const plateMatch = bus.licensePlate?.toLowerCase().includes(searchTermLower);
      
      // Filtrar por chasis
      const chassisMatch = bus.chassisBrand?.toLowerCase().includes(searchTermLower);
      
      // Filtrar por carrocería
      const bodyworkMatch = bus.bodyworkBrand?.toLowerCase().includes(searchTermLower);
      
      // Filtrar por tipo de bus
      const busTypeName = this.getBusTypeName(bus.busTypeId);
      const typeMatch = busTypeName.toLowerCase().includes(searchTermLower);
      
      // Retornar true si coincide con cualquiera de los criterios
      return plateMatch || chassisMatch || bodyworkMatch || typeMatch;
    });
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.filterBuses();
  }
}
