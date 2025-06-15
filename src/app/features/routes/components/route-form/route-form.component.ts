import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { RoutesService } from '../../services/routes.service';
import { AlertService } from '@shared/services/alert.service';
import { AlertType } from '@utils/enums/alert-type.enum';
import { IFrequency, IFrequencyRequest } from '../../models/frequency.interface';
import { CitiesService } from '../../services/cities.service';
import { ICity } from '../../models/city.interface';

@Component({
  selector: 'app-route-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './route-form.component.html',
  styleUrl: './route-form.component.css',
})
export class RouteFormComponent implements OnInit {
  private readonly fb: FormBuilder = inject(FormBuilder);
  private readonly routesService: RoutesService = inject(RoutesService);
  private readonly citiesService: CitiesService = inject(CitiesService);
  private readonly alertService: AlertService = inject(AlertService);
  private readonly router: Router = inject(Router);
  private readonly route: ActivatedRoute = inject(ActivatedRoute);

  protected frequencyForm: FormGroup;
  protected isEditMode: boolean = false;
  protected frequencyId: number | null = null;
  protected isLoading: boolean = false;
  protected pageTitle: string = 'Crear Nueva Frecuencia';
  protected cities: ICity[] = [];
  protected selectedFile: File | null = null;
  protected uploadedFileUrl: string | null = null;

  constructor() {
    this.frequencyForm = this.fb.group({
      originCityId: ['', [Validators.required]],
      destinationCityId: ['', [Validators.required]],
      departureTime: ['', [Validators.required]],
      status: ['Activo', [Validators.required]],
      antResolution: ['', [Validators.required]],
    });
  }

  ngOnInit(): void {
    this.loadCities();
    
    const id = this.route.snapshot.paramMap.get('id');
    
    if (id) {
      this.isEditMode = true;
      this.frequencyId = +id;
      this.pageTitle = 'Editar Frecuencia';
      this.loadFrequencyData(this.frequencyId);
    }
  }

  loadCities(): void {
    this.isLoading = true;
    
    this.citiesService.getAllCities().subscribe({
      next: (cities: ICity[]) => {
        this.cities = cities;
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        this.alertService.showAlert({
          alertType: AlertType.ERROR,
          mainMessage: 'Error al cargar ciudades',
          subMessage: error.message,
        });
      },
    });
  }

  loadFrequencyData(id: number): void {
    this.isLoading = true;
    
    this.routesService.getFrequencyById(id).subscribe({
      next: (frequency: IFrequency) => {
        // Convertir la hora a formato local para el input time
        const departureDate = new Date(frequency.departureTime);
        const hours = departureDate.getHours().toString().padStart(2, '0');
        const minutes = departureDate.getMinutes().toString().padStart(2, '0');
        const formattedTime = `${hours}:${minutes}`;
        
        this.frequencyForm.patchValue({
          originCityId: frequency.originCityId,
          destinationCityId: frequency.destinationCityId,
          departureTime: formattedTime,
          status: frequency.status,
          antResolution: frequency.antResolution,
        });
        
        this.uploadedFileUrl = frequency.antResolution;
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        this.alertService.showAlert({
          alertType: AlertType.ERROR,
          mainMessage: 'Error al cargar datos de la frecuencia',
          subMessage: error.message,
        });
        this.router.navigate(['/rutas']);
      },
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      this.selectedFile = file;
    } else {
      this.alertService.showAlert({
        alertType: AlertType.ERROR,
        mainMessage: 'Formato de archivo inválido',
        subMessage: 'Por favor, seleccione un archivo PDF',
      });
    }
  }

  async uploadFile(): Promise<string | null> {
    if (!this.selectedFile) {
      // Si no hay archivo seleccionado y estamos en modo edición, usamos el URL existente
      if (this.isEditMode && this.uploadedFileUrl) {
        return this.uploadedFileUrl;
      }
      
      this.alertService.showAlert({
        alertType: AlertType.ERROR,
        mainMessage: 'Archivo requerido',
        subMessage: 'Por favor, seleccione un archivo PDF con la resolución ANT',
      });
      return null;
    }

    try {
      this.isLoading = true;
      const response = await this.routesService.uploadPdfFile(this.selectedFile).toPromise();
      return response.url;
    } catch (error: any) {
      this.alertService.showAlert({
        alertType: AlertType.ERROR,
        mainMessage: 'Error al subir archivo',
        subMessage: error.message,
      });
      return null;
    } finally {
      this.isLoading = false;
    }
  }

  async onSubmit(): Promise<void> {
    if (this.frequencyForm.invalid) {
      this.frequencyForm.markAllAsTouched();
      return;
    }

    // Primero subimos el archivo si hay uno seleccionado
    const fileUrl = await this.uploadFile();
    if (fileUrl === null && !this.isEditMode) {
      return; // Si no hay URL de archivo y no estamos en modo edición, detenemos el proceso
    }

    // Preparar los datos de la frecuencia
    const formData = this.frequencyForm.value;
    
    // Convertir la hora del formulario a formato ISO
    const [hours, minutes] = formData.departureTime.split(':');
    const departureDate = new Date();
    departureDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
    
    const frequencyData: IFrequencyRequest = {
      ...formData,
      departureTime: departureDate.toISOString(),
      antResolution: fileUrl || this.uploadedFileUrl || '',
    };

    this.isLoading = true;
    
    if (this.isEditMode && this.frequencyId) {
      this.routesService.updateFrequency(this.frequencyId, frequencyData).subscribe({
        next: () => {
          this.isLoading = false;
          this.alertService.showAlert({
            alertType: AlertType.SUCCESS,
            mainMessage: 'Frecuencia actualizada',
            subMessage: 'La frecuencia ha sido actualizada exitosamente',
          });
          this.router.navigate(['/rutas']);
        },
        error: (error) => {
          this.isLoading = false;
          this.alertService.showAlert({
            alertType: AlertType.ERROR,
            mainMessage: 'Error al actualizar frecuencia',
            subMessage: error.message,
          });
        },
      });
    } else {
      this.routesService.createFrequency(frequencyData).subscribe({
        next: () => {
          this.isLoading = false;
          this.alertService.showAlert({
            alertType: AlertType.SUCCESS,
            mainMessage: 'Frecuencia creada',
            subMessage: 'La frecuencia ha sido creada exitosamente',
          });
          this.router.navigate(['/rutas']);
        },
        error: (error) => {
          this.isLoading = false;
          this.alertService.showAlert({
            alertType: AlertType.ERROR,
            mainMessage: 'Error al crear frecuencia',
            subMessage: error.message,
          });
        },
      });
    }
  }
} 