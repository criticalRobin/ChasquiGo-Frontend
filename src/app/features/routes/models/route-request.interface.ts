export interface IRouteRequest {
  name: string;
  description: string;
  startLocation: string;
  endLocation: string;
  distance: number;
  estimatedDuration: number;
  cooperativeId?: number; // Opcional, se asignará automáticamente en el servicio
} 