export interface IIntermediateStop {
  id: number;
  frequencyId: number;
  cityId: number;
  order: number;
  isDeleted: boolean;
  city?: ICity;
}

export interface ICity {
  id: number;
  name: string;
  province: string;
  isDeleted: boolean;
}

export interface IIntermediateStopRequest {
  name: string;
  frequencyId: number;
  order: number;
} 