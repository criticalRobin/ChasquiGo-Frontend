// Interfaces para el layout de asientos del bus

export interface IBusInfo {
  id: number;
  licensePlate: string;
  chassisBrand: string;
  bodyworkBrand: string;
  photo: string;
  busType: {
    id: number;
    name: string;
    floorCount: number;
    capacity: number;
  };
}

export interface IRouteInfo {
  routeSheetDetailId: number;
  date: string;
  frequency: {
    id: number;
    departureTime: string;
    originCity: string;
    destinationCity: string;
  };
}

export interface IOccupiedBy {
  ticketId: number;
  ticketPassengerId: number;
  passengerType: string;
  passengerName: string;
  ticketStatus: string;
}

export interface ISeatLayout {
  id: number;
  number: string;
  type: 'NORMAL' | 'VIP';
  location: 'WINDOW_LEFT' | 'WINDOW_RIGHT' | 'AISLE_LEFT' | 'AISLE_RIGHT' | 'MIDDLE';
  isOccupied: boolean;
  occupiedBy?: IOccupiedBy;
  isSelected?: boolean; // Para el estado de selección en el frontend
}

export interface IFloorLayout {
  floor: number;
  seats: ISeatLayout[];
}

export interface IAvailability {
  normal: {
    total: number;
    available: number;
    occupied: number;
  };
  vip: {
    total: number;
    available: number;
    occupied: number;
  };
}

export interface IPricingDiscounts {
  CHILD: number;
  SENIOR: number;
  HANDICAPPED: number;
}

export interface ISeatPricing {
  basePrice: number;
  discounts: IPricingDiscounts;
}

export interface IPricing {
  normalSeat: ISeatPricing;
  vipSeat: ISeatPricing;
}

export interface IBusSeatsResponse {
  busInfo: IBusInfo;
  routeInfo: IRouteInfo;
  seatsLayout: IFloorLayout[];
  availability: IAvailability;
  pricing: IPricing;
}

// Interface para la selección de asientos
export interface ISeatSelection {
  seat: ISeatLayout;
  passengerType: 'ADULT' | 'CHILD' | 'SENIOR' | 'HANDICAPPED';
  price: number;
}