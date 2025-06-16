import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { DriverManagementService } from '../../services/driver-management.service';
import { AlertService } from '@shared/services/alert.service';
import { AlertType } from '@utils/enums/alert-type.enum';
import { IDriverRequest } from '../../models/driver-request.interface';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-driver-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './driver-form.component.html',
  styleUrl: './driver-form.component.css',
})
export class DriverFormComponent implements OnInit, OnDestroy {
  @Input() cooperativeId!: number;
  @Output() driverCreated = new EventEmitter<void>();

  protected driverForm: FormGroup;
  protected isLoading: boolean = false;
  private subscriptions: Subscription = new Subscription();

  private readonly fb: FormBuilder = inject(FormBuilder);
  private readonly router: Router = inject(Router);
  private readonly driverManagementService: DriverManagementService = inject(
    DriverManagementService
  );
  private readonly alertService: AlertService = inject(AlertService);

  constructor() {
    this.driverForm = this.fb.group({
      idNumber: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      documentType: ['CEDULA', Validators.required],
      firstName: ['', [Validators.required, Validators.minLength(3)]],
      lastName: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      cooperativeId: [this.cooperativeId, Validators.required],
    });
  }

  ngOnInit(): void {
    console.log(
      'Initializing DriverFormComponent with cooperativeId:',
      this.cooperativeId
    );
    this.driverForm.patchValue({
      cooperativeId: this.cooperativeId,
    });
  }

  protected onSubmit(): void {
    if (this.driverForm.valid) {
      this.isLoading = true;
      const driverData: IDriverRequest = {
        ...this.driverForm.value,
      };

      console.log('Submitting driver data:', driverData);

      this.subscriptions.add(
        this.driverManagementService.createDriver(driverData).subscribe({
          next: () => {
            this.alertService.showAlert({
              alertType: AlertType.SUCCESS,
              mainMessage: 'Conductor registrado exitosamente',
            });
            this.driverCreated.emit();
            this.router.navigate(['/drivers']);
          },
          error: (error: HttpErrorResponse) => {
            console.error('Error registering driver:', error);
            this.isLoading = false;
            this.alertService.showAlert({
              alertType: AlertType.ERROR,
              mainMessage: 'Error al registrar conductor',
            });
          },
        })
      );
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
