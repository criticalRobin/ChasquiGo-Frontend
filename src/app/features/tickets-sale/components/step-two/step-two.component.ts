import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TicketsSaleService } from '../../services/tickets-sale.service';
import { IFrequencyDetail } from '../../models/frequencie-detail.interface';
import { 
  IBusSeatsResponse, 
  ISeatLayout, 
  IFloorLayout, 
  ISeatSelection 
} from '../../models/seats-layout.interface';
import { AlertService } from '@shared/services/alert.service';
import { AlertType } from '@utils/enums/alert-type.enum';

@Component({
  selector: 'app-step-two',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './step-two.component.html',
  styleUrl: './step-two.component.css'
})
export class StepTwoComponent implements OnInit {
  @Input() selectedFrequency!: IFrequencyDetail;
  @Output() seatsSelected = new EventEmitter<ISeatSelection[]>();
  @Output() nextStep = new EventEmitter<void>();
  @Output() previousStep = new EventEmitter<void>();

  busSeatsData: IBusSeatsResponse | null = null;
  selectedSeats: ISeatSelection[] = [];
  isLoading = false;
  maxSeats = 4; // Máximo de asientos que se pueden seleccionar
  selectedFloor = 1;

  constructor(
    private ticketsSaleService: TicketsSaleService,
    private alertService: AlertService
  ) { }

  ngOnInit(): void {
    if (this.selectedFrequency) {
      this.loadSeats();
    }
  }

  loadSeats(): void {
    this.isLoading = true;
    this.ticketsSaleService.getBusSeats(this.selectedFrequency.routeSheetDetailId)
      .subscribe({
        next: (response) => {
          this.busSeatsData = response;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading seats:', error);
          this.alertService.showAlert({
            alertType: AlertType.ERROR,
            mainMessage: 'Error al cargar los asientos'
          });
          this.isLoading = false;
        }
      });
  }

  onSeatClick(seat: ISeatLayout): void {
    if (seat.isOccupied) {
      return;
    }

    const existingIndex = this.selectedSeats.findIndex(s => s.seat.id === seat.id);
    
    if (existingIndex >= 0) {
      // Deseleccionar asiento
      this.selectedSeats.splice(existingIndex, 1);
      seat.isSelected = false;
    } else {
      // Seleccionar asiento
      if (this.selectedSeats.length >= this.maxSeats) {
        this.alertService.showAlert({
          alertType: AlertType.WARNING,
          mainMessage: `Máximo ${this.maxSeats} asientos por compra`
        });
        return;
      }

      const price = this.calculateSeatPrice(seat, 'ADULT');
      const seatSelection: ISeatSelection = {
        seat: seat,
        passengerType: 'ADULT',
        price: price
      };

      this.selectedSeats.push(seatSelection);
      seat.isSelected = true;
    }

    this.seatsSelected.emit(this.selectedSeats);
  }

  calculateSeatPrice(seat: ISeatLayout, passengerType: 'ADULT' | 'CHILD' | 'SENIOR' | 'HANDICAPPED'): number {
    if (!this.busSeatsData) return 0;

    const basePrice = seat.type === 'VIP' 
      ? this.busSeatsData.pricing.vipSeat.basePrice
      : this.busSeatsData.pricing.normalSeat.basePrice;

    const discounts = seat.type === 'VIP'
      ? this.busSeatsData.pricing.vipSeat.discounts
      : this.busSeatsData.pricing.normalSeat.discounts;

    switch (passengerType) {
      case 'CHILD':
        return discounts.CHILD;
      case 'SENIOR':
        return discounts.SENIOR;
      case 'HANDICAPPED':
        return discounts.HANDICAPPED;
      default:
        return basePrice;
    }
  }

  onPassengerTypeChange(seatSelection: ISeatSelection, newType: string): void {
    seatSelection.passengerType = newType as 'ADULT' | 'CHILD' | 'SENIOR' | 'HANDICAPPED';
    seatSelection.price = this.calculateSeatPrice(seatSelection.seat, seatSelection.passengerType);
    this.seatsSelected.emit(this.selectedSeats);
  }

  getSeatClass(seat: ISeatLayout): string {
    let classes = ['seat'];
    
    if (seat.isOccupied) {
      classes.push('seat-occupied');
    } else {
      classes.push(seat.type === 'VIP' ? 'seat-vip' : 'seat-normal');
      if (seat.isSelected) {
        classes.push('seat-selected');
      }
    }

    // Agregar clases de ubicación
    switch (seat.location) {
      case 'WINDOW_LEFT':
      case 'WINDOW_RIGHT':
        classes.push('seat-window');
        break;
      case 'AISLE_LEFT':
      case 'AISLE_RIGHT':
        classes.push('seat-aisle');
        break;
      case 'MIDDLE':
        classes.push('seat-middle');
        break;
    }

    return classes.join(' ');
  }

  getSeatsInRows(floorSeats: ISeatLayout[]): ISeatLayout[][] {
    const rows: ISeatLayout[][] = [];
    const seatsPerRow = 4; // 2 asientos por lado del pasillo
    
    // Verificar si hay un asiento central (MIDDLE)
    const middleSeat = floorSeats.find(seat => seat.location === 'MIDDLE');
    const hasMiddleSeat = middleSeat && this.busSeatsData?.busInfo.busType.floorCount === 1;
    
    if (hasMiddleSeat) {
      // Separar el asiento central del resto
      const regularSeats = floorSeats.filter(seat => seat.location !== 'MIDDLE');
      
      // Organizar los asientos regulares en filas de 4
      for (let i = 0; i < regularSeats.length; i += seatsPerRow) {
        const row = regularSeats.slice(i, i + seatsPerRow);
        rows.push(row);
      }
      
      // Insertar el asiento central en la última fila
      if (middleSeat && rows.length > 0) {
        const lastRow = rows[rows.length - 1];
        if (lastRow.length === 4) {
          const newLastRow = [
            lastRow[0], lastRow[1], middleSeat, lastRow[2], lastRow[3]
          ];
          rows[rows.length - 1] = newLastRow;
        } else {
          // Si la última fila no tiene 4 asientos, agregar el asiento central al final
          lastRow.push(middleSeat);
        }
      } else if (middleSeat) {
        // Si no hay filas regulares, crear una fila solo para el asiento central
        rows.push([middleSeat]);
      }
    } else {
      // Sin asiento central, organizar normalmente en filas de 4
      for (let i = 0; i < floorSeats.length; i += seatsPerRow) {
        const row = floorSeats.slice(i, i + seatsPerRow);
        rows.push(row);
      }
    }
    
    return rows;
  }

  getTotalPrice(): number {
    return this.selectedSeats.reduce((total, selection) => total + selection.price, 0);
  }

  canProceed(): boolean {
    return this.selectedSeats.length > 0;
  }

  onNext(): void {
    if (this.canProceed()) {
      this.nextStep.emit();
    }
  }

  onPrevious(): void {
    this.previousStep.emit();
  }

  selectFloor(floor: number): void {
    this.selectedFloor = floor;
  }

  getCurrentFloorSeats(): ISeatLayout[] {
    if (!this.busSeatsData?.seatsLayout) return [];
    const floor = this.busSeatsData.seatsLayout.find(f => f.floor === this.selectedFloor);
    return floor ? floor.seats : [];
  }

  isFloorEnabled(floor: number): boolean {
    if (floor === 1) return true; // Piso 1 siempre habilitado
    return this.busSeatsData?.busInfo.busType.floorCount === 2 && 
           this.busSeatsData?.seatsLayout.some(f => f.floor === 2);
  }

  getFloorSeatCount(floor: number): number {
    if (!this.busSeatsData?.seatsLayout) return 0;
    const floorData = this.busSeatsData.seatsLayout.find(f => f.floor === floor);
    return floorData ? floorData.seats.length : 0;
  }
}
