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
      antResolution: [''],  // Quitamos el validador requerido ya que lo manejaremos manualmente
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

  uploadFile(): Promise<string | null> {
    return new Promise((resolve, reject) => {
      if (!this.selectedFile) {
        // Si no hay archivo seleccionado y estamos en modo edición, usamos el URL existente
        if (this.isEditMode && this.uploadedFileUrl) {
          resolve(this.uploadedFileUrl);
          return;
        }
        
        // Si estamos creando una nueva frecuencia, necesitamos un archivo
        if (!this.isEditMode) {
          this.alertService.showAlert({
            alertType: AlertType.ERROR,
            mainMessage: 'Archivo requerido',
            subMessage: 'Por favor, seleccione un archivo PDF con la resolución ANT',
          });
          resolve(null);
          return;
        }
      }

      // Si llegamos aquí, tenemos un archivo para subir
      if (this.selectedFile) {
        this.isLoading = true;
        const formData = new FormData();
        formData.append('file', this.selectedFile);
        
        this.routesService.uploadPdfFile(formData).subscribe({
          next: (response) => {
            this.isLoading = false;
            if (response && response.url) {
              resolve(response.url);
            } else {
              this.alertService.showAlert({
                alertType: AlertType.ERROR,
                mainMessage: 'Error al subir archivo',
                subMessage: 'No se recibió una URL válida del servidor',
              });
              resolve(null);
            }
          },
          error: (error) => {
            this.isLoading = false;
            this.alertService.showAlert({
              alertType: AlertType.ERROR,
              mainMessage: 'Error al subir archivo',
              subMessage: error.message,
            });
            resolve(null);
          }
        });
      } else {
        resolve(null);
      }
    });
  }

  async onSubmit(): Promise<void> {
    if (this.frequencyForm.invalid) {
      this.frequencyForm.markAllAsTouched();
      return;
    }

    // Validar que tengamos un archivo o una URL existente
    if (!this.selectedFile && !this.uploadedFileUrl && !this.isEditMode) {
      this.alertService.showAlert({
        alertType: AlertType.ERROR,
        mainMessage: 'Archivo requerido',
        subMessage: 'Por favor, seleccione un archivo PDF con la resolución ANT',
      });
      return;
    }

    // Primero subimos el archivo si hay uno seleccionado
    this.isLoading = true;
    let fileUrl: string | null = null;
    
    if (this.selectedFile) {
      fileUrl = await this.uploadFile();
      if (!fileUrl && !this.isEditMode) {
        this.isLoading = false;
        return; // Si no hay URL de archivo y no estamos en modo edición, detenemos el proceso
      }
    } else if (this.uploadedFileUrl) {
      fileUrl = this.uploadedFileUrl;
    }

    // Preparar los datos de la frecuencia
    const formData = this.frequencyForm.value;
    
    // Usamos directamente el valor del formulario para departureTime (HH:MM)
    // El backend espera un formato HH:MM según el DTO
    const departureTime = formData.departureTime;
    
    const frequencyData: IFrequencyRequest = {
      originCityId: Number(formData.originCityId),
      destinationCityId: Number(formData.destinationCityId),
      departureTime: departureTime, // Formato HH:MM como lo requiere el backend
      status: formData.status,
      antResolution: fileUrl || '',
      cooperativeId: this.routesService.cooperativeId || 0
    };

    console.log('Enviando datos de frecuencia:', frequencyData);

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
          console.error('Error al actualizar frecuencia:', error);
          this.alertService.showAlert({
            alertType: AlertType.ERROR,
            mainMessage: 'Error al actualizar frecuencia',
            subMessage: error.message || JSON.stringify(error),
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
          console.error('Error al crear frecuencia:', error);
          this.alertService.showAlert({
            alertType: AlertType.ERROR,
            mainMessage: 'Error al crear frecuencia',
            subMessage: error.message || JSON.stringify(error),
          });
        },
      });
    }
  }
} 