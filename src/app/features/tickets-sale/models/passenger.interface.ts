// Interfaces para datos de pasajeros

export interface IPassengerData {
  seatId: number;
  passengerType: 'NORMAL' | 'CHILD' | 'SENIOR' | 'HANDICAPPED';
  firstName: string;
  lastName: string;
  idNumber: string;
}

export interface IPassengerForm {
  seatNumber: string;
  seatType: 'NORMAL' | 'VIP';
  passengerType: 'NORMAL' | 'CHILD' | 'SENIOR' | 'HANDICAPPED';
  firstName: string;
  lastName: string;
  idNumber: string;
  price: number;
}

// Mapeo de tipos de pasajero para la UI al backend
export const PASSENGER_TYPE_MAP = {
  'ADULT': 'NORMAL',
  'CHILD': 'CHILD',
  'SENIOR': 'SENIOR',
  'HANDICAPPED': 'HANDICAPPED'
} as const;