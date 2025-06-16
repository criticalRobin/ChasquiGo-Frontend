import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { RouteSheetService } from '../../services/route-sheet.service';
import { AlertService } from '@shared/services/alert.service';
import { AlertType } from '@utils/enums/alert-type.enum';
import { IRouteSheet, IRouteSheetRequest } from '../../models/route-sheet.interface';
import { LoginService } from '@core/login/services/login.service';
import { ICooperative } from '@features/coops/models/cooperative.interface';
import { BusesService } from '@features/buses/services/buses.service';
import { IBuses } from '@features/buses/models/buses.interface';
import { RoutesService } from '@features/frequencies/services/frequencies.service';
import { IFrequency } from '@features/frequencies/models/frequency.interface';
import { IntermediateStopService } from '../../services/intermediate-stop.service';
import { IIntermediateStop, IIntermediateStopRequest } from '../../models/intermediate-stop.interface';

@Component({
  selector: 'app-create-update-route-sheet',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './create-update-route-sheet.component.html',
  styleUrl: './create-update-route-sheet.component.css'
})
export class CreateUpdateRouteSheetComponent implements OnInit {
  private readonly fb: FormBuilder = inject(FormBuilder);
  private readonly routeSheetService: RouteSheetService = inject(RouteSheetService);
  private readonly busesService: BusesService = inject(BusesService);
  private readonly routesService: RoutesService = inject(RoutesService);
  private readonly alertService: AlertService = inject(AlertService);
  private readonly router: Router = inject(Router);
  private readonly route: ActivatedRoute = inject(ActivatedRoute);
  private readonly loginService: LoginService = inject(LoginService);
  private readonly intermediateStopService: IntermediateStopService = inject(IntermediateStopService);

  protected routeSheetForm!: FormGroup;
  protected isLoading: boolean = false;
  protected isEditMode: boolean = false;
  protected routeSheetId: number | null = null;
  protected cooperative: ICooperative | null = null;
  protected buses: IBuses[] = [];
  protected frequencies: IFrequency[] = [];
  protected intermediateStops: IIntermediateStop[] = [];
  
  // Variables para el formulario de múltiples pasos
  protected currentStep: number = 1;
  protected totalSteps: number = 3;
  protected selectedFrequencyId: number | null = null;
  protected stepTitles: string[] = ['Información Básica', 'Selección de Bus y Frecuencia', 'Paradas Intermedias'];

  ngOnInit(): void {
    this.initForm();
    this.loadCooperative();
    this.loadBuses();
    this.loadFrequencies();
    
    // Verificar si estamos en modo edición
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.routeSheetId = +params['id'];
        this.isEditMode = true;
        this.loadRouteSheet(this.routeSheetId);
      }
    });
  }

  private initForm(): void {
    this.routeSheetForm = this.fb.group({
      // Paso 1: Información básica
      basicInfo: this.fb.group({
        date: ['', Validators.required],
        status: ['Activo', Validators.required]
      }),
      
      // Paso 2: Selección de bus y frecuencia
      busAndFrequency: this.fb.group({
        busId: ['', Validators.required],
        frequencyId: ['', Validators.required]
      }),
      
      // Paso 3: Paradas intermedias
      intermediateStops: this.fb.array([])
    });

    // Escuchar cambios en la frecuencia seleccionada
    this.routeSheetForm.get('busAndFrequency.frequencyId')?.valueChanges.subscribe(value => {
      if (value) {
        this.selectedFrequencyId = +value;
        this.loadIntermediateStopsByFrequency(this.selectedFrequencyId);
      }
    });
  }

  // Getter para acceder al FormArray de paradas intermedias
  get intermediateStopsArray(): FormArray {
    return this.routeSheetForm.get('intermediateStops') as FormArray;
  }

  // Método para añadir una nueva parada intermedia al FormArray
  addIntermediateStop(): void {
    this.intermediateStopsArray.push(
      this.fb.group({
        cityId: ['', Validators.required],
        frequencyId: [this.selectedFrequencyId, Validators.required],
        order: [this.intermediateStopsArray.length + 1, Validators.required]
      })
    );
  }

  // Método para eliminar una parada intermedia del FormArray
  removeIntermediateStop(index: number): void {
    this.intermediateStopsArray.removeAt(index);
    
    // Actualizar el orden de las paradas restantes
    for (let i = index; i < this.intermediateStopsArray.length; i++) {
      this.intermediateStopsArray.at(i).get('order')?.setValue(i + 1);
    }
  }

  private loadCooperative(): void {
    this.cooperative = this.loginService.getCooperativeFromLocalStorage();
    if (!this.cooperative) {
      this.alertService.showAlert({
        alertType: AlertType.WARNING,
        mainMessage: 'No se encontró información de la cooperativa',
        subMessage: 'Por favor, inicie sesión nuevamente'
      });
      this.router.navigate(['/login']);
    }
  }

  private loadBuses(): void {
    if (this.cooperative && this.cooperative.id) {
      this.isLoading = true;
      this.busesService.getBusesByCooperativeId(this.cooperative.id).subscribe({
        next: (buses) => {
          this.buses = buses;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading buses:', error);
          this.alertService.showAlert({
            alertType: AlertType.ERROR,
            mainMessage: 'Error al cargar los buses',
            subMessage: error.message
          });
          this.isLoading = false;
        }
      });
    }
  }

  private loadFrequencies(): void {
    this.isLoading = true;
    this.routesService.getAllFrequencies().subscribe({
      next: (frequencies) => {
        this.frequencies = frequencies;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading frequencies:', error);
        this.alertService.showAlert({
          alertType: AlertType.ERROR,
          mainMessage: 'Error al cargar las frecuencias',
          subMessage: error.message
        });
        this.isLoading = false;
      }
    });
  }

  private loadIntermediateStopsByFrequency(frequencyId: number): void {
    this.isLoading = true;
    this.intermediateStopService.getIntermediateStopsByFrequencyId(frequencyId).subscribe({
      next: (stops) => {
        this.intermediateStops = stops;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading intermediate stops:', error);
        this.alertService.showAlert({
          alertType: AlertType.ERROR,
          mainMessage: 'Error al cargar las paradas intermedias',
          subMessage: error.message
        });
        this.isLoading = false;
      }
    });
  }

  private loadRouteSheet(id: number): void {
    this.isLoading = true;
    this.routeSheetService.getRouteSheetById(id).subscribe({
      next: (routeSheet) => {
        // Actualizar el formulario con los datos de la hoja de ruta
        this.routeSheetForm.patchValue({
          basicInfo: {
            date: routeSheet.date,
            status: routeSheet.status
          },
          busAndFrequency: {
            busId: routeSheet.busId,
            frequencyId: routeSheet.frequencyId
          }
        });
        
        // Cargar las paradas intermedias asociadas a la frecuencia
        if (routeSheet.frequencyId) {
          this.selectedFrequencyId = routeSheet.frequencyId;
          this.loadIntermediateStopsByFrequency(routeSheet.frequencyId);
        }
        
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading route sheet:', error);
        this.alertService.showAlert({
          alertType: AlertType.ERROR,
          mainMessage: 'Error al cargar la hoja de ruta',
          subMessage: error.message
        });
        this.isLoading = false;
      }
    });
  }

  // Método para manejar el cambio de frecuencia seleccionada
  onFrequencyChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const frequencyId = +select.value;
    
    if (frequencyId) {
      this.selectedFrequencyId = frequencyId;
      this.loadIntermediateStopsByFrequency(frequencyId);
    }
  }

  protected onSubmit(): void {
    if (this.routeSheetForm.invalid) {
      this.alertService.showAlert({
        alertType: AlertType.WARNING,
        mainMessage: 'Formulario inválido',
        subMessage: 'Por favor, complete todos los campos requeridos'
      });
      return;
    }

    const formValue = this.routeSheetForm.value;
    const routeSheetData: IRouteSheetRequest = {
      date: formValue.basicInfo.date,
      busId: formValue.busAndFrequency.busId,
      frequencyId: formValue.busAndFrequency.frequencyId,
      status: formValue.basicInfo.status
    };

    this.isLoading = true;
    if (this.isEditMode && this.routeSheetId) {
      // Actualizar hoja de ruta existente
      this.routeSheetService.updateRouteSheet(this.routeSheetId, routeSheetData).subscribe({
        next: () => {
          this.alertService.showAlert({
            alertType: AlertType.SUCCESS,
            mainMessage: 'Hoja de ruta actualizada exitosamente',
            subMessage: 'La hoja de ruta ha sido actualizada correctamente'
          });
          this.isLoading = false;
          this.router.navigate(['/route-sheets']);
        },
        error: (error) => {
          console.error('Error updating route sheet:', error);
          this.alertService.showAlert({
            alertType: AlertType.ERROR,
            mainMessage: 'Error al actualizar la hoja de ruta',
            subMessage: error.message
          });
          this.isLoading = false;
        }
      });
    } else {
      // Crear nueva hoja de ruta
      this.routeSheetService.createRouteSheet(routeSheetData).subscribe({
        next: () => {
          this.alertService.showAlert({
            alertType: AlertType.SUCCESS,
            mainMessage: 'Hoja de ruta creada exitosamente',
            subMessage: 'La hoja de ruta ha sido creada correctamente'
          });
          this.isLoading = false;
          this.router.navigate(['/route-sheets']);
        },
        error: (error) => {
          console.error('Error creating route sheet:', error);
          this.alertService.showAlert({
            alertType: AlertType.ERROR,
            mainMessage: 'Error al crear la hoja de ruta',
            subMessage: error.message
          });
          this.isLoading = false;
        }
      });
    }
  }

  protected nextStep(): void {
    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
    }
  }

  protected previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  protected cancelEdit(): void {
    this.router.navigate(['/route-sheets']);
  }

  protected getStepClass(step: number): string {
    if (step === this.currentStep) {
      return 'active';
    } else if (step < this.currentStep) {
      return 'completed';
    } else {
      return '';
    }
  }
}

