import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  inject,
  OnChanges,
  SimpleChanges,
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
import { IDriver } from '@features/drivers/models/driver.interface';

@Component({
  selector: 'app-driver-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './driver-form.component.html',
  styleUrl: './driver-form.component.css',
})
export class DriverFormComponent implements OnInit, OnDestroy, OnChanges {
  @Input() cooperativeId!: number;
  @Input() driverToEdit: IDriver | null = null;
  @Output() driverCreated = new EventEmitter<void>();
  @Output() driverUpdated = new EventEmitter<void>();

  protected driverForm: FormGroup;
  protected isLoading: boolean = false;
  protected isEditMode: boolean = false;
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

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['driverToEdit'] && changes['driverToEdit'].currentValue) {
      const driver = changes['driverToEdit'].currentValue as IDriver;
      this.driverToEdit = driver;
      this.isEditMode = true;
      console.log(
        'Driver data received by form in ngOnChanges:',
        this.driverToEdit
      );
      this.driverForm.patchValue({
        idNumber: driver.idNumber,
        documentType: 'CEDULA',
        firstName: driver.firstName,
        lastName: driver.lastName,
        email: driver.email,
        phone: driver.phone,
        cooperativeId: driver.cooperativeId,
      });
      this.driverForm.get('password')?.clearValidators();
      this.driverForm.get('password')?.updateValueAndValidity();
    }
  }

  protected onSubmit(): void {
    if (this.driverForm.valid) {
      this.isLoading = true;
      const driverData: IDriverRequest = {
        ...this.driverForm.value,
      };

      if (this.isEditMode && !driverData.password) {
        delete driverData.password;
      }

      console.log('Submitting driver data:', driverData);

      const request$ =
        this.isEditMode && this.driverToEdit
          ? this.driverManagementService.updateDriver(
              this.driverToEdit.id,
              driverData
            )
          : this.driverManagementService.createDriver(driverData);

      this.subscriptions.add(
        request$.subscribe({
          next: () => {
            this.alertService.showAlert({
              alertType: AlertType.SUCCESS,
              mainMessage: this.isEditMode
                ? 'Conductor actualizado exitosamente'
                : 'Conductor registrado exitosamente',
            });
            if (this.isEditMode) {
              this.driverUpdated.emit();
            } else {
              this.driverCreated.emit();
            }
            this.router.navigate(['/drivers']);
          },
          error: (error: HttpErrorResponse) => {
            console.error('Error with driver:', error);
            this.isLoading = false;
            this.alertService.showAlert({
              alertType: AlertType.ERROR,
              mainMessage: this.isEditMode
                ? 'Error al actualizar conductor'
                : 'Error al registrar conductor',
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
