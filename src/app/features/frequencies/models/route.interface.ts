export interface IRoute {
  id: number;
  name: string;
  description: string;
  startLocation: string;
  endLocation: string;
  distance: number;
  estimatedDuration: number;
  status: RouteStatus;
  cooperativeId: number;
  createdAt: string;
  updatedAt: string;
}

export enum RouteStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PENDING = 'PENDING'
} 