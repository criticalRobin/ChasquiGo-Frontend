import { Component, EventEmitter, OnInit, Output, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { IBuses, IBusType } from '../../models/buses.interface';
import { BusesService } from '../../services/buses.service';
import { AlertService } from '@shared/services/alert.service';
import { AlertType } from '@utils/enums/alert-type.enum';
import { PaginationComponent } from '@shared/components/pagination/pagination.component';
import { SearchComponent } from '@shared/components/search/search.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-list-buses',
  standalone: true,
  imports: [CommonModule, PaginationComponent, SearchComponent], 
  templateUrl: './list-buses.component.html',
  styleUrl: './list-buses.component.css'
})
export class ListBusesComponent implements OnInit, OnDestroy {
  @Output() createBusClicked = new EventEmitter<void>();
  @Output() editBusClicked = new EventEmitter<IBuses>();
  
  buses: IBuses[] = [];
  busTypes: IBusType[] = [];
  filteredBuses: IBuses[] = [];
  paginatedBuses: IBuses[] = [];
  busToDelete: IBuses | null = null;
  showDeleteModal = false;
  
  // Propiedades de paginación
  currentPage: number = 1;
  itemsPerPage: number = 5;
  totalPages: number = 1;
  
  private subscriptions: Subscription = new Subscription();
    constructor(
    private busService: BusesService,
    private router: Router,
    private alertService: AlertService
  ) {}
  
  ngOnInit(): void {
    this.loadBusTypes();
    this.loadBuses();
  }
  
  loadBuses(): void {
    // Obtener el ID de la cooperativa del localStorage
    const userCooperative = localStorage.getItem('userCooperative');
    if (!userCooperative) {
      console.error('No se encontró información de la cooperativa en localStorage');
      return;
    }
    
    let cooperativeId: number;
    try {
      const cooperativeData = JSON.parse(userCooperative);
      cooperativeId = cooperativeData.id;
      
      if (!cooperativeId) {
        console.error('ID de cooperativa no válido:', cooperativeData);
        return;
      }
    } catch (error) {
      console.error('Error al parsear datos de cooperativa desde localStorage:', error);
      return;
    }
    
    // Usar el nuevo endpoint con el ID de la cooperativa
    this.subscriptions.add(
      this.busService.getBusesByCooperativeId(cooperativeId).subscribe({
        next: (buses: IBuses[]) => {
          this.buses = buses;
          this.filteredBuses = [...buses];
          this.updatePagination();
        },
        error: (error: any) => {
          console.error('Error loading buses:', error);
          this.alertService.showAlert({
            alertType: AlertType.ERROR,
            mainMessage: 'Error al cargar buses'
          });
        }
      })
    );
  }

  loadBusTypes(): void {
    this.subscriptions.add(
      this.busService.getBusTypes().subscribe({
        next: (types: IBusType[]) => {
          this.busTypes = types;
        },
        error: (error) => {
          console.error('Error al cargar los tipos de bus:', error);
        }
      })
    );
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
      this.subscriptions.add(
        this.busService.deleteBus(this.busToDelete.id).subscribe({
          next: () => {
            // Mostrar alerta de éxito
            this.alertService.showAlert({
              alertType: AlertType.SUCCESS,
              mainMessage: 'Bus dado de Baja',
              subMessage: 'El bus ha sido eliminado exitosamente'
            });
            
            this.loadBuses(); // Esto ya actualiza filteredBuses
            this.cancelDelete();
          },
          error: (error) => {
            console.error('Error al eliminar el bus:', error);
            
            // Mostrar alerta de error
            this.alertService.showAlert({
              alertType: AlertType.ERROR,
              mainMessage: 'Error al eliminar bus',
              subMessage: 'Ocurrió un error al eliminar el bus. Inténtalo nuevamente.'
            });
            
            this.cancelDelete();
          }
        })
      );
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

  // Métodos para búsqueda
  protected onSearch(searchTerm: string): void {
    if (!searchTerm.trim()) {
      this.filteredBuses = this.buses;
    } else {
      const searchTermLower = searchTerm.toLowerCase().trim();
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
    this.currentPage = 1;
    this.updatePagination();
  }

  // Métodos para paginación
  protected onPageChange(page: number): void {
    this.currentPage = page;
    this.updatePagination();
  }

  private updatePagination(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedBuses = this.filteredBuses.slice(startIndex, endIndex);
    this.totalPages = Math.ceil(this.filteredBuses.length / this.itemsPerPage);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
