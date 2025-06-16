export interface IRouteSheet {
  id: number;
  cooperativeId: number;
  startDate: string;
  endDate: string;
  frequencyIds: number[];
  busIds: number[];
  status: 'Activo' | 'Pendiente' | 'Completado' | 'Cancelado';
  isDeleted?: boolean;
}

export interface IRouteSheetRequest {
  cooperativeId: number;
  startDate: string;
  endDate: string;
  frequencyIds: number[];
  busIds: number[];
  status: 'Activo' | 'Pendiente' | 'Completado' | 'Cancelado';
}
