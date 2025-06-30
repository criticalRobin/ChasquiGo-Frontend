import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BusTypesService } from '../../services/bus-types.service';
import { IBusType, IBusTypeCreate, IBusTypeUpdate } from '../../models/bus-type.interface';
import { AlertService } from '@shared/services/alert.service';
import { AlertType } from '@utils/enums/alert-type.enum';

@Component({
  selector: 'app-form-bus-type',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './form-bus-type.component.html',
  styleUrl: './form-bus-type.component.css'
})
export class FormBusTypeComponent implements OnInit {
  busTypeForm: FormGroup;
  isEditMode: boolean = false;
  busTypeId: number | null = null;
  loading: boolean = false;
  saving: boolean = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private busTypesService: BusTypesService,
    private alertService: AlertService
  ) {
    this.busTypeForm = this.createForm();
  }

  ngOnInit(): void {
    // Inicializar el estado del campo seatsFloor2 basado en floorCount
    this.initializeFloorControls();
    
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.busTypeId = +params['id'];
        this.loadBusType(); 
      }
    });
  }

  private initializeFloorControls(): void {
    const floorCount = Number(this.busTypeForm.get('floorCount')?.value);
    const seatsFloor2Control = this.busTypeForm.get('seatsFloor2');
    
    console.log('Initializing floor controls, floorCount:', floorCount); // Debug log
    
    if (floorCount === 1) {
      console.log('Initial setup: disabling floor 2'); // Debug log
      seatsFloor2Control?.setValue(0);
      seatsFloor2Control?.disable();
    } else if (floorCount === 2) {
      console.log('Initial setup: enabling floor 2'); // Debug log
      seatsFloor2Control?.enable();
    }
  }

  createForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      description: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(200)]],
      floorCount: [1, [Validators.required, Validators.min(1), Validators.max(2)]],
      seatsFloor1: [20, [Validators.required, Validators.min(1), Validators.max(40)]],
      seatsFloor2: [0, [Validators.min(0), Validators.max(40)]],
      aditionalPrice: ['0.00', [Validators.required, Validators.pattern(/^\d+(\.\d{1,2})?$/), Validators.max(50)]]
    });
  }

  loadBusType(): void {
    if (!this.busTypeId) return;

    this.loading = true;
    this.busTypesService.getBusTypeById(this.busTypeId).subscribe({
      next: (busType) => {
        // En modo edición, permitir editar nombre, descripción y precio adicional
        this.busTypeForm.patchValue({
          name: busType.name,
          description: busType.description,
          aditionalPrice: busType.aditionalPrice
        });
        
        // Deshabilitar campos que no se pueden editar
        this.busTypeForm.get('floorCount')?.disable();
        this.busTypeForm.get('seatsFloor1')?.disable();
        this.busTypeForm.get('seatsFloor2')?.disable();
        
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar tipo de bus:', error);
        this.loading = false;
        this.alertService.showAlert({
          alertType: AlertType.ERROR,
          mainMessage: 'Error al cargar tipo de bus',
          subMessage: 'No se pudo cargar la información del tipo de bus.'
        });
        this.router.navigate(['/bus-types']);
      }
    });
  }

  onFloorCountChange(): void {
    const floorCount = Number(this.busTypeForm.get('floorCount')?.value);
    const seatsFloor2Control = this.busTypeForm.get('seatsFloor2');
    
    console.log('=== onFloorCountChange ===');
    console.log('Floor count changed to:', floorCount, typeof floorCount); // Debug log
    console.log('Current seatsFloor2 value before change:', seatsFloor2Control?.value);
    console.log('Current seatsFloor2 disabled status before change:', seatsFloor2Control?.disabled);
    
    if (floorCount === 1) {
      // Si es 1 piso: poner en 0 y deshabilitar
      console.log('Setting to 1 floor: disabling floor 2, setting to 0'); // Debug log
      seatsFloor2Control?.setValue(0);
      seatsFloor2Control?.disable();
      seatsFloor2Control?.updateValueAndValidity();
    } else if (floorCount === 2) {
      // Si es 2 pisos: habilitar primero, luego ajustar valor
      console.log('Setting to 2 floors: enabling floor 2'); // Debug log
      seatsFloor2Control?.enable();
      const currentValue = Number(seatsFloor2Control?.value);
      console.log('Current value after enabling:', currentValue);
      if (currentValue === 0 || isNaN(currentValue)) {
        console.log('Setting default value to 20'); // Debug log
        seatsFloor2Control?.setValue(20);
      }
      seatsFloor2Control?.updateValueAndValidity();
    }
    
    console.log('Final seatsFloor2 disabled status:', seatsFloor2Control?.disabled); // Debug log
    console.log('Final seatsFloor2 value:', seatsFloor2Control?.value); // Debug log
    console.log('Form raw value after change:', this.busTypeForm.getRawValue()); // Debug log
    console.log('=== End onFloorCountChange ===');
  }

  onSubmit(): void {
    if (this.busTypeForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.saving = true;

    if (this.isEditMode) {
      this.updateBusType();
    } else {
      this.createBusType();
    }
  }

  createBusType(): void {
    // Usar getRawValue() para obtener valores de controles deshabilitados también
    const formValue = this.busTypeForm.getRawValue();
    
    console.log('Form raw values:', formValue); // Debug log
    
    // Convertir floorCount a número para comparación
    const floorCount = Number(formValue.floorCount);
    
    // Asegurar que seatsFloor2 sea siempre un número válido
    let seatsFloor2Value = 0;
    if (floorCount === 2) {
      seatsFloor2Value = Number(formValue.seatsFloor2) || 0;
      console.log('Bus de 2 pisos, seatsFloor2:', seatsFloor2Value); // Debug log
    } else {
      console.log('Bus de 1 piso, seatsFloor2 set to 0'); // Debug log
    }
    
    const busTypeData: IBusTypeCreate = {
      name: formValue.name.trim(),
      description: formValue.description.trim(),
      floorCount: floorCount,
      seatsFloor1: Number(formValue.seatsFloor1),
      seatsFloor2: seatsFloor2Value,
      aditionalPrice: formValue.aditionalPrice
    };

    console.log('Datos enviados al backend:', busTypeData); // Debug log

    this.busTypesService.createBusType(busTypeData).subscribe({
      next: (createdBusType) => {
        this.saving = false;
        this.alertService.showAlert({
          alertType: AlertType.SUCCESS,
          mainMessage: 'Tipo creado',
          subMessage: `El tipo de bus "${createdBusType.name}" ha sido creado exitosamente.`
        });
        this.router.navigate(['/bus-types']);
      },
      error: (error) => {
        console.error('Error al crear tipo de bus:', error);
        this.saving = false;
        this.alertService.showAlert({
          alertType: AlertType.ERROR,
          mainMessage: 'Error al crear tipo',
          subMessage: error.error?.message || 'No se pudo crear el tipo de bus. Inténtalo nuevamente.'
        });
      }
    });
  }

  updateBusType(): void {
    if (!this.busTypeId) return;

    const formValue = this.busTypeForm.value;
    const busTypeData: IBusTypeUpdate = {
      name: formValue.name.trim(),
      description: formValue.description.trim(),
      aditionalPrice: formValue.aditionalPrice
    };

    this.busTypesService.updateBusType(this.busTypeId, busTypeData).subscribe({
      next: (updatedBusType) => {
        this.saving = false;
        this.alertService.showAlert({
          alertType: AlertType.SUCCESS,
          mainMessage: 'Tipo actualizado',
          subMessage: `El tipo de bus "${updatedBusType.name}" ha sido actualizado exitosamente.`
        });
        this.router.navigate(['/bus-types']);
      },
      error: (error) => {
        console.error('Error al actualizar tipo de bus:', error);
        this.saving = false;
        this.alertService.showAlert({
          alertType: AlertType.ERROR,
          mainMessage: 'Error al actualizar tipo',
          subMessage: error.error?.message || 'No se pudo actualizar el tipo de bus. Inténtalo nuevamente.'
        });
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/bus-types']);
  }

  markFormGroupTouched(): void {
    Object.keys(this.busTypeForm.controls).forEach(key => {
      const control = this.busTypeForm.get(key);
      control?.markAsTouched();
    });
  }

  getFieldError(fieldName: string): string {
    const control = this.busTypeForm.get(fieldName);
    if (!control || !control.errors || !control.touched) return '';

    const errors = control.errors;
    
    if (errors['required']) return 'Este campo es requerido';
    if (errors['minlength']) return `Mínimo ${errors['minlength'].requiredLength} caracteres`;
    if (errors['maxlength']) return `Máximo ${errors['maxlength'].requiredLength} caracteres`;
    if (errors['min']) return `Valor mínimo: ${errors['min'].min}`;
    if (errors['max']) return `Valor máximo: ${errors['max'].max}`;
    if (errors['pattern']) return 'Formato inválido';

    return '';
  }

  get pageTitle(): string {
    return this.isEditMode ? 'Editar Tipo de Bus' : 'Crear Nuevo Tipo de Bus';
  }

  get submitButtonText(): string {
    if (this.saving) {
      return this.isEditMode ? 'Actualizando...' : 'Creando...';
    }
    return this.isEditMode ? 'Actualizar Tipo' : 'Crear Tipo';
  }
}
