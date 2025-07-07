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
import { ClerkManagementService } from '../../../../services/clerk-management.service';
import { AlertService } from '@shared/services/alert.service';
import { AlertType } from '@utils/enums/alert-type.enum';
import { IClerkRequest } from '../../../../models/clerk-request.interface';
import { IClerk } from '../../../../models/clerk-response.interface';
import { IClerkUpdateRequest } from '../../../../models/clerk-update-request.interface';
import { IChangePasswordRequest } from '../../../../models/change-password-request.interface';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-clerk-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './clerk-form.component.html',
  styleUrl: './clerk-form.component.css',
})
export class ClerkFormComponent implements OnInit, OnChanges, OnDestroy {
  @Input() cooperativeId!: number;
  @Input() clerkData: IClerk | null = null;
  @Input() isEditMode: boolean = false;
  @Output() clerkCreated = new EventEmitter<void>();

  protected clerkForm: FormGroup;
  protected isLoading: boolean = false;
  protected showPasswordSection: boolean = false;
  private subscriptions: Subscription = new Subscription();

  private readonly fb: FormBuilder = inject(FormBuilder);
  private readonly router: Router = inject(Router);
  private readonly clerkManagementService: ClerkManagementService = inject(ClerkManagementService);
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
    this.clerkForm = this.fb.group({
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
      this.clerkForm.get('password')?.setValidators([
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
    if (this.isEditMode && this.clerkData) {
      this.loadClerkDataToForm();
    }
  }

  private disableNonEditableFields(): void {
    // Deshabilitar campos que no pueden modificarse en modo edición
    this.clerkForm.get('idNumber')?.disable();
    this.clerkForm.get('documentType')?.disable();
    this.clerkForm.get('firstName')?.disable();
    this.clerkForm.get('lastName')?.disable();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Manejar cambios en clerkData después de que el componente se ha inicializado
    if (changes['clerkData'] && changes['clerkData'].currentValue) {
      this.loadClerkDataToForm();
    }
  }

  private loadClerkDataToForm(): void {
    if (!this.clerkData) return;
    
    this.clerkForm.patchValue({
      idNumber: this.clerkData.idNumber,
      documentType: this.clerkData.documentType,
      firstName: this.clerkData.firstName,
      lastName: this.clerkData.lastName,
      email: this.clerkData.email,
      phone: this.clerkData.phone,
    });
    
    // En modo edición, deshabilitar campos no editables después de cargar los datos
    if (this.isEditMode) {
      this.disableNonEditableFields();
    }
    
    // En modo edición, la contraseña NO tiene validaciones por defecto
    this.clerkForm.get('password')?.clearValidators();
    this.clerkForm.get('password')?.updateValueAndValidity();
    
    // Forzar la actualización del estado del formulario
    this.clerkForm.updateValueAndValidity();
  }

  protected togglePasswordSection(): void {
    this.showPasswordSection = !this.showPasswordSection;
    
    if (this.showPasswordSection) {
      // Activar validaciones de contraseña
      this.clerkForm.get('password')?.setValidators([
        Validators.required, 
        Validators.minLength(6), 
        Validators.maxLength(20), 
        this.passwordValidator.bind(this)
      ]);
    } else {
      // Quitar validaciones y limpiar campo
      this.clerkForm.get('password')?.clearValidators();
      this.clerkForm.get('password')?.setValue('');
    }
    this.clerkForm.get('password')?.updateValueAndValidity();
  }

  protected onSubmit(): void {    
    if (this.clerkForm.valid && this.cooperativeId) {
      this.isLoading = true;
      
      if (this.isEditMode) {
        this.updateClerk();
      } else {
        this.createClerk();
      }
    } else {
      // Marcar todos los campos como tocados para mostrar errores
      this.clerkForm.markAllAsTouched();
      
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

  private createClerk(): void {
    const clerkData: IClerkRequest = {
      idNumber: this.clerkForm.value.idNumber,
      documentType: this.clerkForm.value.documentType,
      firstName: this.clerkForm.value.firstName,
      lastName: this.clerkForm.value.lastName,
      email: this.clerkForm.value.email,
      phone: this.clerkForm.value.phone,
      password: this.clerkForm.value.password,
      cooperativeId: this.cooperativeId,
    };

    this.subscriptions.add(
      this.clerkManagementService.createClerk(clerkData).subscribe({
        next: (response) => {
          console.log('Clerk created successfully');
          this.isLoading = false;
          this.alertService.showAlert({
            alertType: AlertType.SUCCESS,
            mainMessage: 'Oficinista registrado exitosamente',
          });
          this.clerkCreated.emit();
          this.router.navigate(['/oficinistas']);
        },
        error: (error: HttpErrorResponse) => {
          this.handleError(error, 'crear');
        },
      })
    );
  }

  private updateClerk(): void {
    if (!this.clerkData?.id) return;
    
    // En modo edición, solo enviar campos editables
    const updateData: IClerkUpdateRequest = {
      idNumber: this.clerkData.idNumber,
      documentType: this.clerkData.documentType,
      firstName: this.clerkData.firstName,
      lastName: this.clerkData.lastName,
      email: this.clerkForm.value.email,
      phone: this.clerkForm.value.phone,
      cooperativeId: this.cooperativeId,
    };

    this.subscriptions.add(
      this.clerkManagementService.updateClerk(this.clerkData.id, updateData).subscribe({
        next: (response) => {
          console.log('Clerk updated successfully');
          
          // Si se cambió la contraseña, hacer petición adicional
          if (this.showPasswordSection && this.clerkForm.value.password) {
            this.changePassword();
          } else {
            this.isLoading = false;
            this.alertService.showAlert({
              alertType: AlertType.SUCCESS,
              mainMessage: 'Oficinista actualizado exitosamente',
            });
            this.clerkCreated.emit();
            this.router.navigate(['/oficinistas']);
          }
        },
        error: (error: HttpErrorResponse) => {
          this.handleError(error, 'actualizar');
        },
      })
    );
  }

  private changePassword(): void {
    if (!this.clerkData?.id || !this.clerkForm.value.password) return;

    const passwordData: IChangePasswordRequest = {
      newPassword: this.clerkForm.value.password
    };

    this.subscriptions.add(
      this.clerkManagementService.changePassword(this.clerkData.id, passwordData).subscribe({
        next: (response) => {
          console.log('Password changed successfully');
          this.isLoading = false;
          this.alertService.showAlert({
            alertType: AlertType.SUCCESS,
            mainMessage: 'Oficinista y contraseña actualizados exitosamente',
          });
          this.clerkCreated.emit();
          this.router.navigate(['/oficinistas']);
        },
        error: (error: HttpErrorResponse) => {
          this.isLoading = false;
          this.alertService.showAlert({
            alertType: AlertType.WARNING,
            mainMessage: 'Oficinista actualizado, pero hubo un error al cambiar la contraseña',
          });
          this.clerkCreated.emit();
          this.router.navigate(['/oficinistas']);
        },
      })
    );
  }

  private handleError(error: HttpErrorResponse, action: string): void {
    console.error(`Error ${action} clerk:`, error);
    this.isLoading = false;
    
    let errorMessage = `Error al ${action} oficinista`;
    
    if (error.status === 400) {
      errorMessage = 'Datos inválidos. Verifique la información ingresada.';
      if (error.error?.message) {
        errorMessage = error.error.message;
      }
    } else if (error.status === 409) {
      errorMessage = 'Ya existe un oficinista con esta cédula o correo electrónico.';
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
    if (!this.clerkForm) return false;
    
    // En modo edición, solo validar campos editables: email y phone
    if (this.isEditMode) {
      const editableFields = ['email', 'phone'];
      
      for (const field of editableFields) {
        const control = this.clerkForm.get(field);
        if (!control || control.invalid) {
          return false;
        }
      }
      
      // Si se está cambiando la contraseña, debe ser válida
      if (this.showPasswordSection) {
        const passwordControl = this.clerkForm.get('password');
        if (!passwordControl || passwordControl.invalid) {
          return false;
        }
      }
      
      return true;
    }
    
    // En modo creación, validar todos los campos
    const basicFields = ['idNumber', 'documentType', 'firstName', 'lastName', 'email', 'phone'];
    
    for (const field of basicFields) {
      const control = this.clerkForm.get(field);
      if (!control || control.invalid) {
        return false;
      }
    }
    
    // En modo creación, también validar contraseña
    const passwordControl = this.clerkForm.get('password');
    if (!passwordControl || passwordControl.invalid) {
      return false;
    }
    
    return true;
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
