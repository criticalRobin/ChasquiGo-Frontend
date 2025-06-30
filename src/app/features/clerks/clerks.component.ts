import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { ClerkManagementService } from './services/clerk-management.service';
import { LoginService } from '@core/login/services/login.service';
import { AlertService } from '@shared/services/alert.service';
import { IClerk, IClerkResponse } from './models/clerk-response.interface';
import { IBaseUser } from '@shared/models/base-user.interface';
import { ICooperative } from '@features/coops/models/cooperative.interface';
import { AlertType } from '@utils/enums/alert-type.enum';
import { Subscription } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { PaginationComponent } from '@shared/components/pagination/pagination.component';
import { SearchComponent } from '@shared/components/search/search.component';

@Component({
  selector: 'app-clerks',
  standalone: true,
  imports: [CommonModule, RouterLink, PaginationComponent, SearchComponent],
  templateUrl: './clerks.component.html',
  styleUrl: './clerks.component.css',
})
export class ClerksComponent implements OnInit, OnDestroy {
  protected clerks: IClerk[] = [];
  protected filteredClerks: IClerk[] = [];
  protected paginatedClerks: IClerk[] = [];
  protected currentCooperativeId: number | null = null;
  
  // Paginación
  protected currentPage: number = 1;
  protected itemsPerPage: number = 10;
  protected totalPages: number = 1;
  
  private subscriptions: Subscription = new Subscription();

  constructor(
    private clerkManagementService: ClerkManagementService,
    private loginService: LoginService,
    private alertService: AlertService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCooperativeAndClerks();
  }

  private loadCooperativeAndClerks(): void {
    // Primero intentar obtener la cooperativa del localStorage
    const cooperative = this.loginService.getCooperativeFromLocalStorage();
    if (cooperative?.id) {
      this.currentCooperativeId = cooperative.id;
      console.log('Cooperative loaded from localStorage:', cooperative);
      this.loadClerks();
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
                  this.loadClerks();
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

  private loadClerks(): void {
    if (!this.currentCooperativeId) {
      console.error('No cooperative ID available');
      this.alertService.showAlert({
        alertType: AlertType.ERROR,
        mainMessage: 'No se pudo obtener el ID de la cooperativa'
      });
      return;
    }

    console.log('Loading clerks for cooperative:', this.currentCooperativeId);
    this.subscriptions.add(
      this.clerkManagementService.getClerks(this.currentCooperativeId).subscribe({
        next: (response: IClerkResponse) => {
          console.log('Clerks loaded:', response);
          this.clerks = response.workers;
          this.filteredClerks = response.workers;
          this.updatePagination();
        },
        error: (error: HttpErrorResponse) => {
          console.error('Error loading clerks:', error);
          this.alertService.showAlert({
            alertType: AlertType.ERROR,
            mainMessage: 'Error al cargar la lista de oficinistas'
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
      this.filteredClerks = this.clerks;
    } else {
      this.filteredClerks = this.clerks.filter(clerk =>
        clerk.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        clerk.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        clerk.idNumber.includes(searchTerm) ||
        clerk.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        clerk.phone.includes(searchTerm)
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
    this.paginatedClerks = this.filteredClerks.slice(startIndex, endIndex);
    this.totalPages = Math.ceil(this.filteredClerks.length / this.itemsPerPage);
  }

  // Métodos para acciones de la tabla
  protected editClerk(clerkId: number): void {
    this.router.navigate(['/create-update-clerk', clerkId]);
  }

  protected deleteClerk(clerk: IClerk): void {
    this.clerkManagementService.deleteClerk(clerk.id).subscribe({
      next: () => {
        this.alertService.showAlert({
          alertType: AlertType.SUCCESS,
          mainMessage: 'Oficinista eliminado exitosamente'
        });
        
        // Recargar los datos sin recargar toda la página
        this.loadClerks();
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error deleting clerk:', error);
        this.alertService.showAlert({
          alertType: AlertType.ERROR,
          mainMessage: 'Error al eliminar el oficinista'
        });
      }
    });
  }
}
