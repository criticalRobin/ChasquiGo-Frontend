import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { IBuses } from '../../models/buses.interface';
import { BusesService } from '../../services/buses.service';
import { CooperativeService } from '../../services/cooperative.service';
import { Bus } from '../../models/bus.model';

interface Cooperative {
  id: number;
  name: string;
}

@Component({
  selector: 'app-form-buses',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './form-buses.component.html',
  styleUrl: './form-buses.component.css'
})
export class FormBusesComponent implements OnInit {
  @Output() formSubmitted = new EventEmitter<Bus>();
  @Input() cachedBusData: Bus | null = null;
  
  busForm: FormGroup;
  isEditing = false;
  busId: string | null = null;
  photos: string[] = [];
  cooperatives: Cooperative[] = [];

  constructor(
    private fb: FormBuilder,
    private busesService: BusesService,
    private router: Router,
    private route: ActivatedRoute,
    private cooperativeService: CooperativeService
  ) {    this.busForm = this.fb.group({
      cooperativeId: [null, Validators.required],
      licensePlate: ['', [Validators.required, Validators.pattern(/^[A-Z]{3}-[0-9]{3}$/)]],
      chassisBrand: ['', Validators.required],
      bodyworkBrand: ['', Validators.required],
      capacity: [0, [Validators.required, Validators.min(1)]],
      stoppageDays: [0, [Validators.required, Validators.min(0)]],
      floorCount: [1, Validators.required],
      busTypeId: [1, Validators.required] // Valor por defecto 1, ajustar según las opciones disponibles
    });
  }
  ngOnInit(): void {
    this.loadCooperatives();
    
    // If we have cached bus data, populate the form with it
    if (this.cachedBusData) {
      this.busForm.patchValue({
        cooperativeId: this.cachedBusData.cooperativeId,
        licensePlate: this.cachedBusData.licensePlate,
        chassisBrand: this.cachedBusData.chassisBrand,
        bodyworkBrand: this.cachedBusData.bodyworkBrand,
        capacity: this.cachedBusData.capacity,
        stoppageDays: this.cachedBusData.stoppageDays,
        floorCount: this.cachedBusData.floorCount
      });
      
      if (this.cachedBusData.photos) {
        this.photos = [...this.cachedBusData.photos];
      }
    } else {
      // Check for bus ID in route params for editing mode
      this.route.params.subscribe(params => {
        if (params['id']) {
          this.busId = params['id'];
          this.isEditing = true;
          if (this.busId !== null) {
            this.loadBusData(this.busId);
          }
        }
      });
    }
  }

  loadCooperatives(): void {
    this.cooperativeService.getCooperatives().subscribe({
      next: (data) => {
        this.cooperatives = data;
      },
      error: (error) => {
        console.error('Error al cargar cooperativas:', error);
      }
    });
  }

  loadBusData(id: string): void {
    this.busesService.getBusById(id).subscribe({
      next: (bus: IBuses) => {
        this.busForm.patchValue({
          cooperativeId: bus.cooperativeId,
          licensePlate: bus.licensePlate,
          chassisBrand: bus.chassisBrand,
          bodyworkBrand: bus.bodyworkBrand,
          capacity: bus.capacity,
          stoppageDays: bus.stoppageDays,
          floorCount: bus.floorCount
        });
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
    if (this.busForm.valid) {
      const busData: Bus = {
        ...this.busForm.value,
        photos: this.photos,
        seats: []
      };
      this.formSubmitted.emit(busData);
    }
  }

  cancel(): void {
    this.router.navigate(['/buses']);
  }
}
