// Interfaces para la respuesta de búsqueda de frecuencias

export interface ICity {
  id: number;
  name: string;
  province: string;
}

export interface IIntermediateStop {
  id: number;
  order: number;
  city: ICity;
}

export interface IFrequency {
  id: number;
  departureTime: string;
  status: string;
  antResolution: string;
  originCity: ICity;
  destinationCity: ICity;
  intermediateStops: IIntermediateStop[];
}

export interface IBusType {
  id: number;
  name: string;
  floorCount: number;
  capacity: number;
}

export interface IBus {
  id: number;
  licensePlate: string;
  chassisBrand: string;
  bodyworkBrand: string;
  photo: string;
  stoppageDays: number;
  busType: IBusType;
}

export interface ICooperative {
  id: number;
  name: string;
  logo: string;
  phone: string;
  email: string;
}

export interface ISeatAvailability {
  available: number;
  total: number;
  sold: number;
}

export interface ISeatsAvailability {
  normal: ISeatAvailability;
  vip: ISeatAvailability;
}

export interface IDiscounts {
  CHILD: number;
  SENIOR: number;
  HANDICAPPED: number;
}

export interface ISeatPricing {
  basePrice: number;
  discounts: IDiscounts;
}

export interface IPricing {
  normalSeat: ISeatPricing;
  vipSeat: ISeatPricing;
}

export interface IFrequencyDetail {
  routeSheetDetailId: number;
  date: string;
  frequency: IFrequency;
  bus: IBus;
  cooperative: ICooperative;
  seatsAvailability: ISeatsAvailability;
  pricing: IPricing;
  status: string;
  duration: string;
  estimatedArrival: string;
}

// Interface para la solicitud de búsqueda
export interface ISearchRequest {
  originCityId: number;
  destinationCityId: number;
  date: string;
}
