import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { LoginService } from '@core/login/services/login.service';
import { AlertService } from '@shared/services/alert.service';
import { AlertType } from '@utils/enums/alert-type.enum';
import { HttpErrorResponse } from '@angular/common/http';
import { DriverFormComponent } from './components/driver-form/driver-form.component';

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
  private subscriptions: Subscription = new Subscription();

  private readonly loginService: LoginService = inject(LoginService);
  private readonly alertService: AlertService = inject(AlertService);
  private readonly router: Router = inject(Router);

  ngOnInit(): void {
    this.loadCooperativeId();
  }

  protected onDriverCreated(): void {
    this.router.navigate(['/drivers']);
  }

  private loadCooperativeId(): void {
    this.isLoading = true;
    this.subscriptions.add(
      this.loginService.cooperative$.subscribe({
        next: (cooperative) => {
          if (cooperative?.id) {
            this.cooperativeId = cooperative.id;
          } else {
            this.alertService.showAlert({
              alertType: AlertType.ERROR,
              mainMessage: 'No se pudo obtener la información de la cooperativa'
            });
          }
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
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
