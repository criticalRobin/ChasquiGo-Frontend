import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  FormArray,
} from '@angular/forms';
import { TicketsSaleService } from '../../services/tickets-sale.service';
import { ISeatSelection } from '../../models/seats-layout.interface';
import { IFrequencyDetail } from '../../models/frequencie-detail.interface';
import {
  IPassengerData,
  IPassengerForm,
  PASSENGER_TYPE_MAP,
} from '../../models/passenger.interface';
import {
  ITicketPurchaseRequest,
  ITicketPurchaseResponse,
} from '../../models/ticket.interface';
import { AlertService } from '@shared/services/alert.service';
import { AlertType } from '@utils/enums/alert-type.enum';
import { IBaseUser } from '@shared/models/base-user.interface';
import { LoginService } from '@core/login/services/login.service';

@Component({
  selector: 'app-step-three',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './step-three.component.html',
  styleUrl: './step-three.component.css',
})
export class StepThreeComponent implements OnInit {
  @Input() selectedSeats!: ISeatSelection[];
  @Input() selectedFrequency!: IFrequencyDetail;
  @Output() ticketPurchased = new EventEmitter<ITicketPurchaseResponse>();
  @Output() nextStep = new EventEmitter<void>();
  @Output() previousStep = new EventEmitter<void>();

  passengersForm: FormGroup;
  isLoading = false;
  isPurchasing = false;

  constructor(
    private fb: FormBuilder,
    private ticketsSaleService: TicketsSaleService,
    private alertService: AlertService,
    private loginSrv: LoginService
  ) {
    this.passengersForm = this.fb.group({
      passengers: this.fb.array([]),
    });
  }

  ngOnInit(): void {
    this.initializePassengerForms();
  }

  get passengersFormArray(): FormArray {
    return this.passengersForm.get('passengers') as FormArray;
  }

  initializePassengerForms(): void {
    const passengersArray = this.passengersFormArray;

    // Limpiar formularios existentes
    while (passengersArray.length !== 0) {
      passengersArray.removeAt(0);
    }

    // Crear un formulario para cada asiento seleccionado
    this.selectedSeats.forEach((seatSelection, index) => {
      const passengerForm = this.createPassengerForm(seatSelection);
      passengersArray.push(passengerForm);
    });
  }

  createPassengerForm(seatSelection: ISeatSelection): FormGroup {
    return this.fb.group({
      seatId: [seatSelection.seat.id],
      seatNumber: [seatSelection.seat.number],
      seatType: [seatSelection.seat.type],
      passengerType: [seatSelection.passengerType, [Validators.required]],
      firstName: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(50),
        ],
      ],
      lastName: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(50),
        ],
      ],
      idNumber: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      price: [seatSelection.price],
    });
  }

  getPassengerForm(index: number): FormGroup {
    return this.passengersFormArray.at(index) as FormGroup;
  }

  getFieldError(formGroup: FormGroup, fieldName: string): string {
    const field = formGroup.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        return 'Este campo es requerido';
      }
      if (field.errors['minlength']) {
        return `Mínimo ${field.errors['minlength'].requiredLength} caracteres`;
      }
      if (field.errors['maxlength']) {
        return `Máximo ${field.errors['maxlength'].requiredLength} caracteres`;
      }
      if (field.errors['pattern']) {
        return 'Debe ser un número de cédula válido (10 dígitos)';
      }
    }
    return '';
  }

  getTotalPrice(): number {
    return this.selectedSeats.reduce(
      (total, selection) => total + selection.price,
      0
    );
  }

  getPassengerTypeLabel(type: string): string {
    switch (type) {
      case 'ADULT':
        return 'Adulto';
      case 'CHILD':
        return 'Niño';
      case 'SENIOR':
        return 'Adulto Mayor';
      case 'HANDICAPPED':
        return 'Persona con Discapacidad';
      default:
        return type;
    }
  }

  onPurchaseTicket(): void {
    if (this.passengersForm.valid) {
      this.isPurchasing = true;

      // TODO: Implementar obtención del usuario autenticado
      // Por ahora usamos un ID fijo, pero esto debe venir del servicio de autenticación
      const currentUser: IBaseUser =
        this.loginSrv.getLoggedUserFromLocalStorage()!;
      const currentUserId = currentUser.id;

      const passengersData: IPassengerData[] =
        this.passengersFormArray.value.map((passenger: any) => ({
          seatId: passenger.seatId,
          passengerType:
            PASSENGER_TYPE_MAP[
              passenger.passengerType as keyof typeof PASSENGER_TYPE_MAP
            ],
          firstName: passenger.firstName,
          lastName: passenger.lastName,
          idNumber: passenger.idNumber,
        }));

      const purchaseRequest: ITicketPurchaseRequest = {
        buyerUserId: currentUserId,
        routeSheetDetailId: this.selectedFrequency.routeSheetDetailId,
        passengers: passengersData,
        paymentMethod: 'cash',
      };

      this.ticketsSaleService.purchaseTicket(purchaseRequest).subscribe({
        next: (response) => {
          this.ticketPurchased.emit(response);
          this.alertService.showAlert({
            alertType: AlertType.SUCCESS,
            mainMessage: 'Ticket comprado exitosamente',
            subMessage: `Código QR: ${response.ticket.qrCode}`,
          });
          this.nextStep.emit();
          this.isPurchasing = false;
        },
        error: (error) => {
          console.error('Error purchasing ticket:', error);
          this.alertService.showAlert({
            alertType: AlertType.ERROR,
            mainMessage: 'Error al comprar el ticket',
            subMessage: 'Por favor intente nuevamente',
          });
          this.isPurchasing = false;
        },
      });
    } else {
      this.markAllFieldsAsTouched();
      this.alertService.showAlert({
        alertType: AlertType.WARNING,
        mainMessage: 'Formulario incompleto',
        subMessage: 'Por favor complete todos los campos requeridos',
      });
    }
  }

  private markAllFieldsAsTouched(): void {
    this.passengersFormArray.controls.forEach((passengerForm) => {
      Object.keys((passengerForm as FormGroup).controls).forEach((key) => {
        const control = passengerForm.get(key);
        control?.markAsTouched();
      });
    });
  }

  canProceed(): boolean {
    return this.passengersForm.valid;
  }

  onPrevious(): void {
    this.previousStep.emit();
  }

  // Método para auto-completar datos (opcional)
  fillSampleData(index: number): void {
    const passengerForm = this.getPassengerForm(index);
    passengerForm.patchValue({
      firstName: 'Juan Carlos',
      lastName: 'Pérez García',
      idNumber: '1234567890',
    });
  }
}
