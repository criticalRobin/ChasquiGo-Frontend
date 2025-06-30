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
  originalSeats: IBusSeat[] = []; // Nueva propiedad para guardar los asientos originales
  floor1Seats: IBusSeat[] = [];
  floor2Seats: IBusSeat[] = [];
  selectedFloor: number = 1;
  loading: boolean = true;
  saving: boolean = false;
  busId: number | null = null;

  // Propiedades para manejo de foto del bus
  selectedPhoto: File | null = null;
  photoPreview: string | null = null;
  photoUploading: boolean = false;
  photoError: string | null = null;
  newPhotoUrl: string | null = null; // URL de Cloudinary de la nueva foto

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
        this.originalSeats = JSON.parse(JSON.stringify(bus.seats)); // Copia profunda de los asientos originales
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
    // Filtrar y ordenar asientos por piso
    this.floor1Seats = this.seats
      .filter(seat => seat.floor === 1)
      .sort((a, b) => Number(a.number) - Number(b.number));
      
    this.floor2Seats = this.seats
      .filter(seat => seat.floor === 2)
      .sort((a, b) => Number(a.number) - Number(b.number));
    
    // Asegurar que el array principal también esté ordenado
    this.seats = [
      ...this.floor1Seats,
      ...this.floor2Seats
    ];
    
    console.log('Asientos organizados y ordenados por pisos:', {
      piso1: this.floor1Seats.length,
      piso2: this.floor2Seats.length,
      total: this.seats.length,
      piso1Order: this.floor1Seats.slice(0, 5).map(s => s.number),
      piso2Order: this.floor2Seats.slice(0, 5).map(s => s.number)
    });
    
    console.log('Estado inicial de asientos originales:', {
      totalOriginales: this.originalSeats.length,
      ejemploOriginal: this.originalSeats[0] ? `Asiento ${this.originalSeats[0].number}: ${this.originalSeats[0].type}` : 'N/A'
    });
  }

  // Método para sincronizar cambios entre floor1Seats/floor2Seats y this.seats
  private syncSeatsArrays(): void {
    // Ordenar arrays por piso antes de sincronizar
    this.floor1Seats.sort((a, b) => Number(a.number) - Number(b.number));
    this.floor2Seats.sort((a, b) => Number(a.number) - Number(b.number));
    
    // Reconstruir this.seats desde los arrays de pisos, manteniendo el orden correcto
    this.seats = [
      ...this.floor1Seats,
      ...this.floor2Seats
    ];
    
    console.log('Arrays de asientos sincronizados y ordenados:', {
      totalSeats: this.seats.length,
      floor1Count: this.floor1Seats.length,
      floor2Count: this.floor2Seats.length,
      floor1Order: this.floor1Seats.slice(0, 5).map(s => s.number), // Mostrar primeros 5
      floor2Order: this.floor2Seats.slice(0, 5).map(s => s.number)  // Mostrar primeros 5
    });
  }

  toggleSeatType(seat: IBusSeat): void {
    seat.type = seat.type === 'NORMAL' ? 'VIP' : 'NORMAL';
    
    // Actualizar en el array correspondiente según el piso
    if (seat.floor === 1) {
      const seatIndex = this.floor1Seats.findIndex(s => s.number === seat.number);
      if (seatIndex !== -1) {
        this.floor1Seats[seatIndex].type = seat.type;
      }
    } else if (seat.floor === 2) {
      const seatIndex = this.floor2Seats.findIndex(s => s.number === seat.number);
      if (seatIndex !== -1) {
        this.floor2Seats[seatIndex].type = seat.type;
      }
    }
    
    // Actualizar también en el array principal manteniendo el orden
    const mainSeatIndex = this.seats.findIndex(s => s.floor === seat.floor && s.number === seat.number);
    if (mainSeatIndex !== -1) {
      this.seats[mainSeatIndex].type = seat.type;
    }
    
    // Asegurar que los arrays estén ordenados después de la edición
    this.syncSeatsArrays();
    
    console.log(`Asiento editado - Piso ${seat.floor}, Número ${seat.number}: ${seat.type === 'VIP' ? 'NORMAL → VIP' : 'VIP → NORMAL'}`);
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

    // Sincronizar asientos antes de enviar
    this.syncSeatsArrays();

    // Verificar que tenemos todos los asientos esperados
    const originalSeatCount = this.bus.seats.length;
    if (this.seats.length !== originalSeatCount) {
      console.error('ERROR: No se capturaron todos los asientos');
      console.error(`Esperados: ${originalSeatCount}, Capturados: ${this.seats.length}`);
      this.alertService.showAlert({
        alertType: AlertType.ERROR,
        mainMessage: 'Error de sincronización',
        subMessage: `No se capturaron todos los asientos (${this.seats.length}/${originalSeatCount}). Recarga la página e intenta nuevamente.`
      });
      this.saving = false;
      return;
    }

    console.log('=== VERIFICACIÓN PRE-ENVÍO ===');
    console.log(`Total asientos capturados: ${this.seats.length}`);
    console.log(`Piso 1: ${this.seats.filter(s => s.floor === 1).length} asientos`);
    console.log(`Piso 2: ${this.seats.filter(s => s.floor === 2).length} asientos`);

    // OPTIMIZACIÓN: Para buses de 2 pisos, solo enviar asientos que cambiaron
    let seatsToSend: any[] = [];
    
    if (this.busType?.floorCount === 2) {
      // Bus de 2 pisos: Solo enviar asientos que cambiaron de tipo
      console.log('=== BUS DE 2 PISOS: DETECTANDO CAMBIOS ===');
      
      const changedSeats: IBusSeat[] = [];
      
      // Comparar cada asiento actual con el original
      this.seats.forEach(currentSeat => {
        const originalSeat = this.originalSeats.find(
          original => original.floor === currentSeat.floor && original.number === currentSeat.number
        );
        
        if (originalSeat && originalSeat.type !== currentSeat.type) {
          changedSeats.push(currentSeat);
          console.log(`Asiento cambiado - Piso ${currentSeat.floor}, Número ${currentSeat.number}: ${originalSeat.type} → ${currentSeat.type}`);
        }
      });
      
      if (changedSeats.length === 0) {
        console.log('No hay cambios en los asientos');
        this.alertService.showAlert({
          alertType: AlertType.WARNING,
          mainMessage: 'Sin cambios',
          subMessage: 'No se detectaron cambios en los tipos de asientos.'
        });
        this.saving = false;
        return;
      }
      
      // Ordenar los asientos cambiados (primero piso 1, luego piso 2)
      changedSeats.sort((a, b) => {
        const floorA = a.floor || 1;
        const floorB = b.floor || 1;
        if (floorA !== floorB) {
          return floorA - floorB;
        }
        return Number(a.number) - Number(b.number);
      });
      
      seatsToSend = changedSeats.map(seat => ({
        floor: Number(seat.floor),
        number: Number(seat.number),
        type: String(seat.type),
        location: String(seat.location)
      }));
      
      console.log(`Enviando solo ${seatsToSend.length} asientos que cambiaron de un total de ${this.seats.length}`);
      
    } else {
      // Bus de 1 piso: Enviar todos los asientos (comportamiento original)
      console.log('=== BUS DE 1 PISO: ENVIANDO TODOS LOS ASIENTOS ===');
      
      seatsToSend = this.seats.map(seat => ({
        floor: Number(seat.floor),
        number: Number(seat.number),
        type: String(seat.type),
        location: String(seat.location)
      }));
    }

    const updateData = {
      cooperativeId: cooperativeId,
      licensePlate: this.bus.licensePlate,
      chassisBrand: this.bus.chassisBrand,
      bodyworkBrand: this.bus.bodyworkBrand,
      photo: this.bus.photo || null, // Usar la foto actual del bus (puede haber sido actualizada automáticamente)
      busTypeId: this.bus.busTypeId,
      seats: seatsToSend
    };

    // Validar que todos los asientos tengan los campos requeridos y tipos correctos
    const invalidSeats = updateData.seats.filter((seat: any) => 
      typeof seat.floor !== 'number' || isNaN(seat.floor) ||
      typeof seat.number !== 'number' || isNaN(seat.number) ||
      typeof seat.type !== 'string' || !seat.type.trim() ||
      typeof seat.location !== 'string' || !seat.location.trim() ||
      seat.floor < 1 || seat.floor > 2 ||
      seat.number < 1 ||
      !['NORMAL', 'VIP'].includes(seat.type) ||
      !['WINDOW_LEFT', 'WINDOW_RIGHT', 'AISLE_LEFT', 'AISLE_RIGHT', 'MIDDLE'].includes(seat.location)
    );
    
    if (invalidSeats.length > 0) {
      console.error('Asientos con datos inválidos:', invalidSeats);
      this.alertService.showAlert({
        alertType: AlertType.ERROR,
        mainMessage: 'Error en datos de asientos',
        subMessage: 'Algunos asientos tienen datos incompletos o inválidos. Recarga la página e intenta nuevamente.'
      });
      this.saving = false;
      return;
    }

    console.log('=== DATOS A ENVIAR AL BACKEND ===');
    console.log('Estructura completa:', JSON.stringify(updateData, null, 2));
    
    // Verificar el orden específico (primero piso 1, luego piso 2)
    const piso1Seats = updateData.seats.filter((s: any) => s.floor === 1);
    const piso2Seats = updateData.seats.filter((s: any) => s.floor === 2);
    
    console.log('Orden asientos piso 1:', piso1Seats.map((s: any) => s.number));
    if (piso2Seats.length > 0) {
      console.log('Orden asientos piso 2:', piso2Seats.map((s: any) => s.number));
    }
    
    // GARANTÍA FINAL: Para buses de 2 pisos, verificar que tenemos cambios válidos
    if (this.busType?.floorCount === 2) {
      if (updateData.seats.length === 0) {
        console.error('ERROR: No hay asientos para actualizar');
        this.alertService.showAlert({
          alertType: AlertType.ERROR,
          mainMessage: 'Sin cambios detectados',
          subMessage: 'No se encontraron asientos con cambios para actualizar.'
        });
        this.saving = false;
        return;
      }
    } else {
      // Para buses de 1 piso, verificar que tenemos todos los asientos
      const hasPiso1 = updateData.seats.some((s: any) => s.floor === 1);
      
      if (!hasPiso1) {
        console.error('ERROR CRÍTICO: Faltan asientos del piso 1');
        this.alertService.showAlert({
          alertType: AlertType.ERROR,
          mainMessage: 'Error: Asientos incompletos',
          subMessage: 'No se encontraron asientos del piso 1. Recarga la página e intenta nuevamente.'
        });
        this.saving = false;
        return;
      }
    }
    
    const logMessage = this.busType?.floorCount === 2 
      ? `✅ VALIDACIÓN COMPLETA: Enviando ${updateData.seats.length} asientos MODIFICADOS al backend`
      : `✅ VALIDACIÓN COMPLETA: Enviando TODOS los ${updateData.seats.length} asientos al backend`;
    
    console.log(logMessage);
    console.log('=== FIN VERIFICACIÓN ===');

    // Hacer el cast explícito para el servicio
    this.busesService.updateBus(this.busId, updateData as any).subscribe({
      next: () => {
        console.log('Bus actualizado exitosamente');
        this.saving = false;
        
        // Mostrar alerta de éxito
        this.alertService.showAlert({
          alertType: AlertType.SUCCESS,
          mainMessage: 'Asientos Actualizados',
          subMessage: 'Los asientos del bus han sido actualizados exitosamente'
        });
        
        this.router.navigate(['/buses']);
      },
      error: (error) => {
        console.error('Error al actualizar el bus:', error);
        console.error('Detalles del error:', {
          status: error.status,
          statusText: error.statusText,
          url: error.url,
          message: error.error?.message || error.message,
          error: error.error
        });
        this.saving = false;
        
        // Mostrar alerta de error con más detalle si es posible
        const errorMessage = error.error?.message || 'Ocurrió un error al actualizar los asientos del bus. Inténtalo nuevamente.';
        this.alertService.showAlert({
          alertType: AlertType.ERROR,
          mainMessage: 'Error al actualizar asientos',
          subMessage: errorMessage
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

  // Métodos para manejo de foto del bus
  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    
    if (!file) return;
    
    // Resetear estados previos
    this.photoError = null;
    this.selectedPhoto = null;
    this.photoPreview = null;
    
    // Validar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      this.photoError = 'Solo se permiten archivos JPG, JPEG y PNG';
      return;
    }
    
    // Validar tamaño del archivo (máximo 1MB)
    const maxSize = 1024 * 1024; // 1MB en bytes
    if (file.size > maxSize) {
      this.photoError = 'El archivo no debe superar 1MB';
      return;
    }
    
    this.selectedPhoto = file;
    
    // Crear preview
    const reader = new FileReader();
    reader.onload = (e) => {
      this.photoPreview = e.target?.result as string;
    };
    reader.readAsDataURL(file);
    
    console.log('Foto seleccionada:', {
      name: file.name,
      size: file.size,
      type: file.type
    });
  }

  uploadPhoto(): void {
    if (!this.selectedPhoto || !this.bus || !this.busId) return;
    
    this.photoUploading = true;
    this.photoError = null;
    
    console.log('Subiendo foto a Cloudinary...');
    
    this.busesService.uploadImageToCloudinary(this.selectedPhoto).subscribe({
      next: (response) => {
        console.log('Foto subida exitosamente:', response);
        this.newPhotoUrl = response.url;
        
        // Actualizar automáticamente el bus con la nueva foto
        this.updateBusPhoto(response.url);
      },
      error: (error) => {
        console.error('Error al subir foto a Cloudinary:', error);
        this.photoUploading = false;
        this.photoError = error.error?.message || 'Error al subir la foto. Inténtalo nuevamente.';
        
        this.alertService.showAlert({
          alertType: AlertType.ERROR,
          mainMessage: 'Error al subir foto',
          subMessage: this.photoError || 'Error desconocido al subir la foto'
        });
      }
    });
  }

  private updateBusPhoto(photoUrl: string): void {
    if (!this.bus || !this.busId) return;

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

    // Crear datos de actualización solo con la foto
    const updateData = {
      cooperativeId: cooperativeId,
      licensePlate: this.bus.licensePlate,
      chassisBrand: this.bus.chassisBrand,
      bodyworkBrand: this.bus.bodyworkBrand,
      photo: photoUrl,
      busTypeId: this.bus.busTypeId,
      seats: this.originalSeats.map(seat => ({
        floor: Number(seat.floor),
        number: Number(seat.number),
        type: String(seat.type),
        location: String(seat.location)
      }))
    };

    console.log('Actualizando bus solo con nueva foto...');

    this.busesService.updateBus(this.busId, updateData as any).subscribe({
      next: () => {
        console.log('Foto del bus actualizada exitosamente');
        this.photoUploading = false;
        
        // Actualizar la foto en el objeto bus local
        if (this.bus) {
          this.bus.photo = photoUrl;
        }
        
        // Mostrar alerta de éxito
        this.alertService.showAlert({
          alertType: AlertType.SUCCESS,
          mainMessage: 'Foto actualizada',
          subMessage: 'La foto del bus ha sido actualizada exitosamente'
        });
        
        // Limpiar selección
        this.selectedPhoto = null;
        this.photoPreview = null;
      },
      error: (error) => {
        console.error('Error al actualizar la foto del bus:', error);
        this.photoUploading = false;
        
        // Mostrar alerta de error
        const errorMessage = error.error?.message || 'Error al actualizar la foto del bus. Inténtalo nuevamente.';
        this.alertService.showAlert({
          alertType: AlertType.ERROR,
          mainMessage: 'Error al actualizar foto',
          subMessage: errorMessage
        });
      }
    });
  }

  removePhoto(): void {
    this.selectedPhoto = null;
    this.photoPreview = null;
    this.photoError = null;
    
    // Limpiar el input file
    const fileInput = document.getElementById('photoInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  getCurrentPhotoUrl(): string {
    // Prioridad: foto actual del bus (puede haber sido actualizada) -> foto por defecto
    if (this.bus?.photo) {
      return this.bus.photo;
    }
    
    return 'assets/chasqui-go/logo.png'; // Foto por defecto
  }

  hasPhotoChanged(): boolean {
    // Ya no necesitamos verificar newPhotoUrl porque se actualiza directamente en el bus
    return false;
  }
}
