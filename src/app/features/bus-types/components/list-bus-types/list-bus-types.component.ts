import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IBusType } from '../../models/bus-type.interface';
import { PaginationComponent } from '@shared/components/pagination/pagination.component';
import { SearchComponent } from '@shared/components/search/search.component';

@Component({
  selector: 'app-list-bus-types',
  standalone: true,
  imports: [CommonModule, PaginationComponent, SearchComponent],
  templateUrl: './list-bus-types.component.html',
  styleUrl: './list-bus-types.component.css'
})
export class ListBusTypesComponent implements OnChanges {
  @Input() busTypes: IBusType[] = [];
  
  @Output() editBusType = new EventEmitter<number>();
  @Output() deleteBusType = new EventEmitter<IBusType>();
  @Output() createBusType = new EventEmitter<void>();

  filteredBusTypes: IBusType[] = [];
  paginatedBusTypes: IBusType[] = [];
  
  // Propiedades de paginación
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 1;

  // Propiedades para el modal de eliminación
  showDeleteModal: boolean = false;
  busTypeToDelete: IBusType | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['busTypes'] && this.busTypes) {
      this.filteredBusTypes = [...this.busTypes];
      this.updatePagination();
    }
  }

  // Métodos para búsqueda
  onSearch(searchTerm: string): void {
    if (!searchTerm.trim()) {
      this.filteredBusTypes = [...this.busTypes];
    } else {
      this.filteredBusTypes = this.busTypes.filter(busType =>
        busType.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        busType.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    this.currentPage = 1;
    this.updatePagination();
  }

  // Métodos para paginación
  onPageChange(page: number): void {
    this.currentPage = page;
    this.updatePagination();
  }

  private updatePagination(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedBusTypes = this.filteredBusTypes.slice(startIndex, endIndex);
    this.totalPages = Math.ceil(this.filteredBusTypes.length / this.itemsPerPage);
  }

  // Método para crear nuevo tipo de bus
  onCreateBusType(): void {
    this.createBusType.emit();
  }

  onEdit(id: number): void {
    this.editBusType.emit(id);
  }

  onDelete(busType: IBusType): void {
    this.busTypeToDelete = busType;
    this.showDeleteModal = true;
  }

  confirmDelete(): void {
    if (this.busTypeToDelete) {
      this.deleteBusType.emit(this.busTypeToDelete);
      this.cancelDelete();
    }
  }

  cancelDelete(): void {
    this.showDeleteModal = false;
    this.busTypeToDelete = null;
  }

  getFloorText(floorCount: number): string {
    return floorCount === 1 ? '1 Piso' : '2 Pisos';
  }

  getTotalSeats(busType: IBusType): number {
    return busType.seatsFloor1 + (busType.seatsFloor2 || 0);
  }

  getShortDescription(description: string): string {
    if (description.length <= 40) {
      return description;
    }
    return description.substring(0, 40) + '...';
  }
}
