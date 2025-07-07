import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import { ITicketPurchaseResponse } from '../models/ticket.interface';
import { IFrequencyDetail } from '../models/frequencie-detail.interface';
import { ISeatSelection } from '../models/seats-layout.interface';
import { IPassengerData } from '../models/passenger.interface';

@Injectable({
  providedIn: 'root'
})
export class PdfGeneratorService {

  constructor() { }

  /**
   * Genera y descarga un PDF con los tickets de la compra
   */
  generateTicketPDF(
    purchaseResponse: ITicketPurchaseResponse,
    frequencyDetail: IFrequencyDetail,
    selectedSeats: ISeatSelection[],
    passengers: IPassengerData[]
  ): void {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    // Configuración de colores
    const primaryColor = '#3b82f6';
    const secondaryColor = '#f59e0b';
    const textColor = '#374151';
    
    let yPosition = 20;
    
    // Header del documento
    this.addHeader(pdf, pageWidth, yPosition);
    yPosition += 30;
    
    // Información del viaje
    yPosition = this.addTripInfo(pdf, frequencyDetail, yPosition, primaryColor);
    yPosition += 15;
    
    // Información de la transacción
    yPosition = this.addTransactionInfo(pdf, purchaseResponse, yPosition, secondaryColor);
    yPosition += 15;
    
    // Generar un ticket por cada pasajero
    passengers.forEach((passenger, index) => {
      const seat = selectedSeats[index];
      
      // Verificar si necesitamos una nueva página
      if (yPosition > pageHeight - 80) {
        pdf.addPage();
        yPosition = 20;
      }
      
      yPosition = this.addTicketSection(
        pdf, 
        passenger, 
        seat, 
        frequencyDetail, 
        purchaseResponse, 
        yPosition, 
        pageWidth,
        index + 1
      );
      yPosition += 20;
    });
    
    // Footer
    this.addFooter(pdf, pageWidth, pageHeight);
    
    // Descargar el PDF
    const fileName = `ticket_${purchaseResponse.ticket.id}_${new Date().getTime()}.pdf`;
    pdf.save(fileName);
  }

  private addHeader(pdf: jsPDF, pageWidth: number, yPosition: number): void {
    // Logo/Título de la empresa
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor('#1f2937');
    pdf.text('CHASQUI GO', pageWidth / 2, yPosition, { align: 'center' });
    
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor('#6b7280');
    pdf.text('Sistema de Venta de Boletos', pageWidth / 2, yPosition + 8, { align: 'center' });
    
    // Línea separadora
    pdf.setDrawColor('#e5e7eb');
    pdf.line(20, yPosition + 15, pageWidth - 20, yPosition + 15);
  }

  private addTripInfo(pdf: jsPDF, frequencyDetail: IFrequencyDetail, yPosition: number, color: string): number {
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(color);
    pdf.text('INFORMACIÓN DEL VIAJE', 20, yPosition);
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor('#374151');
    
    const tripInfo = [
      `Origen: ${frequencyDetail.frequency.originCity.name}`,
      `Destino: ${frequencyDetail.frequency.destinationCity.name}`,
      `Fecha: ${frequencyDetail.date}`,
      `Hora: ${frequencyDetail.frequency.departureTime.substring(0, 5)}`,
      `Cooperativa: ${frequencyDetail.cooperative.name}`,
      `Duración: ${frequencyDetail.duration}`,
      `Llegada Estimada: ${frequencyDetail.estimatedArrival}`
    ];
    
    tripInfo.forEach((info, index) => {
      pdf.text(info, 20, yPosition + 15 + (index * 5));
    });
    
    return yPosition + 15 + (tripInfo.length * 5);
  }

  private addTransactionInfo(pdf: jsPDF, purchaseResponse: ITicketPurchaseResponse, yPosition: number, color: string): number {
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(color);
    pdf.text('INFORMACIÓN DE LA TRANSACCIÓN', 20, yPosition);
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor('#374151');
    
    const transactionInfo = [
      `ID Transacción: ${purchaseResponse.transaction.id}`,
      `Monto Total: $${purchaseResponse.transaction.finalAmount.toFixed(2)}`,
      `Estado: ${purchaseResponse.transaction.status}`,
      `Método de Pago: Efectivo`,
      `Fecha de Compra: ${new Date().toLocaleDateString('es-EC')}`
    ];
    
    transactionInfo.forEach((info, index) => {
      pdf.text(info, 20, yPosition + 15 + (index * 5));
    });
    
    return yPosition + 15 + (transactionInfo.length * 5);
  }

  private addTicketSection(
    pdf: jsPDF,
    passenger: IPassengerData,
    seat: ISeatSelection,
    frequencyDetail: IFrequencyDetail,
    purchaseResponse: ITicketPurchaseResponse,
    yPosition: number,
    pageWidth: number,
    ticketNumber: number
  ): number {
    const boxHeight = 60;
    const margin = 20;
    
    // Dibujar rectángulo del ticket
    pdf.setDrawColor('#d1d5db');
    pdf.setFillColor('#f9fafb');
    pdf.rect(margin, yPosition, pageWidth - (margin * 2), boxHeight, 'FD');
    
    // Título del ticket
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor('#1f2937');
    pdf.text(`BOLETO #${ticketNumber}`, margin + 5, yPosition + 10);
    
    // Información del pasajero (columna izquierda)
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor('#374151');
    
    const passengerInfo = [
      `Pasajero: ${passenger.firstName} ${passenger.lastName}`,
      `Cédula: ${passenger.idNumber}`,
      `Tipo: ${this.getPassengerTypeLabel(passenger.passengerType)}`,
      `Asiento: ${seat.seat.number} (${seat.seat.type})`
    ];
    
    passengerInfo.forEach((info, index) => {
      pdf.text(info, margin + 5, yPosition + 20 + (index * 4));
    });
    
    // Información del viaje (columna derecha)
    const rightColumnX = pageWidth / 2 + 10;
    const tripDetails = [
      `${frequencyDetail.frequency.originCity.name} → ${frequencyDetail.frequency.destinationCity.name}`,
      `${frequencyDetail.date} - ${frequencyDetail.frequency.departureTime.substring(0, 5)}`,
      `Precio: $${seat.price.toFixed(2)}`,
      `QR: ${purchaseResponse.ticket.qrCode}`
    ];
    
    tripDetails.forEach((detail, index) => {
      pdf.text(detail, rightColumnX, yPosition + 20 + (index * 4));
    });
    
    // Código QR placeholder (podrías integrar una librería de QR si necesitas)
    pdf.setDrawColor('#9ca3af');
    pdf.rect(pageWidth - 50, yPosition + 15, 25, 25);
    pdf.setFontSize(8);
    pdf.text('QR CODE', pageWidth - 42, yPosition + 30, { align: 'center' });
    
    return yPosition + boxHeight;
  }

  private addFooter(pdf: jsPDF, pageWidth: number, pageHeight: number): void {
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor('#9ca3af');
    
    const footerText = [
      'Este documento es válido como comprobante de compra.',
      'Conserve este boleto durante todo el viaje.',
      `Generado el ${new Date().toLocaleString('es-EC')}`
    ];
    
    footerText.forEach((text, index) => {
      pdf.text(text, pageWidth / 2, pageHeight - 20 + (index * 4), { align: 'center' });
    });
  }

  private getPassengerTypeLabel(type: string): string {
    switch (type) {
      case 'NORMAL':
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
}
