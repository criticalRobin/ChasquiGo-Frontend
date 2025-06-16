import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { RouteSheetService } from '../../services/route-sheet.service';
import { AlertService } from '@shared/services/alert.service';
import { AlertType } from '@utils/enums/alert-type.enum';
import { IRouteSheetRequest } from '../../models/route-sheet.interface';
import { BusesService } from '@features/buses/services/buses.service';
import { RoutesService } from '@features/frequencies/services/frequencies.service';
import { IBuses } from '@features/buses/models/buses.interface';
import { IFrequency } from '@features/frequencies/models/frequency.interface';
import { LoginService } from '@core/login/services/login.service';
import { ICooperative } from '@features/coops/models/cooperative.interface';

@Component({
  selector: 'app-create-update-route-sheet',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './create-update-route-sheet.component.html',
  styleUrl: './create-update-route-sheet.component.css',
})
export class CreateUpdateRouteSheetComponent implements OnInit {
  private readonly routeSheetService: RouteSheetService = inject(RouteSheetService);
  private readonly busesService: BusesService = inject(BusesService);
  private readonly routesService: RoutesService = inject(RoutesService);
  private readonly alertService: AlertService = inject(AlertService);
  private readonly loginService: LoginService = inject(LoginService);
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

  constructor() {
    this.routeSheetForm = this.fb.group({
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      frequencyIds: [[], Validators.required],
      busIds: [[], Validators.required],
      status: ['Activo', Validators.required]
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

  protected onSubmit(): void {
    if (this.routeSheetForm.valid) {
      const routeSheetData: IRouteSheetRequest = this.routeSheetForm.value;
      
      if (this.isEditMode) {
        const id = this.route.snapshot.params['id'];
        this.updateRouteSheet(id, routeSheetData);
      } else {
        this.createRouteSheet(routeSheetData);
      }
    }
  }

  private createRouteSheet(routeSheetData: IRouteSheetRequest): void {
    this.isLoading = true;
    this.routeSheetService.createRouteSheet(routeSheetData).subscribe({
      next: () => {
        this.alertService.showAlert({
          alertType: AlertType.SUCCESS,
          mainMessage: 'Hoja de ruta creada exitosamente',
          subMessage: 'La hoja de ruta ha sido creada correctamente',
        });
        this.router.navigate(['/hojas-ruta']);
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

  private updateRouteSheet(id: number, routeSheetData: IRouteSheetRequest): void {
    this.isLoading = true;
    this.routeSheetService.updateRouteSheet(id, routeSheetData).subscribe({
      next: () => {
        this.alertService.showAlert({
          alertType: AlertType.SUCCESS,
          mainMessage: 'Hoja de ruta actualizada exitosamente',
          subMessage: 'La hoja de ruta ha sido actualizada correctamente',
        });
        this.router.navigate(['/hojas-ruta']);
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
