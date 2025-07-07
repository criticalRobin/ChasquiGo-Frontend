import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { DriversService } from './services/drivers.service';
import { LoginService } from '@core/login/services/login.service';
import { AlertService } from '@shared/services/alert.service';
import { IDriver } from './models/driver.interface';
import { IBaseUser } from '@shared/models/base-user.interface';
import { ICooperative } from '@features/coops/models/cooperative.interface';
import { AlertType } from '@utils/enums/alert-type.enum';
import { Subscription } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { PaginationComponent } from '@shared/components/pagination/pagination.component';
import { SearchComponent } from '@shared/components/search/search.component';

@Component({
  selector: 'app-drivers',
  standalone: true,
  imports: [CommonModule, RouterLink, PaginationComponent, SearchComponent],
  templateUrl: './drivers.component.html',
  styleUrl: './drivers.component.css',
})
export class DriversComponent implements OnInit, OnDestroy {
  protected drivers: IDriver[] = [];
  protected filteredDrivers: IDriver[] = [];
  protected paginatedDrivers: IDriver[] = [];
  protected currentCooperativeId: number | null = null;
  
  // Paginación
  protected currentPage: number = 1;
  protected itemsPerPage: number = 10;
  protected totalPages: number = 1;
  
  private subscriptions: Subscription = new Subscription();

  constructor(
    private driversService: DriversService,
    private loginService: LoginService,
    private alertService: AlertService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCooperativeAndDrivers();
  }

  private loadCooperativeAndDrivers(): void {
    // Primero intentar obtener la cooperativa del localStorage
    const cooperative = this.loginService.getCooperativeFromLocalStorage();
    if (cooperative?.id) {
      this.currentCooperativeId = cooperative.id;
      console.log('Cooperative loaded from localStorage:', cooperative);
      this.loadDrivers();
      return;
    }

    // Si no está en localStorage, obtener el usuario y buscar su cooperativa
    this.subscriptions.add(
      this.loginService.loggedInUser$.subscribe({
        next: (user: IBaseUser | null) => {
          if (user?.id) {
            // Hacer la petición para obtener la cooperativa del usuario
            this.subscriptions.add(
              this.loginService.fetchUserCooperative(user.id).subscribe({
                next: (coop: ICooperative) => {
                  console.log('Cooperative loaded from API:', coop);
                  this.currentCooperativeId = coop.id;
                  this.loadDrivers();
                },
                error: (error: HttpErrorResponse) => {
                  console.error('Error loading cooperative:', error);
                  this.alertService.showAlert({
                    alertType: AlertType.ERROR,
                    mainMessage: 'Error al cargar información de la cooperativa'
                  });
                },
              })
            );
          } else {
            console.warn('No logged in user ID found.');
            this.alertService.showAlert({
              alertType: AlertType.ERROR,
              mainMessage: 'No se encontró información del usuario logueado'
            });
          }
        },
        error: (error: HttpErrorResponse) => {
          console.error('Error fetching logged in user:', error);
          this.alertService.showAlert({
            alertType: AlertType.ERROR,
            mainMessage: 'Error al obtener información del usuario'
          });
        },
      })
    );
  }

  private loadDrivers(): void {
    if (!this.currentCooperativeId) {
      console.error('No cooperative ID available');
      this.alertService.showAlert({
        alertType: AlertType.ERROR,
        mainMessage: 'No se pudo obtener el ID de la cooperativa'
      });
      return;
    }

    console.log('Loading drivers for cooperative:', this.currentCooperativeId);
    this.subscriptions.add(
      this.driversService.getDriversByCooperative(this.currentCooperativeId).subscribe({
        next: (drivers: IDriver[]) => {
          console.log('Drivers loaded:', drivers);
          this.drivers = drivers;
          this.filteredDrivers = drivers;
          this.updatePagination();
        },
        error: (error: HttpErrorResponse) => {
          console.error('Error loading drivers:', error);
          this.alertService.showAlert({
            alertType: AlertType.ERROR,
            mainMessage: 'Error al cargar la lista de conductores'
          });
        },
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  // Métodos para búsqueda
  protected onSearch(searchTerm: string): void {
    if (!searchTerm.trim()) {
      this.filteredDrivers = this.drivers;
    } else {
      this.filteredDrivers = this.drivers.filter(driver =>
        driver.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        driver.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        driver.idNumber.includes(searchTerm) ||
        driver.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        driver.phone.includes(searchTerm)
      );
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
    this.paginatedDrivers = this.filteredDrivers.slice(startIndex, endIndex);
    this.totalPages = Math.ceil(this.filteredDrivers.length / this.itemsPerPage);
  }

  // Métodos para acciones de la tabla
  protected editDriver(driverId: number): void {
    this.router.navigate(['/create-update-driver', driverId]);
  }

  protected deleteDriver(driver: IDriver): void {
    this.driversService.deleteDriver(driver.id).subscribe({
      next: () => {
        this.alertService.showAlert({
          alertType: AlertType.SUCCESS,
          mainMessage: 'Conductor eliminado exitosamente'
        });
        
        // Recargar los datos sin recargar toda la página
        this.loadDrivers();
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error deleting driver:', error);
        this.alertService.showAlert({
          alertType: AlertType.ERROR,
          mainMessage: 'Error al eliminar el conductor'
        });
      }
    });
  }
}
