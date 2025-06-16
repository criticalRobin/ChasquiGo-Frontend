import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { RoutesService } from '../../services/routes.service';
import { AlertService } from '@shared/services/alert.service';
import { AlertType } from '@utils/enums/alert-type.enum';
import { LoginService } from '@core/login/services/login.service';
import { ICooperative } from '@features/coops/models/cooperative.interface';
import { IFrequency } from '../../models/frequency.interface';
import { CitiesService } from '../../services/cities.service';
import { ICity } from '../../models/city.interface';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-route-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './route-detail.component.html',
  styleUrl: './route-detail.component.css',
})
export class RouteDetailComponent implements OnInit {
  private readonly routesService: RoutesService = inject(RoutesService);
  private readonly citiesService: CitiesService = inject(CitiesService);
  private readonly alertService: AlertService = inject(AlertService);
  private readonly router: Router = inject(Router);
  private readonly route: ActivatedRoute = inject(ActivatedRoute);
  private readonly loginService: LoginService = inject(LoginService);

  protected frequencyId: number | null = null;
  protected frequencyData: IFrequency | null = null;
  protected isLoading: boolean = false;
  protected cooperativeName: string = 'No disponible';

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    
    // Cargar información de la cooperativa
    const cooperative = this.loginService.getCooperativeFromLocalStorage();
    if (cooperative) {
      this.cooperativeName = cooperative.name;
    }
    
    if (id) {
      this.frequencyId = +id;
      this.loadFrequencyData(this.frequencyId);
    } else {
      this.router.navigate(['/rutas']);
    }
  }

  loadFrequencyData(id: number): void {
    this.isLoading = true;
    
    this.routesService.getFrequencyById(id).subscribe({
      next: (frequency: IFrequency) => {
        console.log('Frequency data loaded:', frequency);
        this.frequencyData = frequency;
        
        // Si la frecuencia no tiene los objetos de ciudad completos pero sí los IDs,
        // intentamos cargar la información de las ciudades
        if ((!frequency.originCity || !frequency.destinationCity) && 
            (frequency.originCityId && frequency.destinationCityId)) {
          this.loadCitiesData(frequency.originCityId, frequency.destinationCityId);
        } else {
          this.isLoading = false;
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error loading frequency:', error);
        this.alertService.showAlert({
          alertType: AlertType.ERROR,
          mainMessage: 'Error al cargar datos de la frecuencia',
          subMessage: error.message || 'Ocurrió un error al obtener los datos',
        });
      },
    });
  }

  loadCitiesData(originCityId: number, destinationCityId: number): void {
    forkJoin({
      originCity: this.citiesService.getCityById(originCityId),
      destinationCity: this.citiesService.getCityById(destinationCityId)
    }).subscribe({
      next: (cities) => {
        if (this.frequencyData) {
          this.frequencyData = {
            ...this.frequencyData,
            originCity: cities.originCity,
            destinationCity: cities.destinationCity
          };
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading cities:', error);
        // No mostramos alerta, simplemente terminamos la carga
        this.isLoading = false;
      }
    });
  }

  deleteFrequency(): void {
    if (confirm('¿Estás seguro de eliminar esta frecuencia?') && this.frequencyId) {
      this.isLoading = true;
      
      this.routesService.deleteFrequency(this.frequencyId).subscribe({
        next: () => {
          this.isLoading = false;
          this.alertService.showAlert({
            alertType: AlertType.SUCCESS,
            mainMessage: 'Frecuencia eliminada',
            subMessage: 'La frecuencia ha sido eliminada exitosamente',
          });
          this.router.navigate(['/rutas']);
        },
        error: (error) => {
          this.isLoading = false;
          this.alertService.showAlert({
            alertType: AlertType.ERROR,
            mainMessage: 'Error al eliminar frecuencia',
            subMessage: error.message || 'Ocurrió un error al eliminar la frecuencia',
          });
        },
      });
    }
  }
} 