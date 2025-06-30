import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { TicketsSaleService } from '../../services/tickets-sale.service';
import { ICity } from '../../models/cities.interface';
import {
  ISearchRequest,
  IFrequencyDetail,
} from '../../models/frequencie-detail.interface';
import { AlertService } from '@shared/services/alert.service';
import { AlertType } from '@utils/enums/alert-type.enum';

@Component({
  selector: 'app-step-one',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './step-one.component.html',
  styleUrl: './step-one.component.css',
})
export class StepOneComponent implements OnInit {
  @Output() searchCompleted = new EventEmitter<IFrequencyDetail[]>();
  @Output() frequencySelected = new EventEmitter<IFrequencyDetail>();

  searchForm: FormGroup;
  cities: ICity[] = [];
  isLoading = false;
  isSearching = false;
  searchResults: IFrequencyDetail[] = [];

  constructor(
    private fb: FormBuilder,
    private ticketsSaleService: TicketsSaleService,
    private alertService: AlertService
  ) {
    this.searchForm = this.fb.group({
      originCityId: ['', [Validators.required]],
      destinationCityId: ['', [Validators.required]],
      date: ['', [Validators.required]],
    });
  }

  ngOnInit(): void {
    this.loadCities();
    this.setMinDate();
  }

  loadCities(): void {
    this.isLoading = true;
    this.ticketsSaleService.getCities().subscribe({
      next: (cities) => {
        this.cities = cities.filter((city) => !city.isDeleted);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading cities:', error);
        this.alertService.showAlert({
          alertType: AlertType.ERROR,
          mainMessage: 'Error al cargar ciudades',
        });
        this.isLoading = false;
      },
    });
  }

  setMinDate(): void {
    const today = new Date();
    const minDate = today.toISOString().split('T')[0];
    this.searchForm.patchValue({ date: minDate });
  }

  onSearch(): void {
    if (this.searchForm.valid) {
      const searchRequest: ISearchRequest = this.searchForm.value;

      // Validar que las ciudades de origen y destino sean diferentes
      if (searchRequest.originCityId === searchRequest.destinationCityId) {
        this.alertService.showAlert({
          alertType: AlertType.WARNING,
          mainMessage: 'La ciudad de origen y destino deben ser diferentes',
        });
        return;
      }

      this.isSearching = true;
      this.ticketsSaleService.searchFrequencies(searchRequest).subscribe({
        next: (results: IFrequencyDetail[]) => {
          this.searchResults = results;
          this.searchCompleted.emit(results);
          this.isSearching = false;

          if (results.length === 0) {
            this.alertService.showAlert({
              alertType: AlertType.WARNING,
              mainMessage: 'No se encontraron viajes disponibles',
              subMessage: 'Intenta con otras fechas o ciudades',
            });
          }
        },
        error: (error: any) => {
          console.error('Error searching frequencies:', error);
          this.alertService.showAlert({
            alertType: AlertType.ERROR,
            mainMessage: 'Error al buscar viajes',
          });
          this.isSearching = false;
        },
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  onSelectFrequency(frequency: IFrequencyDetail): void {
    this.frequencySelected.emit(frequency);
  }

  private markFormGroupTouched(): void {
    Object.keys(this.searchForm.controls).forEach((key) => {
      const control = this.searchForm.get(key);
      control?.markAsTouched();
    });
  }

  getFieldError(fieldName: string): string {
    const field = this.searchForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        return 'Este campo es requerido';
      }
    }
    return '';
  }

  getCityName(cityId: number): string {
    const city = this.cities.find((c) => c.id === cityId);
    return city ? city.name : '';
  }
}
