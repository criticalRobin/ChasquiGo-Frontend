import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RoutesService } from './services/frequencies.service';
import { AlertService } from '@shared/services/alert.service';
import { AlertType } from '@utils/enums/alert-type.enum';
import { LoginService } from '@core/login/services/login.service';
import { ICooperative } from '@features/coops/models/cooperative.interface';
import { IFrequency } from './models/frequency.interface';
import { PaginationComponent } from '@shared/components/pagination/pagination.component';
import { SearchComponent } from '@shared/components/search/search.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-routes',
  standalone: true,
  imports: [RouterLink, CommonModule, PaginationComponent, SearchComponent],
  templateUrl: './frequencies.component.html',
  styleUrl: './frequencies.component.css',
})
export class RoutesComponent implements OnInit, OnDestroy {
  private readonly routesService: RoutesService = inject(RoutesService);
  private readonly alertService: AlertService = inject(AlertService);
  private readonly loginService: LoginService = inject(LoginService);
  private readonly router: Router = inject(Router);
  
  protected frequencies: IFrequency[] = [];
  protected filteredFrequencies: IFrequency[] = [];
  protected paginatedFrequencies: IFrequency[] = [];
  protected cooperative: ICooperative | null = null;
  
  // Paginación
  protected currentPage: number = 1;
  protected itemsPerPage: number = 10;
  protected totalPages: number = 1;
  
  private subscriptions: Subscription = new Subscription();

  ngOnInit(): void {
    // Cargar información de la cooperativa
    this.cooperative = this.loginService.getCooperativeFromLocalStorage();
    
    this.loadFrequencies();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  loadFrequencies(): void {
    this.routesService.getAllFrequencies().subscribe({
      next: (frequencies) => {
        this.frequencies = frequencies;
        this.filteredFrequencies = frequencies;
        this.updatePagination();
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

  deleteFrequency(frequency: IFrequency): void {
    this.routesService.deleteFrequency(frequency.id).subscribe({
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

  // Métodos para búsqueda
  protected onSearch(searchTerm: string): void {
    if (!searchTerm.trim()) {
      this.filteredFrequencies = this.frequencies;
    } else {
      this.filteredFrequencies = this.frequencies.filter(frequency => {
        const originCity = frequency.originCity?.name?.toLowerCase() || '';
        const destinationCity = frequency.destinationCity?.name?.toLowerCase() || '';
        const status = frequency.status?.toLowerCase() || '';
        const searchLower = searchTerm.toLowerCase();
        
        return originCity.includes(searchLower) ||
               destinationCity.includes(searchLower) ||
               status.includes(searchLower) ||
               this.formatTimeDisplay(frequency.departureTime).toLowerCase().includes(searchLower);
      });
    }
    this.currentPage = 1;
    this.updatePagination();
  }

  // Métodos para paginación
  protected onPageChange(page: number): void {
    this.currentPage = page;
    this.updatePagination();
  }

  private updatePagination(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedFrequencies = this.filteredFrequencies.slice(startIndex, endIndex);
    this.totalPages = Math.ceil(this.filteredFrequencies.length / this.itemsPerPage);
  }

  // Métodos para acciones de la tabla
  protected viewFrequency(frequencyId: number): void {
    this.router.navigate(['/frecuencias', frequencyId]);
  }

  protected editFrequency(frequencyId: number): void {
    this.router.navigate(['/frecuencias/editar', frequencyId]);
  }

  protected getStatusClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'activo':
        return 'bg-success-lt';
      case 'inactivo':
        return 'bg-danger-lt';
      case 'pendiente':
        return 'bg-warning-lt';
      default:
        return 'bg-secondary-lt';
    }
  }
} 