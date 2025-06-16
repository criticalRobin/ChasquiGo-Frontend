import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DriversService } from './services/drivers.service';
import { LoginService } from '@core/login/services/login.service';
import { CoopsService } from '@features/coops/services/coops.service';
import { IDriver } from './models/driver.interface';
import { IBaseUser } from '@shared/models/base-user.interface';
import { ICooperative } from '@features/coops/models/cooperative.interface';
import { Subscription } from 'rxjs';
import { DriverCardComponent } from './components/driver-card/driver-card.component';

@Component({
  selector: 'app-drivers',
  standalone: true,
  imports: [CommonModule, RouterLink, DriverCardComponent],
  templateUrl: './drivers.component.html',
  styleUrl: './drivers.component.css',
})
export class DriversComponent implements OnInit, OnDestroy {
  protected drivers: IDriver[] = [];
  protected currentCooperativeId: number | null = null;
  private subscriptions: Subscription = new Subscription();

  constructor(
    private driversService: DriversService,
    private loginService: LoginService,
    private coopsService: CoopsService
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.loginService.loggedInUser$.subscribe({
        next: (user: IBaseUser | null) => {
          if (user?.id) {
            this.subscriptions.add(
              this.coopsService.getCoopByAdminId(user.id).subscribe({
                next: (coop: ICooperative) => {
                  console.log('Cooperative loaded:', coop);
                  this.currentCooperativeId = coop.id;
                  console.log(
                    'Current cooperative ID set to:',
                    this.currentCooperativeId
                  );
                  this.loadDrivers();
                },
                error: (error) => {
                  console.error('Error loading cooperative:', error);
                  // Optionally show an alert
                },
              })
            );
          } else {
            console.warn('No logged in user ID found.');
          }
        },
        error: (error) => {
          console.error('Error fetching logged in user:', error);
        },
      })
    );
  }

  private loadDrivers(): void {
    console.log(this.currentCooperativeId);
    this.subscriptions.add(
      this.driversService.getAllUsers(this.currentCooperativeId!).subscribe({
        next: (allUsers: IDriver[]) => {
          console.log('Drivers loaded:', allUsers);
          this.drivers = allUsers;
          console.log('Drivers set to:', this.drivers);
        },
        error: (error) => {
          console.error('Error loading drivers:', error);
          // Optionally show an alert
        },
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
