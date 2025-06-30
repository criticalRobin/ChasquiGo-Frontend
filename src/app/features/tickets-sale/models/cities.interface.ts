export interface ICity {
  id: number;
  name: string;
  province: string;
  isDeleted: boolean;
}

export interface ICitiesResponse {
  cities: ICity[];
}
