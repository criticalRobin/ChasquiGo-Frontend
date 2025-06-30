// Estado posible para las hojas de ruta
export type RouteSheetStatus = 'ACTIVE' | 'INACTIVE'

// Interfaz para la cabecera de la hoja de ruta
export interface IRouteSheetHeader {
  id: number;
  cooperativeId: number;
  startDate: string; // Formato: ISO 8601 (ej: '2025-06-30T10:00:00.000Z')
  status: RouteSheetStatus;
  isDeleted: boolean;
  routeSheetDetails?: IRouteSheetDetail[];
  createdAt?: string;
  updatedAt?: string;
}

// Interfaz para los detalles de la hoja de ruta
export interface IRouteSheetDetail {
  id: number;
  routeSheetHeaderId: number;
  frequencyId: number;
  busId: number;
  status: RouteSheetStatus;
  isDeleted: boolean;
  routeSheetHeader?: IRouteSheetHeader;
  bus?: IBus;
  frequency?: IFrequency;
  createdAt?: string;
  updatedAt?: string;
}

// Interfaz para la creación/actualización de hojas de ruta
export interface IRouteSheetRequest {
  cooperativeId: number;
  startDate: string; // Formato: ISO 8601
  details: IRouteSheetDetailRequest[];
}

// Interfaz para la creación/actualización de detalles
export interface IRouteSheetDetailRequest {
  frequencyId: number;
  busId: number;
  status?: RouteSheetStatus;
}

// Interfaces para relaciones
interface IBus {
  id: number;
  plate: string;
  capacity: number;
  // Agregar más propiedades según sea necesario
}

interface IFrequency {
  id: number;
  name: string;
  // Agregar más propiedades según sea necesario
}

// Alias para compatibilidad con código existente
export type IRouteSheet = IRouteSheetHeader;

export interface ScheduleRequest {
  routeSheetHeaderId: number;
  startDate: string;
  endDate: string;
}

export interface ScheduleAssignment {
  frequencyId: number;
  frequencyName: string;
  busId: number;
  busName: string;
  departureTime: string;
}

export interface ScheduleDay {
  date: string;
  dayOfWeek: string;
  assignments: ScheduleAssignment[];
}

export interface ScheduleResponse {
  routeSheetId: number;
  startDate: string;
  endDate: string;
  schedule: ScheduleDay[];
}

export interface schedule {
  routeSheetHeaderId: number;
  startDate: string;
  endDate: string;
}