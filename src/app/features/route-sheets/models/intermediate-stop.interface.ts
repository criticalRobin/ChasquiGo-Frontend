export interface IIntermediateStop {
  id?: number;
  name: string;
  frequencyId: number;
  order: number;
  isDeleted?: boolean;
}

export interface IIntermediateStopRequest {
  name: string;
  frequencyId: number;
  order: number;
} 