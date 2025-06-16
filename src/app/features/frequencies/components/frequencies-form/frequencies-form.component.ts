import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { RoutesService } from '../../services/frequencies.service';
import { AlertService } from '@shared/services/alert.service';
import { AlertType } from '@utils/enums/alert-type.enum';
import { IFrequency, IFrequencyRequest } from '../../models/frequency.interface';
import { CitiesService } from '../../services/cities.service';
import { ICity } from '../../models/city.interface';

@Component({
  selector: 'app-route-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './frequencies-form.component.html',
  styleUrl: './frequencies-form.component.css',
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
  
  // Time selector properties
  protected hours: string[] = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
  protected minutes: string[] = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));
  protected selectedHour: string = '08';
  protected selectedMinute: string = '00';
  protected selectedAmPm: string = 'AM';

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
    } else {
      // Set default time for new frequencies
      this.updateTimeValue();
    }
  }

  // Time selector methods
  getHourFromTime(timeString: string): string {
    if (!timeString) return '08';
    
    let hour: number;
    
    if (timeString.includes(':')) {
      // Format: HH:MM or HH:MM:SS
      hour = parseInt(timeString.split(':')[0], 10);
    } else {
      return '08';
    }
    
    // Convert 24-hour format to 12-hour format
    if (hour === 0) {
      return '12'; // 00:00 -> 12 AM
    } else if (hour > 12) {
      return (hour - 12).toString().padStart(2, '0');
    } else {
      return hour.toString().padStart(2, '0');
    }
  }
  
  getMinuteFromTime(timeString: string): string {
    if (!timeString || !timeString.includes(':')) return '00';
    return timeString.split(':')[1].padStart(2, '0');
  }
  
  getAmPmFromTime(timeString: string): string {
    if (!timeString || !timeString.includes(':')) return 'AM';
    
    const hour = parseInt(timeString.split(':')[0], 10);
    return hour >= 12 ? 'PM' : 'AM';
  }
  
  updateTime(event: any, part: 'hour' | 'minute' | 'ampm'): void {
    const value = event.target.value;
    
    if (part === 'hour') {
      this.selectedHour = value;
    } else if (part === 'minute') {
      this.selectedMinute = value;
    } else if (part === 'ampm') {
      this.selectedAmPm = value;
    }
    
    this.updateTimeValue();
  }
  
  updateTimeValue(): void {
    let hour = parseInt(this.selectedHour, 10);
    
    // Convert to 24-hour format
    if (this.selectedAmPm === 'PM' && hour < 12) {
      hour += 12;
    } else if (this.selectedAmPm === 'AM' && hour === 12) {
      hour = 0;
    }
    
    // Format as HH:MM for the backend
    const timeString = `${hour.toString().padStart(2, '0')}:${this.selectedMinute}`;
    console.log('Setting time value:', timeString, 'from', this.selectedHour, this.selectedMinute, this.selectedAmPm);
    this.frequencyForm.patchValue({ departureTime: timeString });
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
        console.log('Loading frequency data:', frequency);
        // Convertir la hora a formato local para el input time
        let formattedTime = '';
        
        if (frequency.departureTime) {
          try {
            // Parse the ISO string to extract hours and minutes
            const date = new Date(frequency.departureTime);
            const hours = date.getUTCHours();
            const minutes = date.getUTCMinutes();
            formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
            console.log('Parsed time from ISO:', frequency.departureTime, 'to', formattedTime);
          } catch (error) {
            console.error('Error parsing time:', error);
            // If parsing fails, use the original value
            formattedTime = frequency.departureTime;
          }
        }
        
        this.frequencyForm.patchValue({
          originCityId: frequency.originCityId,
          destinationCityId: frequency.destinationCityId,
          departureTime: formattedTime,
          status: frequency.status,
        });
        
        // Set time selector values
        this.selectedHour = this.getHourFromTime(formattedTime);
        this.selectedMinute = this.getMinuteFromTime(formattedTime);
        this.selectedAmPm = this.getAmPmFromTime(formattedTime);
        console.log('Time selector values:', this.selectedHour, this.selectedMinute, this.selectedAmPm);
        
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
        this.router.navigate(['/frecuencias']);
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
    
    // Asegurarnos que departureTime esté en formato HH:MM como lo requiere el backend
    const departureTime = formData.departureTime;
    console.log('Submitting departure time:', departureTime);
    
    // Preparar el objeto exactamente como lo espera el backend
    const frequencyData = {
      cooperativeId: this.routesService.cooperativeId || 0,
      originCityId: Number(formData.originCityId),
      destinationCityId: Number(formData.destinationCityId),
      departureTime: departureTime,
      status: formData.status,
      antResolution: fileUrl || ''
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
          this.router.navigate(['/frecuencias']);
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
          this.router.navigate(['/frecuencias']);
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