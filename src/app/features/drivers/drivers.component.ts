import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DriversService } from './services/drivers.service';
import { LoginService } from '@core/login/services/login.service';
import { AlertService } from '@shared/services/alert.service';
import { IDriver } from './models/driver.interface';
import { IBaseUser } from '@shared/models/base-user.interface';
import { ICooperative } from '@features/coops/models/cooperative.interface';
import { AlertType } from '@utils/enums/alert-type.enum';
import { Subscription } from 'rxjs';
import { DriverCardComponent } from './components/driver-card/driver-card.component';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-drivers',
  standalone: true,
  imports: [CommonModule, RouterLink, DriverCardComponent],
  templateUrl: './drivers.component.html',
  styleUrl: './drivers.component.css',
})
export class DriversComponent implements OnInit, OnDestroy {
  protected drivers: IDriver[] = [];
  protected isLoading: boolean = false;
  protected currentCooperativeId: number | null = null;
  private subscriptions: Subscription = new Subscription();

  constructor(
    private driversService: DriversService,
    private loginService: LoginService,
    private alertService: AlertService
  ) {}

  ngOnInit(): void {
    this.isLoading = true;
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
                  this.isLoading = false;
                  this.alertService.showAlert({
                    alertType: AlertType.ERROR,
                    mainMessage: 'Error al cargar información de la cooperativa'
                  });
                },
              })
            );
          } else {
            console.warn('No logged in user ID found.');
            this.isLoading = false;
            this.alertService.showAlert({
              alertType: AlertType.ERROR,
              mainMessage: 'No se encontró información del usuario logueado'
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
        },
      })
    );
  }

  private loadDrivers(): void {
    if (!this.currentCooperativeId) {
      console.error('No cooperative ID available');
      this.isLoading = false;
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
          this.isLoading = false;
        },
        error: (error: HttpErrorResponse) => {
          console.error('Error loading drivers:', error);
          this.isLoading = false;
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
}
