import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { catchError, of } from 'rxjs';
import * as XLSX from 'xlsx';
import { ScheduleDialogComponent } from './components/schedule-dialog/schedule-dialog.component';
import { ScheduleResponse, ScheduleDay, ScheduleAssignment } from './models/route-sheet.interface';

// Services
import { RouteSheetService } from './services/route-sheet.service';
import { BusesService } from '../buses/services/buses.service';
import { RoutesService } from '../frequencies/services/frequencies.service';
import { AlertService } from '@shared/services/alert.service';
import { LoginService } from '@core/login/services/login.service';

// Interfaces
import { ICooperative } from '../coops/models/cooperative.interface';
import { IFrequency } from '../frequencies/models/frequency.interface';
import { IBuses } from '../buses/models/buses.interface';
import { IRouteSheetHeader, IRouteSheetDetail, RouteSheetStatus } from './models/route-sheet.interface';

// Enums
import { AlertType } from '@utils/enums/alert-type.enum';

// Interfaces locales para evitar dependencias externas
interface IIntermediateStop {
  id: number;
  name: string;
  // Agregar más propiedades según sea necesario
}

@Component({
  selector: 'app-route-sheets',
  standalone: true,
  imports: [CommonModule, RouterModule, ScheduleDialogComponent],
  templateUrl: './route-sheets.component.html',
  styleUrls: ['./route-sheets.component.css']
})

export class RouteSheetsComponent implements OnInit {
  @ViewChild('scheduleDialog') scheduleDialog!: ScheduleDialogComponent;
  
  showScheduleDialog = false;
  constructor(
    private routeSheetService: RouteSheetService,
    private busesService: BusesService,
    private routesService: RoutesService,
    private alertService: AlertService,
    private loginService: LoginService
  ) {}

  protected routeSheets: IRouteSheetHeader[] = [];
  protected isLoading = false;
  protected cooperative: ICooperative | null = null;
  protected showDetailsModal = false;
  protected selectedRouteSheet: IRouteSheetHeader | null = null;
  protected buses: Map<number, IBuses> = new Map();
  protected frequencies: Map<number, IFrequency> = new Map();
  protected loadingDetails = false;

  ngOnInit(): void {
    this.cooperative = this.loginService.getCooperativeFromLocalStorage();
    if (this.cooperative?.id) {
      this.loadBuses();
      this.loadFrequencies();
      this.loadRouteSheets();
    } else {
      this.alertService.showAlert({
        alertType: AlertType.ERROR,
        mainMessage: 'Error',
        subMessage: 'No se pudo cargar la información de la cooperativa',
      });
    }
  }

  private loadBuses(): void {
    this.busesService.getBusesByCooperativeId(this.cooperative!.id).subscribe({
      next: (buses: IBuses[]) => {
        this.buses.clear();
        buses.forEach(bus => {
          if (bus.id) {
            this.buses.set(bus.id, bus);
          }
        });
      },
      error: (error: any) => {
        console.error('Error loading buses:', error);
        this.alertService.showAlert({
          alertType: AlertType.ERROR,
          mainMessage: 'Error al cargar buses',
          subMessage: 'No se pudieron cargar los datos de los buses'
        });
      }
    });
  }

  private loadFrequencies(): void {
    this.routesService.getAllFrequencies().subscribe({
      next: (frequencies: IFrequency[]) => {
        this.frequencies.clear();
        frequencies.forEach(freq => {
          if (freq.id) {
            this.frequencies.set(freq.id, freq);
          }
        });
      },
      error: (error: any) => {
        console.error('Error loading frequencies:', error);
        this.alertService.showAlert({
          alertType: AlertType.ERROR,
          mainMessage: 'Error al cargar frecuencias',
          subMessage: 'No se pudieron cargar los datos de las frecuencias'
        });
      }
    });
  }

  private loadRouteSheets(): void {
    if (!this.cooperative?.id) return;
    
    this.isLoading = true;
    this.routeSheetService.getAllRouteSheets().pipe(
      catchError(error => {
        console.error('Error loading route sheets:', error);
        this.alertService.showAlert({
          alertType: AlertType.ERROR,
          mainMessage: 'Error al cargar las hojas de ruta',
          subMessage: error.message,
        });
        this.isLoading = false;
        return of([]);
      })
    ).subscribe(routeSheets => {
      this.routeSheets = routeSheets as IRouteSheetHeader[];
      this.isLoading = false;
    });
  }

  // Formatear el estado para mostrar
  protected formatStatus(status: RouteSheetStatus): string {
    const statusMap: Record<RouteSheetStatus, string> = {
      'ACTIVE': 'Activo',
      'INACTIVE': 'Inactivo'
    };
    return statusMap[status] || status;
  }

  protected loadRouteSheetDetails(routeSheet: IRouteSheetHeader): void {
    if (!routeSheet.id) return;
    
    this.loadingDetails = true;
    
    // Cargar los detalles completos de la hoja de ruta
    this.routeSheetService.getRouteSheetById(routeSheet.id).subscribe({
      next: (fullRouteSheet) => {
        this.selectedRouteSheet = fullRouteSheet;
        this.showDetailsModal = true;
        this.loadingDetails = false;
      },
      error: (error) => {
        console.error('Error loading route sheet details:', error);
        this.alertService.showAlert({
          alertType: AlertType.ERROR,
          mainMessage: 'Error al cargar los detalles',
          subMessage: 'No se pudieron cargar los detalles de la hoja de ruta'
        });
        this.loadingDetails = false;
      }
    });
    
    // Si ya tenemos los detalles cargados, no hacemos nada
    if (routeSheet.routeSheetDetails?.length) {
      this.loadingDetails = false;
      return;
    }
    
    this.routeSheetService.getRouteSheetById(routeSheet.id).subscribe({
      next: (updatedSheet: IRouteSheetHeader) => {
        this.selectedRouteSheet = updatedSheet;
        this.loadingDetails = false;
      },
      error: (error) => {
        console.error('Error loading route sheet details:', error);
        this.alertService.showAlert({
          alertType: AlertType.ERROR,
          mainMessage: 'Error al cargar los detalles',
          subMessage: error.message,
        });
        this.loadingDetails = false;
      }
    });
  }
  
  protected closeModal(): void {
    this.showDetailsModal = false;
    this.selectedRouteSheet = null;
  }

  private loadIntermediateStops(intermediateStopIds: number[] = []): void {
    if (!intermediateStopIds.length) {
      return;
    }
    
    // En una implementación real, aquí se cargarían las paradas intermedias
    console.log('Cargando paradas intermedias con IDs:', intermediateStopIds);
  }

  protected deleteRouteSheet(id: number): void {
    if (!id) {
      console.error('ID de hoja de ruta no válido');
      return;
    }
    
    if (confirm('¿Está seguro de que desea eliminar esta hoja de ruta?')) {
      this.routeSheetService.deleteRouteSheet(id).subscribe({
        next: () => {
          this.alertService.showAlert({
            alertType: AlertType.SUCCESS,
            mainMessage: 'Hoja de ruta eliminada exitosamente',
            subMessage: 'La hoja de ruta ha sido eliminada correctamente',
          });
          this.loadRouteSheets();
          this.closeDetailsModal();
        },
        error: (error: any) => {
          console.error('Error deleting route sheet:', error);
          this.alertService.showAlert({
            alertType: AlertType.ERROR,
            mainMessage: 'Error al eliminar la hoja de ruta',
            subMessage: error.message,
          });
        }
      });
    }
  }

  protected getStatusClass(status: RouteSheetStatus | string | undefined): string {
    if (!status) return 'bg-secondary';
    
    switch (status) {
      case 'ACTIVE':
        return 'bg-success';
      case 'INACTIVE':
        return 'bg-secondary';
      default:
        return 'bg-light text-dark';
    }
  }

  protected viewRouteSheetDetails(id: number): void {
    this.isLoading = true;
    this.routeSheetService.getRouteSheetById(id).subscribe({
      next: (routeSheet: IRouteSheetHeader) => {
        this.selectedRouteSheet = routeSheet;
        this.showDetailsModal = true;
        this.isLoading = false;
        
        // Cargar paradas intermedias si es necesario
        if (routeSheet.routeSheetDetails?.length) {
          const stopIds = routeSheet.routeSheetDetails
            .map(detail => detail.id)
            .filter((id): id is number => id !== undefined);
          this.loadIntermediateStops(stopIds);
        }
      },
      error: (error: any) => {
        console.error('Error loading route sheet details:', error);
        this.alertService.showAlert({
          alertType: AlertType.ERROR,
          mainMessage: 'Error al cargar los detalles de la hoja de ruta',
          subMessage: error.message,
        });
        this.isLoading = false;
      }
    });
  }

  protected closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.selectedRouteSheet = null;
  }

  protected viewDetail(detail: IRouteSheetDetail): void {
    // Aquí puedes implementar la lógica para ver los detalles de un detalle específico
    console.log('Ver detalle:', detail);
    // Por ejemplo, podrías navegar a una ruta de detalles o abrir otro modal
  }

  // Métodos para los botones de acción
  protected onCreateNew(): void {
    // Navegar a la página de creación de nueva hoja de ruta
    window.location.href = '/hojas-ruta/create';
  }

  protected onViewDetails(sheet: IRouteSheetHeader): void {
    this.viewRouteSheetDetails(sheet.id!);
  }

  protected onEdit(sheet: IRouteSheetHeader): void {
    // Navegar a la página de edición
    window.location.href = `/hojas-ruta/edit/${sheet.id}`;
  }

  protected onDelete(sheet: IRouteSheetHeader): void {
    if (sheet.id) {
      this.deleteRouteSheet(sheet.id);
    }
  }

  // Método auxiliar para formatear fechas
  protected formatDate(dateString: string): string {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString; // Si no es una fecha válida, devolver el string original
      
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      console.error('Error formateando fecha:', error);
      return dateString; // En caso de error, devolver el string original
    }
  }

  // Helper methods

  protected getBusPlate(busId: number): string {
    // Si el bus ya viene en los detalles, usamos esa información
    if (this.selectedRouteSheet?.routeSheetDetails) {
      const detail = this.selectedRouteSheet.routeSheetDetails.find(d => d.busId === busId);
      if (detail?.bus) {
        const bus = detail.bus as unknown as IBuses;
        return bus.licensePlate || 'N/A';
      }
    }
    // Si no, intentamos obtenerlo del mapa de buses
    const bus = this.buses.get(busId);
    return bus?.licensePlate || 'N/A';
  }

  onGenerateScheduleClick(sheet: any): void {
    this.selectedRouteSheet = sheet;
    this.showScheduleDialog = true;
  }

  onGenerateSchedule(request: { routeSheetHeaderId: number; startDate: string; endDate: string }): void {
    if (!this.selectedRouteSheet) return;
    
    this.scheduleDialog.loading = true;
    
    this.routeSheetService.getScheduleByRouteSheetId(request).subscribe({
      next: (response: ScheduleResponse) => {
        this.exportToExcel(response);
        this.showScheduleDialog = false;
        this.alertService.showAlert({
          mainMessage: 'Horario generado exitosamente',
          alertType: 'success' as any
        });
      },
      error: (error) => {
        console.error('Error al generar el horario:', error);
        this.alertService.showAlert({
          mainMessage: 'Error al generar el horario',
          alertType: 'error' as any
        });
      },
      complete: () => {
        this.scheduleDialog.loading = false;
      }
    });
  }

  private exportToExcel(data: ScheduleResponse): void {
    if (!data.schedule) {
      console.error('No hay datos de horario para exportar');
      return;
    }
    // Crear un nuevo libro de trabajo
    const wb = XLSX.utils.book_new();
    
    // Procesar los datos para el Excel
    const excelData = data.schedule.flatMap((day: ScheduleDay) => {
      return day.assignments.map((assignment: ScheduleAssignment) => ({
        'Fecha': new Date(day.date).toLocaleDateString(),
        'Día': day.dayOfWeek,
        'Frecuencia': assignment.frequencyName,
        'Bus': assignment.busName,
        'Hora de Salida': new Date(assignment.departureTime).toLocaleTimeString()
      }));
    });
    
    // Crear una hoja de cálculo con los datos
    const ws = XLSX.utils.json_to_sheet(excelData);
    
    // Ajustar el ancho de las columnas
    const wscols = [
      { wch: 15 }, // Fecha
      { wch: 15 }, // Día
      { wch: 30 }, // Frecuencia
      { wch: 20 }, // Bus
      { wch: 15 }  // Hora de Salida
    ];
    ws['!cols'] = wscols;
    
    // Agregar la hoja al libro
    XLSX.utils.book_append_sheet(wb, ws, 'Horario');
    
    // Generar el archivo Excel
    const fileName = `Horario_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  }

  protected getFrequencyName(frequencyId: number): string {
    try {
      // Si la frecuencia ya viene en los detalles, usamos esa información
      if (this.selectedRouteSheet?.routeSheetDetails) {
        const detail = this.selectedRouteSheet.routeSheetDetails.find(d => d.frequencyId === frequencyId);
        if (detail?.frequency) {
          const freq = detail.frequency as unknown as IFrequency;
          if (freq?.originCity?.name && freq?.destinationCity?.name) {
            return `${freq.originCity.name} - ${freq.destinationCity.name}`;
          }
        }
      }
      
      // Si no, intentamos obtenerla del mapa de frecuencias
      const frequency = this.frequencies.get(frequencyId) as unknown as IFrequency | undefined;
      if (frequency?.originCity?.name && frequency?.destinationCity?.name) {
        return `${frequency.originCity.name} - ${frequency.destinationCity.name}`;
      }
      
      return 'Frecuencia no disponible';
    } catch (error) {
      console.error('Error al obtener el nombre de la frecuencia:', error);
      return 'Error al cargar';
    }
    return 'No disponible';
  }
}
