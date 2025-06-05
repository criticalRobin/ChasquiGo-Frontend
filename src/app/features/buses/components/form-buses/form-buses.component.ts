import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { IBuses } from '../../models/buses.interface';
import { BusesService } from '../../services/buses.service';

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
  busForm!: FormGroup;
  isEditing = false;
  busId: string | null = null;
  photos: string[] = [];
  cooperatives: Cooperative[] = [];

  constructor(
    private fb: FormBuilder,
    private busesService: BusesService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.loadCooperatives();
    
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

  initForm(): void {
    this.busForm = this.fb.group({
      cooperativeId: [null, Validators.required],
      licensePlate: ['', Validators.required],
      chassisBrand: ['', Validators.required],
      bodyworkBrand: ['', Validators.required],
      capacity: [40, [Validators.required, Validators.min(1)]],
      stoppageDays: [1, [Validators.required, Validators.min(0)]],
      floorCount: [1, Validators.required],
      photoUrl: ['']
    });
  }

  loadCooperatives(): void {
    // Aquí cargarías las cooperativas desde tu servicio
    // Por ahora usaremos datos de ejemplo
    this.cooperatives = [
      { id: 1, name: 'Cooperativa A' },
      { id: 2, name: 'Cooperativa B' },
      { id: 3, name: 'Cooperativa C' }
    ];
  }

  loadBusData(id: string): void {
    // Aquí cargarías los datos del bus para editar
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

  addPhoto(): void {
    const photoUrl = this.busForm.get('photoUrl')?.value;
    if (photoUrl && photoUrl.trim() !== '') {
      this.photos.push(photoUrl);
      this.busForm.get('photoUrl')?.setValue('');
    }
  }

  removePhoto(index: number): void {
    this.photos.splice(index, 1);
  }

  onSubmit(): void {
    if (this.busForm.invalid) {
      return;
    }

    const busData: IBuses = {
      ...this.busForm.value,
      photos: this.photos,
      seats: [] // No incluimos asientos en este formulario
    };

    if (this.isEditing && this.busId) {
      this.busesService.updateBus(this.busId, busData).subscribe({
        next: () => {
          this.router.navigate(['/buses']);
        },
        error: (error) => {
          console.error('Error al actualizar el bus', error);
        }
      });
    } else {
      this.busesService.createBus(busData).subscribe({
        next: () => {
          this.router.navigate(['/buses']);
        },
        error: (error) => {
          console.error('Error al crear el bus', error);
        }
      });
    }
  }

  cancel(): void {
    this.router.navigate(['/buses']);
  }
}
