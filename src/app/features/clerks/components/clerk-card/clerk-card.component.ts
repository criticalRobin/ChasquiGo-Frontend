import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IClerk } from '../../models/clerk-response.interface';
import { ClerkManagementService } from '../../services/clerk-management.service';
import { AlertService } from '@shared/services/alert.service';
import { AlertType } from '@utils/enums/alert-type.enum';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-clerk-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './clerk-card.component.html',
  styleUrl: './clerk-card.component.css'
})
export class ClerkCardComponent {
  @Input() clerk!: IClerk;

  constructor(
    private router: Router,
    private clerkManagementService: ClerkManagementService,
    private alertService: AlertService
  ) {}

  onEdit(): void {
    this.router.navigate(['/create-update-clerk', this.clerk.id]);
  }

  confirmDelete(): void {
    this.clerkManagementService.deleteClerk(this.clerk.id).subscribe({
      next: () => {
        this.alertService.showAlert({
          alertType: AlertType.SUCCESS,
          mainMessage: 'Oficinista eliminado exitosamente'
        });
        
        // Recargar la página para actualizar la lista
        window.location.reload();
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
