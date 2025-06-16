import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RouteSheetService } from '../../services/route-sheet.service';
import { AlertService } from '@shared/services/alert.service';
import { AlertType } from '@utils/enums/alert-type.enum';
import { IRouteSheet, IRouteSheetRequest } from '../../models/route-sheet.interface';
import { BusesService } from '@features/buses/services/buses.service';
import { RoutesService } from '@features/frequencies/services/frequencies.service';
import { IBuses } from '@features/buses/models/buses.interface';
import { IFrequency } from '@features/frequencies/models/frequency.interface';
import { LoginService } from '@core/login/services/login.service';
import { ICooperative } from '@features/coops/models/cooperative.interface';
import { IntermediateStopService } from '../../services/intermediate-stop.service';
import { IIntermediateStopRequest } from '../../models/intermediate-stop.interface';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-create-update-route-sheet',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, FormsModule],
  templateUrl: './create-update-route-sheet.component.html',
  styleUrl: './create-update-route-sheet.component.css',
})
export class CreateUpdateRouteSheetComponent implements OnInit {
  private readonly routeSheetService: RouteSheetService = inject(RouteSheetService);
  private readonly busesService: BusesService = inject(BusesService);
  private readonly routesService: RoutesService = inject(RoutesService);
  private readonly alertService: AlertService = inject(AlertService);
  private readonly loginService: LoginService = inject(LoginService);
  private readonly intermediateStopService: IntermediateStopService = inject(IntermediateStopService);
  private readonly fb: FormBuilder = inject(FormBuilder);
  private readonly route: ActivatedRoute = inject(ActivatedRoute);
  private readonly router: Router = inject(Router);

  protected routeSheetForm: FormGroup;
  protected isEditMode: boolean = false;
  protected isLoading: boolean = false;
  protected buses: IBuses[] = [];
  protected frequencies: IFrequency[] = [];
  protected statusOptions = ['Activo', 'Pendiente', 'Completado', 'Cancelado'];
  protected cooperative: ICooperative | null = null;
  protected currentStep: number = 1;
  protected totalSteps: number = 2;
  protected selectedFrequencyId: number | null = null;

  constructor() {
    this.routeSheetForm = this.fb.group({
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      frequencyIds: [[], Validators.required],
      busIds: [[], Validators.required],
      status: ['Activo', Validators.required],
      intermediateStops: this.fb.array([])
    });
  }

  ngOnInit(): void {
    // Cargar información de la cooperativa
    this.cooperative = this.loginService.getCooperativeFromLocalStorage();
    
    const id = this.route.snapshot.params['id'];
    this.isEditMode = !!id;

    this.loadBuses();
    this.loadFrequencies();

    if (this.isEditMode) {
      this.loadRouteSheet(id);
    }
  }

  // Getter para acceder al FormArray de paradas intermedias
  get intermediateStopsArray(): FormArray {
    return this.routeSheetForm.get('intermediateStops') as FormArray;
  }

  // Método para añadir una nueva parada intermedia al FormArray
  addIntermediateStop(): void {
    this.intermediateStopsArray.push(
      this.fb.group({
        name: ['', Validators.required],
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

  // Método para avanzar al siguiente paso
  nextStep(): void {
    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
      
      // Si estamos en el paso de paradas intermedias y hay frecuencias seleccionadas
      if (this.currentStep === 2) {
        const frequencyIds = this.routeSheetForm.get('frequencyIds')?.value;
        if (frequencyIds && frequencyIds.length > 0) {
          this.selectedFrequencyId = frequencyIds[0];
        }
      }
    }
  }

  // Método para volver al paso anterior
  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  private loadBuses(): void {
    if (this.cooperative && this.cooperative.id) {
      this.busesService.getBusesByCooperativeId(this.cooperative.id).subscribe({
        next: (buses) => {
          this.buses = buses;
        },
        error: (error) => {
          console.error('Error loading buses:', error);
          this.alertService.showAlert({
            alertType: AlertType.ERROR,
            mainMessage: 'Error al cargar los buses',
            subMessage: error.message,
          });
        }
      });
    } else {
      this.alertService.showAlert({
        alertType: AlertType.ERROR,
        mainMessage: 'Error al cargar los buses',
        subMessage: 'No se encontró información de la cooperativa',
      });
    }
  }

  private loadFrequencies(): void {
    this.routesService.getAllFrequencies().subscribe({
      next: (frequencies) => {
        this.frequencies = frequencies;
      },
      error: (error) => {
        console.error('Error loading frequencies:', error);
        this.alertService.showAlert({
          alertType: AlertType.ERROR,
          mainMessage: 'Error al cargar las frecuencias',
          subMessage: error.message,
        });
      }
    });
  }

  private loadRouteSheet(id: number): void {
    this.isLoading = true;
    this.routeSheetService.getRouteSheetById(id).subscribe({
      next: (routeSheet) => {
        this.routeSheetForm.patchValue({
          startDate: routeSheet.startDate,
          endDate: routeSheet.endDate,
          frequencyIds: routeSheet.frequencyIds,
          busIds: routeSheet.busIds,
          status: routeSheet.status
        });
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading route sheet:', error);
        this.alertService.showAlert({
          alertType: AlertType.ERROR,
          mainMessage: 'Error al cargar la hoja de ruta',
          subMessage: error.message,
        });
        this.isLoading = false;
      }
    });
  }

  // Método para manejar el cambio de frecuencia seleccionada
  onFrequencyChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    if (select.value) {
      this.selectedFrequencyId = Number(select.value);
    }
  }

  protected onSubmit(): void {
    if (this.routeSheetForm.valid) {
      const routeSheetData: IRouteSheetRequest = {
        cooperativeId: this.cooperative?.id || 0,
        startDate: this.routeSheetForm.get('startDate')?.value,
        endDate: this.routeSheetForm.get('endDate')?.value,
        frequencyIds: this.routeSheetForm.get('frequencyIds')?.value,
        busIds: this.routeSheetForm.get('busIds')?.value,
        status: this.routeSheetForm.get('status')?.value
      };
      
      const intermediateStops: IIntermediateStopRequest[] = this.intermediateStopsArray.value;
      
      if (this.isEditMode) {
        const id = this.route.snapshot.params['id'];
        this.updateRouteSheet(id, routeSheetData, intermediateStops);
      } else {
        this.createRouteSheet(routeSheetData, intermediateStops);
      }
    } else {
      // Marcar todos los campos como tocados para mostrar los errores
      this.markFormGroupTouched(this.routeSheetForm);
    }
  }

  // Método para marcar todos los campos del formulario como tocados
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  private createRouteSheet(routeSheetData: IRouteSheetRequest, intermediateStops: IIntermediateStopRequest[]): void {
    this.isLoading = true;
    this.routeSheetService.createRouteSheet(routeSheetData).subscribe({
      next: (createdRouteSheet) => {
        if (intermediateStops.length > 0) {
          // Crear las paradas intermedias
          const createStopsRequests = intermediateStops.map(stop => 
            this.intermediateStopService.createIntermediateStop(stop)
          );
          
          forkJoin(createStopsRequests).subscribe({
            next: () => {
              this.alertService.showAlert({
                alertType: AlertType.SUCCESS,
                mainMessage: 'Hoja de ruta creada exitosamente',
                subMessage: 'La hoja de ruta y sus paradas intermedias han sido creadas correctamente',
              });
              this.router.navigate(['/hojas-ruta']);
            },
            error: (error) => {
              console.error('Error creating intermediate stops:', error);
              this.alertService.showAlert({
                alertType: AlertType.WARNING,
                mainMessage: 'Hoja de ruta creada parcialmente',
                subMessage: 'La hoja de ruta se creó, pero hubo un error al crear las paradas intermedias',
              });
              this.router.navigate(['/hojas-ruta']);
            }
          });
        } else {
          this.alertService.showAlert({
            alertType: AlertType.SUCCESS,
            mainMessage: 'Hoja de ruta creada exitosamente',
            subMessage: 'La hoja de ruta ha sido creada correctamente',
          });
          this.router.navigate(['/hojas-ruta']);
        }
      },
      error: (error) => {
        console.error('Error creating route sheet:', error);
        this.alertService.showAlert({
          alertType: AlertType.ERROR,
          mainMessage: 'Error al crear la hoja de ruta',
          subMessage: error.message,
        });
        this.isLoading = false;
      }
    });
  }

  private updateRouteSheet(id: number, routeSheetData: IRouteSheetRequest, intermediateStops: IIntermediateStopRequest[]): void {
    this.isLoading = true;
    this.routeSheetService.updateRouteSheet(id, routeSheetData).subscribe({
      next: () => {
        if (intermediateStops.length > 0) {
          // Crear las paradas intermedias
          const createStopsRequests = intermediateStops.map(stop => 
            this.intermediateStopService.createIntermediateStop(stop)
          );
          
          forkJoin(createStopsRequests).subscribe({
            next: () => {
              this.alertService.showAlert({
                alertType: AlertType.SUCCESS,
                mainMessage: 'Hoja de ruta actualizada exitosamente',
                subMessage: 'La hoja de ruta y sus paradas intermedias han sido actualizadas correctamente',
              });
              this.router.navigate(['/hojas-ruta']);
            },
            error: (error) => {
              console.error('Error creating intermediate stops:', error);
              this.alertService.showAlert({
                alertType: AlertType.WARNING,
                mainMessage: 'Hoja de ruta actualizada parcialmente',
                subMessage: 'La hoja de ruta se actualizó, pero hubo un error al crear las paradas intermedias',
              });
              this.router.navigate(['/hojas-ruta']);
            }
          });
        } else {
          this.alertService.showAlert({
            alertType: AlertType.SUCCESS,
            mainMessage: 'Hoja de ruta actualizada exitosamente',
            subMessage: 'La hoja de ruta ha sido actualizada correctamente',
          });
          this.router.navigate(['/hojas-ruta']);
        }
      },
      error: (error) => {
        console.error('Error updating route sheet:', error);
        this.alertService.showAlert({
          alertType: AlertType.ERROR,
          mainMessage: 'Error al actualizar la hoja de ruta',
          subMessage: error.message,
        });
        this.isLoading = false;
      }
    });
  }
}

