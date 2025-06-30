import { Component, EventEmitter, Input, OnInit, Output, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { IBuses, IBusSeat, IBusType } from '../../models/buses.interface';
import { BusesService } from '../../services/buses.service';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-form-buses',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './form-buses.component.html',
  styleUrl: './form-buses.component.css'
})
export class FormBusesComponent implements OnInit {
  @Output() formSubmitted = new EventEmitter<IBuses>();
  @Input() cachedBusData: IBuses | null = null;
  @Input() isEditMode: boolean = false;
  
  busForm: FormGroup;
  isEditing = false;
  busId: number | null = null;
  photos: string[] = [];
  busTypes: IBusType[] = [];
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private busesService: BusesService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {
    this.busForm = this.fb.group({
      licensePlate: ['', [Validators.required, this.licensePlateValidator]],
      chassisBrand: ['', [Validators.required, Validators.minLength(2)]],
      bodyworkBrand: ['', [Validators.required, Validators.minLength(2)]],
      busTypeId: [null, Validators.required],
      capacity: [''],
      floorCount: ['']
    });

    // Escuchar cambios en busTypeId
    this.busForm.get('busTypeId')?.valueChanges.subscribe(busTypeId => {
      this.onBusTypeChange(busTypeId);
    });

    // Convertir matrícula a mayúsculas automáticamente
    this.busForm.get('licensePlate')?.valueChanges.subscribe(value => {
      if (value && typeof value === 'string') {
        const upperValue = value.toUpperCase();
        if (value !== upperValue) {
          this.busForm.get('licensePlate')?.setValue(upperValue, { emitEvent: false });
        }
      }
    });
  }

  ngOnInit(): void {
    // Cargar tipos de bus primero y luego procesar datos
    this.loadBusTypes().then(() => {
      if (this.cachedBusData) {
        console.log('Loading cached bus data:', this.cachedBusData);
        this.busForm.patchValue(this.cachedBusData);
        if (this.cachedBusData.photos) {
          this.photos = [...this.cachedBusData.photos];
        }
        // Si hay un tipo de bus en cache, disparar el cambio para calcular capacidad y pisos
        if (this.cachedBusData.busTypeId) {
          this.onBusTypeChange(this.cachedBusData.busTypeId);
        }
      } else {
        // Check for bus ID in route params for editing mode
        this.route.params.subscribe(params => {
          if (params['id']) {
            this.busId = Number(params['id']);
            this.isEditing = true;
            if (this.busId !== null) {
              this.loadBusData(this.busId);
            }
          }
        });
      }
    }).catch(error => {
      console.error('Error loading bus types:', error);
    });
  }

  loadBusTypes(): Promise<void> {
    console.log('Loading bus types...');
    return new Promise((resolve, reject) => {
      this.busesService.getBusTypes().subscribe({
        next: (busTypes: IBusType[]) => {
          console.log('Bus types loaded:', busTypes);
          this.busTypes = busTypes.filter(type => !type.isDeleted);
          console.log('Filtered bus types:', this.busTypes);
          resolve();
        },
        error: (error) => {
          console.error('Error al cargar tipos de bus:', error);
          reject(error);
        }
      });
    });
  }

  loadBusData(id: number): void {
    this.busesService.getBusById(id).subscribe({
      next: (bus: IBuses) => {
        console.log('Loading bus data:', bus);
        this.busForm.patchValue({
          licensePlate: bus.licensePlate,
          chassisBrand: bus.chassisBrand,
          bodyworkBrand: bus.bodyworkBrand,
          busTypeId: bus.busTypeId
        });
        
        // Si el bus tiene un tipo, cargar la capacidad y pisos del tipo
        if (bus.busTypeId && this.busTypes.length > 0) {
          this.onBusTypeChange(bus.busTypeId);
        } else if (bus.capacity && bus.floorCount) {
          // Si por alguna razón no se pueden cargar del tipo, usar los valores del bus
          this.busForm.patchValue({
            capacity: bus.capacity,
            floorCount: bus.floorCount
          });
        }
        
        this.photos = bus.photos || [];
      },
      error: (error) => {
        console.error('Error al cargar los datos del bus', error);
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      for (let i = 0; i < input.files.length; i++) {
        const file = input.files[i];
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (e: ProgressEvent<FileReader>) => {
            if (e.target?.result) {
              this.photos.push(e.target.result as string);
            }
          };
          reader.readAsDataURL(file);
        }
      }
    }
  }

  removePhoto(index: number): void {
    this.photos.splice(index, 1);
  }

  onSubmit(): void {
    // Marcar todos los campos como tocados para mostrar errores
    Object.keys(this.busForm.controls).forEach(key => {
      this.busForm.get(key)?.markAsTouched();
    });

    if (this.busForm.valid) {
      const busData: IBuses = {
        ...this.busForm.value,
        photos: this.photos,
        seats: this.generateDefaultSeats(
          this.busForm.value.capacity,
          this.busForm.value.floorCount
        )
      };
      this.formSubmitted.emit(busData);
    } else {
      console.log('Formulario inválido. Errores por campo:');
      Object.keys(this.busForm.controls).forEach(key => {
        const control = this.busForm.get(key);
        if (control?.invalid) {
          console.log(`${key}:`, control.errors);
        }
      });
      
      // Scroll al primer campo con error
      const firstErrorField = Object.keys(this.busForm.controls).find(key => 
        this.busForm.get(key)?.invalid
      );
      if (firstErrorField) {
        const element = document.querySelector(`[formControlName="${firstErrorField}"]`) as HTMLElement;
        element?.focus();
        element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }

  private generateDefaultSeats(capacity: number, floorCount: number): IBusSeat[] {
    const seats: IBusSeat[] = [];
    let seatNumber = 1;
    
    // Determinar asientos por piso
    const seatsFloor1 = floorCount === 2 ? Math.ceil(capacity / 2) : capacity;
    const seatsFloor2 = floorCount === 2 ? capacity - seatsFloor1 : 0;
    
    // Generar asientos para piso 1
    for (let i = 0; i < seatsFloor1; i++) {
      seats.push({
        number: seatNumber++,
        type: 'NORMAL',
        location: this.getSeatLocation(i, seatsFloor1),
        floor: 1
      });
    }
    
    // Generar asientos para piso 2 (si aplica)
    if (floorCount === 2 && seatsFloor2 > 0) {
      for (let i = 0; i < seatsFloor2; i++) {
        seats.push({
          number: seatNumber++,
          type: 'NORMAL',
          location: this.getSeatLocation(i, seatsFloor2),
          floor: 2
        });
      }
    }
    
    return seats;
  }

  private getSeatLocation(index: number, totalSeats: number): 'WINDOW_LEFT' | 'WINDOW_RIGHT' | 'AISLE_LEFT' | 'AISLE_RIGHT' | 'MIDDLE' {
    // Obtener el floorCount del formulario
    const floorCount = this.busForm.get('floorCount')?.value;
    
    // Solo aplicar MIDDLE para buses de 1 piso con número impar de asientos
    const isOneFloorOddSeats = floorCount === 1 && totalSeats % 2 !== 0;
    
    // Si es el último asiento y es bus de 1 piso con asientos impares
    if (isOneFloorOddSeats && index === totalSeats - 1) {
      return 'MIDDLE';
    }
    
    // Distribución normal: WINDOW_LEFT, AISLE_LEFT, AISLE_RIGHT, WINDOW_RIGHT
    const position = index % 4;
    switch (position) {
      case 0: return 'WINDOW_LEFT';
      case 1: return 'AISLE_LEFT';
      case 2: return 'AISLE_RIGHT';
      case 3: return 'WINDOW_RIGHT';
      default: return 'WINDOW_LEFT';
    }
  }

  cancel(): void {
    this.router.navigate(['/buses']);
  }

  onBusTypeChange(busTypeId: number): void {
    console.log('Bus type changed to:', busTypeId);
    if (busTypeId) {
      // Usar el endpoint específico para obtener el tipo de bus por ID
      this.busesService.getBusTypeById(busTypeId).subscribe({
        next: (selectedBusType: IBusType) => {
          console.log('Selected bus type object:', selectedBusType);
          if (selectedBusType) {
            const totalSeats = selectedBusType.seatsFloor1 + selectedBusType.seatsFloor2;
            console.log('Updating form with capacity:', totalSeats, 'and floorCount:', selectedBusType.floorCount);
            
            this.busForm.patchValue({
              capacity: totalSeats,
              floorCount: selectedBusType.floorCount
            });
            
            // Forzar detección de cambios
            this.cdr.detectChanges();
            
            // Verificar que los valores se asignaron correctamente
            console.log('Form values after patch:', this.busForm.value);
          }
        },
        error: (error) => {
          console.error('Error al cargar el tipo de bus:', error);
          // En caso de error, limpiar los campos
          this.busForm.patchValue({
            capacity: '',
            floorCount: ''
          });
          this.cdr.detectChanges();
        }
      });
    } else {
      // Si no hay tipo seleccionado, limpiar los campos
      this.busForm.patchValue({
        capacity: '',
        floorCount: ''
      });
      this.cdr.detectChanges();
    }
  }

  // Validador personalizado para matrícula
  licensePlateValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) {
      return null; // Si está vacío, el validator required se encarga
    }

    const value = control.value.toString().toUpperCase();
    
    // Patrón para ABC-123 o ABC-1234
    const pattern = /^[A-Z]{3}-\d{3,4}$/;
    
    if (!pattern.test(value)) {
      return { 
        invalidLicensePlate: { 
          message: 'La matrícula debe tener el formato ABC-123 o ABC-1234' 
        } 
      };
    }
    
    return null;
  }

  // Métodos para obtener errores de validación
  getFieldError(fieldName: string): string | null {
    const field = this.busForm.get(fieldName);
    if (field && field.invalid && (field.dirty || field.touched)) {
      if (field.errors?.['required']) {
        return `${this.getFieldDisplayName(fieldName)} es requerido`;
      }
      if (field.errors?.['minlength']) {
        return `${this.getFieldDisplayName(fieldName)} debe tener al menos ${field.errors['minlength'].requiredLength} caracteres`;
      }
      if (field.errors?.['invalidLicensePlate']) {
        return field.errors['invalidLicensePlate'].message;
      }
    }
    return null;
  }

  getFieldDisplayName(fieldName: string): string {
    const names: { [key: string]: string } = {
      'licensePlate': 'La matrícula',
      'chassisBrand': 'La marca del chasis',
      'bodyworkBrand': 'La marca de la carrocería',
      'busTypeId': 'El tipo de bus'
    };
    return names[fieldName] || fieldName;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.busForm.get(fieldName);
    return field ? field.invalid && (field.dirty || field.touched) : false;
  }
}
