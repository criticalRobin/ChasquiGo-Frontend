import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouteSheetService } from './services/route-sheet.service';
import { AlertService } from '@shared/services/alert.service';
import { AlertType } from '@utils/enums/alert-type.enum';
import { LoginService } from '@core/login/services/login.service';
import { ICooperative } from '@features/coops/models/cooperative.interface';
import { IRouteSheet } from './models/route-sheet.interface';

@Component({
  selector: 'app-route-sheets',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './route-sheets.component.html',
  styleUrl: './route-sheets.component.css'
})
export class RouteSheetsComponent implements OnInit {
  private readonly routeSheetService: RouteSheetService = inject(RouteSheetService);
  private readonly alertService: AlertService = inject(AlertService);
  private readonly loginService: LoginService = inject(LoginService);
  
  protected routeSheets: IRouteSheet[] = [];
  protected isLoading: boolean = false;
  protected cooperative: ICooperative | null = null;

  ngOnInit(): void {
    // Cargar información de la cooperativa
    this.cooperative = this.loginService.getCooperativeFromLocalStorage();
    
    this.loadRouteSheets();
  }

  private loadRouteSheets(): void {
    this.isLoading = true;
    this.routeSheetService.getAllRouteSheets().subscribe({
      next: (routeSheets) => {
        this.routeSheets = routeSheets;
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
}
