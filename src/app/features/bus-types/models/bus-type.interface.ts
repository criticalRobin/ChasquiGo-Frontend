export interface IBusType {
  id?: number;
  name: string;
  description: string;
  floorCount: number;
  seatsFloor1: number;
  seatsFloor2: number;
  aditionalPrice: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface IBusTypeCreate {
  name: string;
  description: string;
  floorCount: number;
  seatsFloor1: number;
  seatsFloor2: number;
  aditionalPrice: string;
}

export interface IBusTypeUpdate {
  name: string;
  description: string;
  aditionalPrice: string;
}
