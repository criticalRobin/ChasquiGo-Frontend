import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { LoginService } from '@core/login/services/login.service';
import { AlertService } from '@shared/services/alert.service';
import { AlertType } from '@utils/enums/alert-type.enum';
import { HttpErrorResponse } from '@angular/common/http';
import { DriverFormComponent } from './components/driver-form/driver-form.component';
import { DriverManagementService } from './services/driver-management.service';
import { IDriver } from '@features/drivers/models/driver.interface';

@Component({
  selector: 'app-create-update-driver',
  standalone: true,
  imports: [CommonModule, RouterLink, DriverFormComponent],
  templateUrl: './create-update-driver.component.html',
  styleUrl: './create-update-driver.component.css',
})
export class CreateUpdateDriverComponent implements OnInit, OnDestroy {
  protected isLoading: boolean = false;
  protected cooperativeId: number | null = null;
  protected driverId: number | null = null;
  protected driverData: IDriver | null = null;
  protected isEditMode: boolean = false;
  private subscriptions: Subscription = new Subscription();

  private readonly loginService: LoginService = inject(LoginService);
  private readonly alertService: AlertService = inject(AlertService);
  private readonly router: Router = inject(Router);
  private readonly route: ActivatedRoute = inject(ActivatedRoute);
  private readonly driverManagementService: DriverManagementService = inject(DriverManagementService);

  ngOnInit(): void {
    // Verificar si estamos en modo edición
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.driverId = +params['id'];
        this.isEditMode = true;
        this.loadDriverData();
      }
    });
    
    this.loadCooperativeId();
  }

  protected onDriverCreated(): void {
    this.router.navigate(['/drivers']);
  }

  private loadDriverData(): void {
    if (!this.driverId) return;
    
    this.isLoading = true;
    
    this.subscriptions.add(
      this.driverManagementService.getDriverById(this.driverId).subscribe({
        next: (driver: IDriver) => {
          this.driverData = driver;
          this.isLoading = false;
        },
        error: (error: HttpErrorResponse) => {
          console.error('Error loading driver data:', error);
          this.isLoading = false;
          this.alertService.showAlert({
            alertType: AlertType.ERROR,
            mainMessage: 'Error al cargar los datos del conductor'
          });
          this.router.navigate(['/drivers']);
        }
      })
    );
  }

  private loadCooperativeId(): void {
    this.isLoading = true;
    
    // Primero intentar obtener la cooperativa del localStorage
    const cooperative = this.loginService.getCooperativeFromLocalStorage();
    if (cooperative?.id) {
      this.cooperativeId = cooperative.id;
      this.isLoading = false;
      return;
    }

    // Si no está en localStorage, obtener el usuario y buscar su cooperativa
    this.subscriptions.add(
      this.loginService.loggedInUser$.subscribe({
        next: (user) => {
          if (user?.id) {
            // Hacer la petición para obtener la cooperativa del usuario
            this.subscriptions.add(
              this.loginService.fetchUserCooperative(user.id).subscribe({
                next: (cooperative) => {
                  console.log('Cooperative loaded:', cooperative);
                  this.cooperativeId = cooperative.id;
                  this.isLoading = false;
                },
                error: (error: HttpErrorResponse) => {
                  console.error('Error loading cooperative:', error);
                  this.isLoading = false;
                  this.alertService.showAlert({
                    alertType: AlertType.ERROR,
                    mainMessage: 'Error al cargar datos de la cooperativa'
                  });
                }
              })
            );
          } else {
            console.warn('No logged in user ID found.');
            this.isLoading = false;
            this.alertService.showAlert({
              alertType: AlertType.ERROR,
              mainMessage: 'No se pudo obtener la información del usuario logueado'
            });
          }
        },
        error: (error: HttpErrorResponse) => {
          console.error('Error fetching logged in user:', error);
          this.isLoading = false;
          this.alertService.showAlert({
            alertType: AlertType.ERROR,
            mainMessage: 'Error al obtener información del usuario'
          });
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
