import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RoutesService } from './services/frequencies.service';
import { AlertService } from '@shared/services/alert.service';
import { AlertType } from '@utils/enums/alert-type.enum';
import { LoginService } from '@core/login/services/login.service';
import { ICooperative } from '@features/coops/models/cooperative.interface';
import { IFrequency } from './models/frequency.interface';

@Component({
  selector: 'app-routes',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './frequencies.component.html',
  styleUrl: './frequencies.component.css',
})
export class RoutesComponent implements OnInit {
  private readonly routesService: RoutesService = inject(RoutesService);
  private readonly alertService: AlertService = inject(AlertService);
  private readonly loginService: LoginService = inject(LoginService);
  
  protected frequencies: IFrequency[] = [];
  protected cooperative: ICooperative | null = null;

  ngOnInit(): void {
    // Cargar información de la cooperativa
    this.cooperative = this.loginService.getCooperativeFromLocalStorage();
    
    this.loadFrequencies();
  }

  loadFrequencies(): void {
    this.routesService.getAllFrequencies().subscribe({
      next: (frequencies) => {
        this.frequencies = frequencies;
      },
      error: (error) => {
        this.alertService.showAlert({
          alertType: AlertType.ERROR,
          mainMessage: 'Error al cargar frecuencias',
          subMessage: error.message,
        });
      },
    });
  }

  deleteFrequency(id: number): void {
    if (confirm('¿Estás seguro de eliminar esta frecuencia?')) {
      this.routesService.deleteFrequency(id).subscribe({
        next: () => {
          this.loadFrequencies();
          this.alertService.showAlert({
            alertType: AlertType.SUCCESS,
            mainMessage: 'Frecuencia eliminada',
            subMessage: 'La frecuencia ha sido eliminada exitosamente',
          });
        },
        error: (error) => {
          this.alertService.showAlert({
            alertType: AlertType.ERROR,
            mainMessage: 'Error al eliminar frecuencia',
            subMessage: error.message,
          });
        },
      });
    }
  }

  formatTimeDisplay(isoTimeString: string): string {
    if (!isoTimeString) return 'N/A';

    try {
      // Parse the ISO string to extract hours and minutes
      const date = new Date(isoTimeString);
      
      // Get hours in 12-hour format
      let hours = date.getUTCHours();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12; // the hour '0' should be '12'
      
      // Get minutes with leading zero
      const minutes = date.getUTCMinutes().toString().padStart(2, '0');
      
      // Return formatted time
      return `${hours}:${minutes} ${ampm}`;
    } catch (error) {
      console.error('Error formatting time:', error);
      return isoTimeString;
    }
  }
} 