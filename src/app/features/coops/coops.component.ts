import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CoopsService } from './services/coops.service';
import { ICoopResponse } from './models/coop-response.interface';
import { ICoopRequest } from './models/coop-request.interface';
import { AlertService } from '@shared/services/alert.service';
import { AlertType } from '@utils/enums/alert-type.enum';
import { LoginService } from '@core/login/services/login.service';
import { IBaseUser } from '@shared/models/base-user.interface';
import { Subscription } from 'rxjs';
import { CoopFormComponent } from './components/coop-form/coop-form.component';

@Component({
  selector: 'app-coops',
  standalone: true,
  imports: [CommonModule, RouterLink, CoopFormComponent],
  templateUrl: './coops.component.html',
  styleUrl: './coops.component.css',
})
export class CoopsComponent implements OnInit, OnDestroy {
  protected currentCoop: ICoopResponse | null = null;
  protected isEditing: boolean = false;
  protected adminId: number | null = null;
  private userSubscription: Subscription | null = null;

  constructor(
    private coopsService: CoopsService,
    private alertService: AlertService,
    private loginService: LoginService
  ) {}

  ngOnInit(): void {
    this.userSubscription = this.loginService.loggedInUser$.subscribe({
      next: (user: IBaseUser | null) => {
        if (user?.id) {
          this.adminId = user.id;
          this.loadCoopData(user.id);
        } else {
          this.alertService.showAlert({
            alertType: AlertType.ERROR,
            mainMessage: 'No se encontró un usuario autenticado'
          });
        }
      },
      error: (error) => {
        console.error('Error getting logged in user:', error);
        this.alertService.showAlert({
          alertType: AlertType.ERROR,
          mainMessage: 'Error al obtener la información del usuario'
        });
      }
    });
  }

  ngOnDestroy(): void {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  private loadCoopData(adminId: number): void {
    this.coopsService.getCoopByAdminId(adminId).subscribe({
      next: (coop) => {
        this.currentCoop = coop;
        console.log('Cooperative data loaded:', coop);
      },
      error: (error) => {
        console.error('Error loading cooperative data:', error);
        this.alertService.showAlert({
          alertType: AlertType.ERROR,
          mainMessage: 'Error al cargar los datos de la cooperativa'
        });
      }
    });
  }

  protected toggleEdit(): void {
    this.isEditing = !this.isEditing;
  }

  protected onFormSubmit(coopData: ICoopRequest): void {
    console.log('Form submitted with data:', coopData);
    if (this.currentCoop && this.adminId) {
      this.coopsService.updateCoop(this.currentCoop.id, coopData, this.adminId).subscribe({
        next: (updatedCoop) => {
          this.currentCoop = updatedCoop;
          localStorage.removeItem('userCooperative');
          this.loginService.saveCooperativeInLocalStorage(updatedCoop);
          this.isEditing = false;
          this.alertService.showAlert({
            alertType: AlertType.SUCCESS,
            mainMessage: 'Cooperativa actualizada exitosamente'
          });
        },
        error: (error) => {
          console.error('Error updating cooperative:', error);
          this.alertService.showAlert({
            alertType: AlertType.ERROR,
            mainMessage: 'Error al actualizar la cooperativa'
          });
        }
      });
    }
  }

  protected onCancelEdit(): void {
    this.isEditing = false;
  }
}
