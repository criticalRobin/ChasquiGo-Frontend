export interface ISeat {
  id: number;
  number: string;
  floor: number;
  row: number;
  column: number;
  seatType: 'NORMAL' | 'VIP';
  status: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'BLOCKED';
  isSelected?: boolean;
}

export interface IFloor {
  number: number;
  seats: ISeat[];
}

export interface IBusLayout {
  busId: number;
  floors: IFloor[];
  totalSeats: number;
  availableSeats: number;
}

export interface ISeatSelection {
  seat: ISeat;
  passengerType: 'ADULT' | 'CHILD' | 'SENIOR' | 'HANDICAPPED';
  price: number;
}

export interface ISeatsResponse {
  busLayout: IBusLayout;
  routeSheetDetailId: number;
  date: string;
}
