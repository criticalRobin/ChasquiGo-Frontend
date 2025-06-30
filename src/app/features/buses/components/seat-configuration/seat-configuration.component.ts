import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IBusSeat, IBusType } from '../../models/buses.interface';

@Component({
  selector: 'app-seat-configuration',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './seat-configuration.component.html',
  styleUrl: './seat-configuration.component.css'
})
export class SeatConfigurationComponent implements OnInit {
  @Input() busType: IBusType | null = null;
  @Input() initialSeats: IBusSeat[] = [];
  @Output() seatsConfigured = new EventEmitter<IBusSeat[]>();
  @Output() backClicked = new EventEmitter<void>();

  seats: IBusSeat[] = [];
  floor1Seats: IBusSeat[] = [];
  floor2Seats: IBusSeat[] = [];
  selectedFloor: number = 1;

  ngOnInit(): void {
    if (this.busType) {
      this.generateSeats();
    }
  }

  generateSeats(): void {
    if (!this.busType) return;

    this.seats = [];
    let seatNumber = 1;

    // Generar asientos del piso 1
    for (let i = 0; i < this.busType.seatsFloor1; i++) {
      const seat: IBusSeat = {
        number: seatNumber,
        floor: 1,
        type: 'NORMAL',
        location: this.getSeatLocation(i, this.busType.seatsFloor1)
      };
      this.seats.push(seat);
      seatNumber++;
    }

    // Generar asientos del piso 2 (si existe)
    if (this.busType.floorCount === 2) {
      for (let i = 0; i < this.busType.seatsFloor2; i++) {
        const seat: IBusSeat = {
          number: seatNumber,
          floor: 2,
          type: 'NORMAL',
          location: this.getSeatLocation(i, this.busType.seatsFloor2)
        };
        this.seats.push(seat);
        seatNumber++;
      }
    }

    // Si hay asientos iniciales, aplicar su configuración
    if (this.initialSeats.length > 0) {
      this.applyInitialSeats();
    }

    this.organizeSeats();
  }

  getSeatLocation(index: number, totalSeats: number): 'WINDOW_LEFT' | 'WINDOW_RIGHT' | 'AISLE_LEFT' | 'AISLE_RIGHT' | 'MIDDLE' {
    // Solo aplicar MIDDLE para buses de 1 piso con número impar de asientos
    const isOneFloorOddSeats = this.busType?.floorCount === 1 && totalSeats % 2 !== 0;
    
    // Si es el último asiento y es bus de 1 piso con asientos impares
    if (isOneFloorOddSeats && index === totalSeats - 1) {
      return 'MIDDLE';
    }
    
    // Distribución normal: WINDOW_LEFT, AISLE_LEFT, AISLE_RIGHT, WINDOW_RIGHT
    const position = index % 4;
    switch (position) {
      case 0: return 'WINDOW_LEFT';
      case 1: return 'AISLE_LEFT';
      case 2: return 'AISLE_RIGHT';
      case 3: return 'WINDOW_RIGHT';
      default: return 'WINDOW_LEFT';
    }
  }

  applyInitialSeats(): void {
    this.initialSeats.forEach(initialSeat => {
      const seat = this.seats.find(s => s.number === initialSeat.number && s.floor === initialSeat.floor);
      if (seat) {
        seat.type = initialSeat.type;
        seat.location = initialSeat.location;
      }
    });
  }

  organizeSeats(): void {
    this.floor1Seats = this.seats.filter(seat => seat.floor === 1);
    this.floor2Seats = this.seats.filter(seat => seat.floor === 2);
  }

  toggleSeatType(seat: IBusSeat): void {
    seat.type = seat.type === 'NORMAL' ? 'VIP' : 'NORMAL';
  }

  getSeatClass(seat: IBusSeat): string {
    const baseClass = 'seat';
    const typeClass = seat.type === 'VIP' ? 'seat-vip' : 'seat-normal';
    
    // Mapear las nuevas ubicaciones a clases CSS
    let locationClass = '';
    switch (seat.location) {
      case 'WINDOW_LEFT':
      case 'WINDOW_RIGHT':
        locationClass = 'seat-window';
        break;
      case 'AISLE_LEFT':
      case 'AISLE_RIGHT':
        locationClass = 'seat-aisle';
        break;
      case 'MIDDLE':
        locationClass = 'seat-middle';
        break;
      default:
        locationClass = 'seat-aisle';
    }
    
    return `${baseClass} ${typeClass} ${locationClass}`;
  }

  getSeatsInRows(floorSeats: IBusSeat[]): IBusSeat[][] {
    const rows: IBusSeat[][] = [];
    const seatsPerRow = 4; // 2 asientos por lado del pasillo
    
    // Verificar si hay un asiento central (MIDDLE) - solo en buses de 1 piso con asientos impares
    const middleSeat = floorSeats.find(seat => seat.location === 'MIDDLE');
    const hasMiddleSeat = middleSeat && this.busType?.floorCount === 1 && floorSeats.length % 2 !== 0;
    
    if (hasMiddleSeat) {
      // Separar el asiento central del resto
      const regularSeats = floorSeats.filter(seat => seat.location !== 'MIDDLE');
      
      // Organizar los asientos regulares en filas de 4
      for (let i = 0; i < regularSeats.length; i += seatsPerRow) {
        const row = regularSeats.slice(i, i + seatsPerRow);
        rows.push(row);
      }
      
      // Insertar el asiento central en la última fila (en el medio, donde estaría el pasillo)
      if (middleSeat && rows.length > 0) {
        const lastRow = rows[rows.length - 1];
        // La última fila debe tener exactamente 4 asientos regulares para insertar el central
        if (lastRow.length === 4) {
          // Reorganizar la última fila: [seat1, seat2, MIDDLE, seat3, seat4]
          const newLastRow = [
            lastRow[0], // WINDOW_LEFT
            lastRow[1], // AISLE_LEFT
            middleSeat, // MIDDLE (en el centro donde estaría el pasillo)
            lastRow[2], // AISLE_RIGHT
            lastRow[3]  // WINDOW_RIGHT
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

  onContinue(): void {
    this.seatsConfigured.emit(this.seats);
  }

  onBack(): void {
    this.backClicked.emit();
  }

  getVipSeatsCount(): number {
    return this.seats.filter(seat => seat.type === 'VIP').length;
  }

  getTotalSeatsCount(): number {
    return this.seats.length;
  }

  selectFloor(floor: number): void {
    this.selectedFloor = floor;
  }

  getCurrentFloorSeats(): IBusSeat[] {
    return this.selectedFloor === 1 ? this.floor1Seats : this.floor2Seats;
  }

  isFloorEnabled(floor: number): boolean {
    if (floor === 1) return true; // Piso 1 siempre habilitado
    return this.busType?.floorCount === 2 && this.floor2Seats.length > 0;
  }
}
