import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { IBuses, IBusSeat } from '../../models/buses.interface';
import { BusesService } from '../../services/buses.service';
import { CooperativeService } from '../../services/cooperative.service';
import { Bus } from '../../models/bus.model';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

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
  @Output() formSubmitted = new EventEmitter<IBuses>();
  @Input() cachedBusData: IBuses | null = null;
  @Input() isEditMode: boolean = false;
  
  busForm: FormGroup;
  isEditing = false;
  busId: number | null = null;
  photos: string[] = [];
  cooperatives: Cooperative[] = [];
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private busesService: BusesService,
    private router: Router,
    private route: ActivatedRoute,
    private cooperativeService: CooperativeService
  ) {
    this.busForm = this.fb.group({
      cooperativeId: ['', Validators.required],
      licensePlate: ['', Validators.required],
      chassisBrand: ['', Validators.required],
      bodyworkBrand: ['', Validators.required],
      stoppageDays: [0, Validators.required],
      busTypeId: [1, Validators.required],
      capacity: [20, [Validators.required, Validators.min(1)]],
      floorCount: [1, [Validators.required, Validators.min(1), Validators.max(2)]]
    });
  }

  ngOnInit(): void {
    this.loadCooperatives();
    
    if (this.cachedBusData) {
      this.busForm.patchValue(this.cachedBusData);
      if (this.cachedBusData.photos) {
        this.photos = [...this.cachedBusData.photos];
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

  loadBusData(id: number): void {
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
      const busData: IBuses = {
        ...this.busForm.value,
        photos: this.photos,
        seats: this.generateDefaultSeats(
          this.busForm.value.capacity,
          this.busForm.value.floorCount
        )
      };
      this.formSubmitted.emit(busData);
    }
  }

  private generateDefaultSeats(capacity: number, floorCount: number): IBusSeat[] {
    const seats: IBusSeat[] = [];
    const seatsPerFloor = capacity; // Capacidad por piso
    
    // Generar asientos para cada piso
    for (let floor = 1; floor <= floorCount; floor++) {
      for (let i = 1; i <= seatsPerFloor; i++) {
        const seatNumber = (floor - 1) * seatsPerFloor + i;
        seats.push({
          number: seatNumber.toString(),
          type: 'NORMAL',
          location: i % 2 === 0 ? 'pasillo' : 'ventana',
          floor
        });
      }
    }
    return seats;
  }

  cancel(): void {
    this.router.navigate(['/buses']);
  }
}
