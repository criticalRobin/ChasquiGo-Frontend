import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DriverFormComponent } from './components/driver-form/driver-form.component';
import { DriversService } from '../../services/drivers.service';
import { LoginService } from '@core/login/services/login.service';
import { Subscription } from 'rxjs';
import { IDriver } from '../../models/driver.interface';
import { IBaseUser } from '@shared/models/base-user.interface';
import { ICooperative } from '@features/coops/models/cooperative.interface';
import { CoopsService } from '@features/coops/services/coops.service';

@Component({
  selector: 'app-create-update-driver',
  standalone: true,
  imports: [CommonModule, RouterLink, DriverFormComponent],
  templateUrl: './create-update-driver.component.html',
  styleUrl: './create-update-driver.component.css',
})
export class CreateUpdateDriverComponent implements OnInit, OnDestroy {
  protected driverToEdit: IDriver | null = null;
  protected cooperativeId: number | null = null;
  protected isLoading: boolean = false;
  private subscriptions: Subscription = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private driversService: DriversService,
    private loginService: LoginService,
    private coopsService: CoopsService
  ) {}

  ngOnInit(): void {
    this.isLoading = true;
    // Obtener el ID del conductor de la URL si estamos en modo edición
    const driverId = this.route.snapshot.paramMap.get('id');
    
    // Obtener el ID de la cooperativa del usuario actual
    this.subscriptions.add(
      this.loginService.loggedInUser$.subscribe({
        next: (user: IBaseUser | null) => {
          if (user?.id) {
            this.subscriptions.add(
              this.coopsService.getCoopByAdminId(user.id).subscribe({
                next: (coop: ICooperative) => {
                  this.cooperativeId = coop.id;
                  
                  // Si estamos en modo edición, cargar los datos del conductor
                  if (driverId) {
                    this.loadDriverData(Number(driverId), coop.id);
                  }
                  this.isLoading = false;
                },
                error: (error) => {
                  console.error('Error loading cooperative:', error);
                  this.isLoading = false;
                },
              })
            );
          }
        },
        error: (error) => {
          console.error('Error getting logged in user:', error);
          this.isLoading = false;
        },
      })
    );
  }

  protected onDriverCreated(): void {
    this.router.navigate(['/drivers']);
  }

  private loadDriverData(driverId: number, coopId: number): void {
    this.isLoading = true;
    this.subscriptions.add(
      this.driversService.getAllUsers(coopId).subscribe({
        next: (drivers) => {
          const driver = drivers.find(d => d.id === driverId);
          if (driver) {
            this.driverToEdit = driver;
            console.log('Driver loaded for editing:', this.driverToEdit);
          } else {
            console.error('Driver not found');
            this.router.navigate(['/drivers']);
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading driver data:', error);
          this.router.navigate(['/drivers']);
          this.isLoading = false;
        },
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
