import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  OnChanges,
  SimpleChanges,
  Output,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { DriverManagementService } from '../../services/driver-management.service';
import { AlertService } from '@shared/services/alert.service';
import { AlertType } from '@utils/enums/alert-type.enum';
import { IDriverRequest } from '../../models/driver-request.interface';
import { IDriver } from '@features/drivers/models/driver.interface';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-driver-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './driver-form.component.html',
  styleUrl: './driver-form.component.css',
})
export class DriverFormComponent implements OnInit, OnChanges, OnDestroy {
  @Input() cooperativeId!: number;
  @Input() driverData: IDriver | null = null;
  @Input() isEditMode: boolean = false;
  @Output() driverCreated = new EventEmitter<void>();

  protected driverForm: FormGroup;
  protected isLoading: boolean = false;
  protected showPasswordSection: boolean = false;
  private subscriptions: Subscription = new Subscription();

  private readonly fb: FormBuilder = inject(FormBuilder);
  private readonly router: Router = inject(Router);
  private readonly driverManagementService: DriverManagementService = inject(
    DriverManagementService
  );
  private readonly alertService: AlertService = inject(AlertService);

  // Validador personalizado para contraseña con mayúscula y número
  private passwordValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    
    const password = control.value;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    
    if (!hasUpperCase || !hasNumber) {
      return { passwordPattern: true };
    }
    
    return null;
  }

  // Validador personalizado para cédula ecuatoriana
  private ecuadorianIdValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    
    const id = control.value.toString();
    if (id.length !== 10) return { invalidId: true };
    
    // Validar que todos sean números
    if (!/^\d+$/.test(id)) return { invalidId: true };
    
    // Validar provincia (primeros 2 dígitos)
    const province = parseInt(id.substring(0, 2));
    if (province < 1 || province > 24) return { invalidId: true };
    
    // Validar dígito verificador
    const digits = id.split('').map(Number);
    const verifyDigit = digits[9];
    
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      let product = digits[i] * (i % 2 === 0 ? 2 : 1);
      if (product > 9) product -= 9;
      sum += product;
    }
    
    const expectedVerifyDigit = (10 - (sum % 10)) % 10;
    
    if (verifyDigit !== expectedVerifyDigit) return { invalidId: true };
    
    return null;
  }

  constructor() {
    this.driverForm = this.fb.group({
      idNumber: ['', [Validators.required, this.ecuadorianIdValidator.bind(this)]],
      documentType: ['CEDULA', Validators.required],
      firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      password: [''],
    });
  }

  ngOnInit(): void {
    // En modo edición, la contraseña NO es requerida por defecto
    if (!this.isEditMode) {
      // En modo creación, la contraseña es requerida
      this.driverForm.get('password')?.setValidators([
        Validators.required, 
        Validators.minLength(6), 
        Validators.maxLength(20), 
        this.passwordValidator.bind(this)
      ]);
    } else {
      // En modo edición, deshabilitar campos que no pueden modificarse
      this.disableNonEditableFields();
    }
    
    // Si estamos en modo edición, prellenar el formulario
    if (this.isEditMode && this.driverData) {
      this.loadDriverDataToForm();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Manejar cambios en driverData después de que el componente se ha inicializado
    if (changes['driverData'] && changes['driverData'].currentValue) {
      this.loadDriverDataToForm();
    }
  }

  private loadDriverDataToForm(): void {
    if (!this.driverData) return;
    
    this.driverForm.patchValue({
      idNumber: this.driverData.idNumber,
      documentType: this.driverData.documentType,
      firstName: this.driverData.firstName,
      lastName: this.driverData.lastName,
      email: this.driverData.email,
      phone: this.driverData.phone,
    });
    
    // En modo edición, deshabilitar campos no editables después de cargar los datos
    if (this.isEditMode) {
      this.disableNonEditableFields();
    }
    
    // En modo edición, la contraseña NO tiene validaciones por defecto
    this.driverForm.get('password')?.clearValidators();
    this.driverForm.get('password')?.updateValueAndValidity();
    
    // Forzar la actualización del estado del formulario
    this.driverForm.updateValueAndValidity();
  }

  protected togglePasswordSection(): void {
    this.showPasswordSection = !this.showPasswordSection;
    
    if (this.showPasswordSection) {
      // Activar validaciones de contraseña
      this.driverForm.get('password')?.setValidators([
        Validators.required, 
        Validators.minLength(6), 
        Validators.maxLength(20), 
        this.passwordValidator.bind(this)
      ]);
    } else {
      // Quitar validaciones y limpiar campo
      this.driverForm.get('password')?.clearValidators();
      this.driverForm.get('password')?.setValue('');
    }
    this.driverForm.get('password')?.updateValueAndValidity();
  }

  protected onSubmit(): void {    
    if (this.driverForm.valid && this.cooperativeId) {
      this.isLoading = true;
      
      if (this.isEditMode) {
        this.updateDriver();
      } else {
        this.createDriver();
      }
    } else {
      // Marcar todos los campos como tocados para mostrar errores
      this.driverForm.markAllAsTouched();
      
      if (!this.cooperativeId) {
        this.alertService.showAlert({
          alertType: AlertType.ERROR,
          mainMessage: 'No se pudo obtener la información de la cooperativa',
        });
      } else {
        this.alertService.showAlert({
          alertType: AlertType.WARNING,
          mainMessage: 'Por favor, complete todos los campos requeridos',
        });
      }
    }
  }

  private createDriver(): void {
    const driverData: IDriverRequest = {
      idNumber: this.driverForm.value.idNumber,
      documentType: this.driverForm.value.documentType,
      firstName: this.driverForm.value.firstName,
      lastName: this.driverForm.value.lastName,
      email: this.driverForm.value.email,
      phone: this.driverForm.value.phone,
      password: this.driverForm.value.password,
      cooperativeId: this.cooperativeId,
    };

    this.subscriptions.add(
      this.driverManagementService.createDriver(driverData).subscribe({
        next: (response) => {
          console.log('Driver created successfully');
          this.isLoading = false;
          this.alertService.showAlert({
            alertType: AlertType.SUCCESS,
            mainMessage: 'Conductor registrado exitosamente',
          });
          this.driverCreated.emit();
          this.router.navigate(['/drivers']);
        },
        error: (error: HttpErrorResponse) => {
          this.handleError(error, 'crear');
        },
      })
    );
  }

  private updateDriver(): void {
    if (!this.driverData?.id) return;
    
    // En modo edición, solo enviar campos editables
    const updateData: any = {
      email: this.driverForm.value.email,
      phone: this.driverForm.value.phone,
    };

    // Solo incluir contraseña si se va a cambiar
    if (this.showPasswordSection && this.driverForm.value.password) {
      updateData.password = this.driverForm.value.password;
    }

    this.subscriptions.add(
      this.driverManagementService.updateDriver(this.driverData.id, updateData).subscribe({
        next: (response) => {
          console.log('Driver updated successfully');
          this.isLoading = false;
          this.alertService.showAlert({
            alertType: AlertType.SUCCESS,
            mainMessage: 'Conductor actualizado exitosamente',
          });
          this.driverCreated.emit();
          this.router.navigate(['/drivers']);
        },
        error: (error: HttpErrorResponse) => {
          this.handleError(error, 'actualizar');
        },
      })
    );
  }

  private handleError(error: HttpErrorResponse, action: string): void {
    console.error(`Error ${action} driver:`, error);
    this.isLoading = false;
    
    let errorMessage = `Error al ${action} conductor`;
    
    if (error.status === 400) {
      errorMessage = 'Datos inválidos. Verifique la información ingresada.';
      if (error.error?.message) {
        errorMessage = error.error.message;
      }
    } else if (error.status === 409) {
      errorMessage = 'Ya existe un conductor con esta cédula o correo electrónico.';
    } else if (error.status === 500) {
      errorMessage = 'Error interno del servidor. Intente nuevamente.';
    } else if (error.error?.message) {
      errorMessage = error.error.message;
    }
    
    this.alertService.showAlert({
      alertType: AlertType.ERROR,
      mainMessage: errorMessage,
    });
  }

  protected isFormValid(): boolean {
    if (!this.driverForm) return false;
    
    // En modo edición, solo validar campos editables: email y phone
    if (this.isEditMode) {
      const editableFields = ['email', 'phone'];
      
      for (const field of editableFields) {
        const control = this.driverForm.get(field);
        if (!control || control.invalid) {
          return false;
        }
      }
      
      // Si se está cambiando la contraseña, debe ser válida
      if (this.showPasswordSection) {
        const passwordControl = this.driverForm.get('password');
        if (!passwordControl || passwordControl.invalid) {
          return false;
        }
      }
      
      return true;
    }
    
    // En modo creación, validar todos los campos
    const basicFields = ['idNumber', 'documentType', 'firstName', 'lastName', 'email', 'phone'];
    
    for (const field of basicFields) {
      const control = this.driverForm.get(field);
      if (!control || control.invalid) {
        return false;
      }
    }
    
    // En modo creación, también validar contraseña
    const passwordControl = this.driverForm.get('password');
    if (!passwordControl || passwordControl.invalid) {
      return false;
    }
    
    return true;
  }

  private disableNonEditableFields(): void {
    // Deshabilitar campos que no pueden modificarse en modo edición
    this.driverForm.get('idNumber')?.disable();
    this.driverForm.get('documentType')?.disable();
    this.driverForm.get('firstName')?.disable();
    this.driverForm.get('lastName')?.disable();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
