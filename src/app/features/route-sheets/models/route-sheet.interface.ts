export interface IRouteSheet {
  id: number;
  frequencyId: number;
  busId: number;
  date: string;
  status: 'Activo' | 'Pendiente' | 'Completado' | 'Cancelado';
  availableSeats: number;
  occupiedSeats: number;
  totalSeats: number;
  createdAt: string;
  updatedAt?: string;
  routeSheetDetails?: IRouteSheetDetail[];
  frequencyIds?: number[];
  busIds?: number[];
}

export interface IRouteSheetDetail {
  id: number;
  routeSheetId: number;
  seatNumber: number;
  status: 'Activo' | 'Pendiente' | 'Completado' | 'Cancelado';
  client?: {
    id: number;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
  };
  createdAt?: string;
  updatedAt?: string;
  // Campos antiguos que pueden estar en uso en otras partes del código
  date?: string;
  frequencyId?: number;
  busId?: number;
  availableNormalSeats?: number;
  totalNormalSeats?: number;
  availableVIPSeats?: number;
  totalVIPSeats?: number;
}

export interface IRouteSheetRequest {
  frequencyId: number;
  busId: number;
  date: string;
  status?: string;
}

export interface IRouteSheetDetailRequest {
  routeSheetId: number;
  seatNumber: number;
  clientId?: number;
  status?: string;
}
