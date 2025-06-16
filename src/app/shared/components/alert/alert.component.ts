import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AlertService } from '@shared/services/alert.service';
import { IAlert } from '@shared/models/alert.interface';

@Component({
  selector: 'app-alert',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './alert.component.html',
  styleUrls: ['./alert.component.css'],
})
export class AlertComponent implements OnInit {
  private readonly alertService: AlertService = inject(AlertService);

  protected alert: IAlert | null = null;

  ngOnInit(): void {
    this.alertService.alert$.subscribe((alert: IAlert) => {
      this.alert = alert;
      
      // Only set auto-close timer for non-confirmation alerts
      if (!alert.showConfirmButton) {
        setTimeout(() => {
          this.alert = null;
        }, 5000);
      }
    });
  }
  
  onConfirm(): void {
    if (this.alert && this.alert.onConfirm) {
      this.alert.onConfirm();
    }
    this.closeAlert();
  }
  
  closeAlert(): void {
    this.alert = null;
  }
}
