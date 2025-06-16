export interface Bus {
  id?: number;
  cooperativeId: number;
  licensePlate: string;
  chassisBrand: string;
  bodyworkBrand: string;
  photo?: string;
  stoppageDays: number;
  busTypeId: number;
  seats: IBusSeat[];
  // Campos locales para UI (no se envían al backend)
  capacity?: number; 
  floorCount?: number;
  photos?: string[];
  isDeleted?: boolean;
}

export interface IBusSeat {  id?: number;
  busId?: number;
  number: string;
  row?: number;
  column?: number;
  floor?: number;
  status?: 'available' | 'occupied' | 'reserved';
  type: 'NORMAL' | 'VIP';
  location: 'ventana' | 'pasillo';
  isDeleted?: boolean;
} 