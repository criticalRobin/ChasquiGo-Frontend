import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RoutesService } from './services/routes.service';
import { AlertService } from '@shared/services/alert.service';
import { AlertType } from '@utils/enums/alert-type.enum';
import { LoginService } from '@core/login/services/login.service';
import { ICooperative } from '@features/coops/models/cooperative.interface';
import { IFrequency } from './models/frequency.interface';

@Component({
  selector: 'app-routes',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './routes.component.html',
  styleUrl: './routes.component.css',
})
export class RoutesComponent implements OnInit {
  private readonly routesService: RoutesService = inject(RoutesService);
  private readonly alertService: AlertService = inject(AlertService);
  private readonly loginService: LoginService = inject(LoginService);
  
  protected frequencies: IFrequency[] = [];
  protected isLoading: boolean = false;
  protected cooperative: ICooperative | null = null;

  ngOnInit(): void {
    // Cargar información de la cooperativa
    this.cooperative = this.loginService.getCooperativeFromLocalStorage();
    
    this.loadFrequencies();
  }

  loadFrequencies(): void {
    this.isLoading = true;
    this.routesService.getAllFrequencies().subscribe({
      next: (frequencies) => {
        this.frequencies = frequencies;
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
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
      this.isLoading = true;
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
          this.isLoading = false;
          this.alertService.showAlert({
            alertType: AlertType.ERROR,
            mainMessage: 'Error al eliminar frecuencia',
            subMessage: error.message,
          });
        },
      });
    }
  }
} 