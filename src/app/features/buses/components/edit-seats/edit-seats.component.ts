import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { BusesService } from '../../services/buses.service';
import { IBuses, IBusSeat, IBusType } from '../../models/buses.interface';
import { AlertService } from '@shared/services/alert.service';
import { AlertType } from '@utils/enums/alert-type.enum';

@Component({
  selector: 'app-edit-seats',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './edit-seats.component.html',
  styleUrl: './edit-seats.component.css'
})
export class EditSeatsComponent implements OnInit {
  bus: IBuses | null = null;
  busType: IBusType | null = null;
  seats: IBusSeat[] = [];
  floor1Seats: IBusSeat[] = [];
  floor2Seats: IBusSeat[] = [];
  selectedFloor: number = 1;
  loading: boolean = true;
  saving: boolean = false;
  busId: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private busesService: BusesService,
    private alertService: AlertService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.busId = +params['id'];
      if (this.busId) {
        this.loadBusData();
      }
    });
  }

  loadBusData(): void {
    if (!this.busId) return;

    this.loading = true;
    this.busesService.getBusById(this.busId).subscribe({
      next: (bus: IBuses) => {
        this.bus = bus;
        this.seats = [...bus.seats]; // Copia de los asientos para edición
        this.loadBusType();
      },
      error: (error) => {
        console.error('Error al cargar los datos del bus:', error);
        this.loading = false;
      }
    });
  }

  loadBusType(): void {
    if (!this.bus?.busTypeId) return;

    this.busesService.getBusTypeById(this.bus.busTypeId).subscribe({
      next: (busType: IBusType) => {
        this.busType = busType;
        this.organizeSeats();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar el tipo de bus:', error);
        this.loading = false;
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
    
    // Mapear las ubicaciones a clases CSS
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

  onSave(): void {
    if (!this.bus || !this.busId) return;

    this.saving = true;

    // Obtener el ID de la cooperativa del localStorage
    const userCooperative = localStorage.getItem('userCooperative');
    let cooperativeId = 1; // Valor por defecto

    if (userCooperative) {
      try {
        const cooperativeData = JSON.parse(userCooperative);
        cooperativeId = cooperativeData.id || 1;
      } catch (error) {
        console.error('Error al parsear datos de cooperativa:', error);
      }
    }

    // Preparar datos para el PUT - solo las propiedades requeridas
    const updateData = {
      cooperativeId: cooperativeId,
      licensePlate: this.bus.licensePlate,
      chassisBrand: this.bus.chassisBrand,
      bodyworkBrand: this.bus.bodyworkBrand,
      photo: this.bus.photo,
      busTypeId: this.bus.busTypeId,
      seats: this.seats.map(seat => ({
        floor: seat.floor,
        number: seat.number,
        type: seat.type,
        location: seat.location
      }))
    };

    console.log('Datos a enviar:', updateData);

    this.busesService.updateBus(this.busId, updateData).subscribe({
      next: () => {
        console.log('Bus actualizado exitosamente');
        this.saving = false;
        
        // Mostrar alerta de éxito
        this.alertService.showAlert({
          alertType: AlertType.SUCCESS,
          mainMessage: 'ASIENTOS ACTUALIZADOS',
          subMessage: 'Los asientos del bus han sido actualizados exitosamente'
        });
        
        this.router.navigate(['/buses']);
      },
      error: (error) => {
        console.error('Error al actualizar el bus:', error);
        this.saving = false;
        
        // Mostrar alerta de error
        this.alertService.showAlert({
          alertType: AlertType.ERROR,
          mainMessage: 'Error al actualizar asientos',
          subMessage: 'Ocurrió un error al actualizar los asientos del bus. Inténtalo nuevamente.'
        });
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/buses']);
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
