import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule, FormControl, AbstractControl } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { RouteSheetService } from '../../services/route-sheet.service';
import { AlertService } from '@shared/services/alert.service';
import { AlertType } from '@utils/enums/alert-type.enum';
import { IRouteSheetHeader, IRouteSheetDetail, IRouteSheetRequest, RouteSheetStatus } from '../../models/route-sheet.interface';
import { LoginService } from '@core/login/services/login.service';
import { ICooperative } from '@features/coops/models/cooperative.interface';
import { BusesService } from '@features/buses/services/buses.service';
import { RoutesService } from '@features/frequencies/services/frequencies.service';
import { IFrequency } from '@features/frequencies/models/frequency.interface';

@Component({
  selector: 'app-create-update-route-sheet',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    FormsModule, 
    RouterModule
  ],
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

  protected routeSheetForm!: FormGroup;
  protected isLoading: boolean = false;
  protected isEditMode: boolean = false;
  protected routeSheetId: number | null = null;
  protected cooperative: ICooperative | null = null;
  protected buses: any[] = [];
  protected frequencies: IFrequency[] = [];
  protected statusOptions: RouteSheetStatus[] = ['ACTIVE', 'INACTIVE'];
  
  // Variables para el formulario de múltiples pasos
  protected currentStep: number = 1;
  protected totalSteps: number = 2;
  protected selectedFrequencyId: number | null = null;
  protected stepTitles: string[] = ['Información Básica', 'Detalles de la Hoja de Ruta'];
  
  // Mapa para almacenar detalles de la hoja de ruta
  protected routeSheetDetails: IRouteSheetDetail[] = [];

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
      startDate: ['', Validators.required],
      status: ['ACTIVE' as RouteSheetStatus, Validators.required],
      
      // Paso 2: Detalles (se llenará dinámicamente)
      details: this.fb.array([])
    });
  }

  // Getter para acceder al FormArray de detalles
  get detailsArray(): FormArray<FormGroup> {
    return this.routeSheetForm.get('details') as FormArray<FormGroup>;
  }

  // Método para añadir un nuevo detalle al FormArray
  addDetail(): void {
    const detailGroup = this.fb.group({
      frequencyId: ['', Validators.required],
      busId: ['', Validators.required],
      status: ['ACTIVE' as RouteSheetStatus, Validators.required]
    });
    
    this.detailsArray.push(detailGroup);
  }

  // Método para eliminar un detalle del FormArray
  removeDetail(index: number): void {
    this.detailsArray.removeAt(index);
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
    if (this.cooperative?.id) {
      this.isLoading = true;
      this.busesService.getBuses().subscribe({
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

  // Este método se eliminó ya que no se está utilizando en el componente actual

  private loadRouteSheet(routeSheetId: number): void {
    this.isLoading = true;
    this.routeSheetService.getRouteSheetById(routeSheetId).subscribe({
      next: (routeSheet) => {
        // Parchear el formulario con los datos de la hoja de ruta
        this.routeSheetForm.patchValue({
          startDate: routeSheet.startDate,
          status: routeSheet.status
        });

        // Cargar los detalles de la hoja de ruta
        if (routeSheet.routeSheetDetails && routeSheet.routeSheetDetails.length > 0) {
          this.patchDetails(routeSheet.routeSheetDetails);
        }

        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar la hoja de ruta:', error);
        this.alertService.showAlert({
          alertType: AlertType.ERROR,
          mainMessage: 'Error al cargar la hoja de ruta',
          subMessage: 'No se pudo cargar la información de la hoja de ruta'
        });
        this.router.navigate(['/route-sheets']);
      }
    });
  }
  
  private patchDetails(details: IRouteSheetDetail[]): void {
    // Limpiar el array de detalles
    while (this.detailsArray.length) {
      this.detailsArray.removeAt(0);
    }

    // Agregar cada detalle al formulario
    details.forEach(detail => {
      const detailGroup = this.fb.group({
        id: [detail.id],
        frequencyId: [detail.frequencyId, Validators.required],
        busId: [detail.busId, Validators.required],
        status: [detail.status, Validators.required]
      });
      this.detailsArray.push(detailGroup);
    });
  }

  // Método para obtener el nombre de la frecuencia
  getFrequencyName(frequencyId: number): string {
    const frequency = this.frequencies.find(f => f.id === frequencyId);
    if (frequency) {
      return `${frequency.originCity?.name || 'Origen'} - ${frequency.destinationCity?.name || 'Destino'}`;
    }
    return 'Frecuencia no encontrada';
  }
  
  // Método para obtener la placa del bus
  getBusPlate(busId: number): string {
    const bus = this.buses.find(b => b.id === busId);
    return bus?.plate || 'Placa no disponible';
  }
  
  // Método para formatear el estado
  formatStatus(status: RouteSheetStatus): string {
    return status === 'ACTIVE' ? 'Activo' : 'Inactivo';
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
      cooperativeId: this.cooperative?.id || 0,
      startDate: new Date(formValue.startDate).toISOString(),
      details: formValue.details.map((detail: any) => ({
        frequencyId: detail.frequencyId,
        busId: detail.busId,
        status: detail.status
      }))
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

