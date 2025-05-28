import { Component, inject } from '@angular/core';
import { LoadingService } from '@shared/services/loading.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-spinner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './spinner.component.html',
  styleUrl: './spinner.component.css',
})
export class SpinnerComponent {
  protected readonly loadingSrv: LoadingService = inject(LoadingService);
}
