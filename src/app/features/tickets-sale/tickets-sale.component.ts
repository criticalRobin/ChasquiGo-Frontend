import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { StepOneComponent } from './components/step-one/step-one.component';
import { StepTwoComponent } from './components/step-two/step-two.component';
import { StepThreeComponent } from './components/step-three/step-three.component';
import { IFrequencyDetail } from './models/frequencie-detail.interface';
import { ISeatSelection } from './models/seats-layout.interface';
import { ITicketPurchaseResponse } from './models/ticket.interface';
import { IPassengerData } from './models/passenger.interface';
import { PdfGeneratorService } from './services/pdf-generator.service';
import { AlertService } from '@shared/services/alert.service';
import { AlertType } from '@utils/enums/alert-type.enum';

@Component({
  selector: 'app-tickets-sale',
  standalone: true,
  imports: [CommonModule, StepOneComponent, StepTwoComponent, StepThreeComponent, RouterLink],
  templateUrl: './tickets-sale.component.html',
  styleUrl: './tickets-sale.component.css',
})
export class TicketsSaleComponent {
  currentStep = 1;
  totalSteps = 4;
  searchResults: IFrequencyDetail[] = [];
  selectedFrequency: IFrequencyDetail | null = null;
  selectedSeats: ISeatSelection[] = [];
  purchaseResponse: ITicketPurchaseResponse | null = null;
  passengersData: IPassengerData[] = [];

  constructor(
    private pdfGeneratorService: PdfGeneratorService,
    private alertService: AlertService
  ) {}

  onSearchCompleted(results: IFrequencyDetail[]): void {
    this.searchResults = results;
    if (results.length > 0) {
      // Podrías automáticamente pasar al siguiente step si hay resultados
      // this.nextStep();
    }
  }

  onFrequencySelected(frequency: IFrequencyDetail): void {
    this.selectedFrequency = frequency;
    this.nextStep();
  }

  onSeatsSelected(seats: ISeatSelection[]): void {
    this.selectedSeats = seats;
  }

  onTicketPurchased(response: ITicketPurchaseResponse): void {
    this.purchaseResponse = response;
  }

  onPassengersDataReady(passengersData: IPassengerData[]): void {
    this.passengersData = passengersData;
  }

  printTicket(): void {
    if (this.purchaseResponse && this.selectedFrequency && this.selectedSeats.length > 0 && this.passengersData.length > 0) {
      this.pdfGeneratorService.generateTicketPDF(
        this.purchaseResponse,
        this.selectedFrequency,
        this.selectedSeats,
        this.passengersData
      );
      
      this.alertService.showAlert({
        alertType: AlertType.SUCCESS,
        mainMessage: 'PDF generado exitosamente',
        subMessage: 'El archivo se ha descargado automáticamente'
      });
    } else {
      this.alertService.showAlert({
        alertType: AlertType.ERROR,
        mainMessage: 'No se puede generar el PDF',
        subMessage: 'Faltan datos necesarios para la generación del ticket'
      });
    }
  }

  nextStep(): void {
    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  goToStep(step: number): void {
    if (step >= 1 && step <= this.totalSteps) {
      this.currentStep = step;
    }
  }

  isStepCompleted(step: number): boolean {
    switch (step) {
      case 1:
        return this.searchResults.length > 0;
      case 2:
        return this.selectedSeats.length > 0;
      case 3:
        return this.purchaseResponse !== null;
      case 4:
        return false; // Implementar lógica para paso 4 si es necesario
      default:
        return false;
    }
  }

  isStepActive(step: number): boolean {
    return this.currentStep === step;
  }

  canAccessStep(step: number): boolean {
    if (step === 1) return true;
    return this.isStepCompleted(step - 1);
  }

  resetSale(): void {
    this.currentStep = 1;
    this.searchResults = [];
    this.selectedFrequency = null;
    this.selectedSeats = [];
    this.purchaseResponse = null;
    this.passengersData = [];
  }
}
