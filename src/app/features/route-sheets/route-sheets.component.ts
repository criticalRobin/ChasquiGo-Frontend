import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouteSheetService } from './services/route-sheet.service';
import { AlertService } from '@shared/services/alert.service';
import { AlertType } from '@utils/enums/alert-type.enum';
import { LoginService } from '@core/login/services/login.service';
import { ICooperative } from '@features/coops/models/cooperative.interface';
import { IRouteSheet, IRouteSheetDetail } from './models/route-sheet.interface';
import { BusesService } from '@features/buses/services/buses.service';
import { RoutesService } from '@features/frequencies/services/frequencies.service';
import { IBuses } from '@features/buses/models/buses.interface';
import { IFrequency } from '@features/frequencies/models/frequency.interface';
import { IntermediateStopService } from './services/intermediate-stop.service';
import { IIntermediateStop } from './models/intermediate-stop.interface';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Component({
  selector: 'app-route-sheets',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './route-sheets.component.html',
  styleUrl: './route-sheets.component.css'
})
export class RouteSheetsComponent implements OnInit {
  private readonly routeSheetService: RouteSheetService = inject(RouteSheetService);
  private readonly busesService: BusesService = inject(BusesService);
  private readonly routesService: RoutesService = inject(RoutesService);
  private readonly alertService: AlertService = inject(AlertService);
  private readonly loginService: LoginService = inject(LoginService);
  private readonly intermediateStopService: IntermediateStopService = inject(IntermediateStopService);
  
  protected routeSheets: IRouteSheet[] = [];
  protected isLoading: boolean = false;
  protected cooperative: ICooperative | null = null;
  protected showDetailsModal: boolean = false;
  protected selectedRouteSheet: IRouteSheet | null = null;
  protected buses: Map<number, IBuses> = new Map();
  protected frequencies: Map<number, IFrequency> = new Map();
  protected intermediateStops: IIntermediateStop[] = [];
  protected loadingIntermediateStops: boolean = false;

  // IDs de ejemplo de paradas intermedias para pruebas
  // En un entorno real, estos IDs vendrían de la API o de otro servicio
  private intermediateStopIds: number[] = [4]; // Ejemplo con el ID 4 que mencionaste

  ngOnInit(): void {
    // Cargar información de la cooperativa
    this.cooperative = this.loginService.getCooperativeFromLocalStorage();
    
    this.loadBuses();
    this.loadFrequencies();
    this.loadRouteSheets();
  }

  private loadRouteSheets(): void {
    this.isLoading = true;
    this.routeSheetService.getAllRouteSheets().subscribe({
      next: (routeSheets) => {
        // Corregir el formato del estado para cada hoja de ruta
        this.routeSheets = routeSheets.map(sheet => {
          return {
            ...sheet,
            status: this.parseStatus(sheet.status)
          };
        });
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading route sheets:', error);
        this.alertService.showAlert({
          alertType: AlertType.ERROR,
          mainMessage: 'Error al cargar las hojas de ruta',
          subMessage: error.message,
        });
        this.isLoading = false;
      }
    });
  }

  // Método para parsear el estado de "Activo, Pendiente, Completado, Cancelado" a un solo valor
  private parseStatus(status: string): 'Activo' | 'Pendiente' | 'Completado' | 'Cancelado' {
    if (status.includes('Activo')) return 'Activo';
    if (status.includes('Pendiente')) return 'Pendiente';
    if (status.includes('Completado')) return 'Completado';
    if (status.includes('Cancelado')) return 'Cancelado';
    return 'Activo'; // Valor por defecto
  }

  private loadBuses(): void {
    if (this.cooperative && this.cooperative.id) {
      this.busesService.getBusesByCooperativeId(this.cooperative.id).subscribe({
        next: (buses) => {
          buses.forEach(bus => {
            this.buses.set(bus.id!, bus);
          });
        },
        error: (error) => {
          console.error('Error loading buses:', error);
        }
      });
    }
  }

  private loadFrequencies(): void {
    this.routesService.getAllFrequencies().subscribe({
      next: (frequencies) => {
        frequencies.forEach(frequency => {
          this.frequencies.set(frequency.id, frequency);
        });
      },
      error: (error) => {
        console.error('Error loading frequencies:', error);
      }
    });
  }

  private loadIntermediateStops(): void {
    this.loadingIntermediateStops = true;
    this.intermediateStops = [];
    
    // Si no hay IDs de paradas intermedias, no hacemos peticiones
    if (this.intermediateStopIds.length === 0) {
      this.loadingIntermediateStops = false;
      return;
    }
    
    // Crear un array de observables para cada petición de parada intermedia
    const requests: Observable<IIntermediateStop | null>[] = this.intermediateStopIds.map(id => 
      this.intermediateStopService.getIntermediateStopById(id).pipe(
        catchError(error => {
          console.error(`Error loading intermediate stop ${id}:`, error);
          return of(null);
        })
      )
    );
    
    // Ejecutar todas las peticiones en paralelo
    forkJoin(requests).pipe(
      map(results => results.filter(result => result !== null) as IIntermediateStop[])
    ).subscribe({
      next: (stops) => {
        this.intermediateStops = stops;
        this.loadingIntermediateStops = false;
      },
      error: (error) => {
        console.error('Error loading intermediate stops:', error);
        this.loadingIntermediateStops = false;
      }
    });
  }

  protected deleteRouteSheet(id: number): void {
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
        error: (error) => {
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

  protected getStatusClass(status: string): string {
    switch (status) {
      case 'Activo':
        return 'bg-success';
      case 'Pendiente':
        return 'bg-warning';
      case 'Completado':
        return 'bg-info';
      case 'Cancelado':
        return 'bg-danger';
      default:
        return 'bg-secondary';
    }
  }

  protected viewRouteSheetDetails(id: number): void {
    this.isLoading = true;
    this.routeSheetService.getRouteSheetById(id).subscribe({
      next: (routeSheet) => {
        // Corregir el formato del estado
        this.selectedRouteSheet = {
          ...routeSheet,
          status: this.parseStatus(routeSheet.status),
          routeSheetDetails: routeSheet.routeSheetDetails?.map(detail => {
            return {
              ...detail,
              status: this.parseStatus(detail.status)
            };
          })
        };
        this.showDetailsModal = true;
        this.isLoading = false;
        
        // Cargar paradas intermedias
        // En un entorno real, aquí obtendríamos los IDs de paradas intermedias asociadas a esta hoja de ruta
        // Por ahora usamos los IDs de ejemplo
        this.loadIntermediateStops();
      },
      error: (error) => {
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
    this.intermediateStops = [];
  }

  protected getBusName(busId: number): string {
    const bus = this.buses.get(busId);
    return bus ? `${bus.licensePlate} - ${bus.chassisBrand}` : 'No disponible';
  }

  protected getFrequencyName(frequencyId: number): string {
    const frequency = this.frequencies.get(frequencyId);
    return frequency ? `${frequency.originCity.name} - ${frequency.destinationCity.name}` : 'No disponible';
  }

  protected formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  }
}
