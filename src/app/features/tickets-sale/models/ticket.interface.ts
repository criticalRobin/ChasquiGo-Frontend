// Interfaces para compra y respuesta de tickets

import { IPassengerData } from './passenger.interface';

export interface ITicketPurchaseRequest {
  buyerUserId: number;
  routeSheetDetailId: number;
  passengers: IPassengerData[];
  paymentMethod: 'cash';
}

export interface ITransaction {
  id: number;
  finalAmount: number;
  status: string;
}

export interface ITicket {
  id: number;
  qrCode: string;
  status: string;
}

export interface ITicketPurchaseResponse {
  transaction: ITransaction;
  ticket: ITicket;
}