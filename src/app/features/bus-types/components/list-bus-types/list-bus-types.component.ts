import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IBusType } from '../../models/bus-type.interface';

@Component({
  selector: 'app-list-bus-types',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './list-bus-types.component.html',
  styleUrl: './list-bus-types.component.css'
})
export class ListBusTypesComponent {
  @Input() busTypes: IBusType[] = [];
  @Input() loading: boolean = false;
  
  @Output() editBusType = new EventEmitter<number>();
  @Output() deleteBusType = new EventEmitter<IBusType>();

  showDeleteModal: boolean = false;
  busTypeToDelete: IBusType | null = null;

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
