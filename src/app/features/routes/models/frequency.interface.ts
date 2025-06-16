import { ICity } from './city.interface';

export interface IFrequency {
  id: number;
  cooperativeId: number;
  originCityId: number;
  destinationCityId: number;
  departureTime: string;
  status: string;
  antResolution: string;
  isDeleted: boolean;
  originCity: ICity;
  destinationCity: ICity;
}

export interface IFrequencyRequest {
  cooperativeId: number;
  originCityId: number | string;
  destinationCityId: number | string;
  departureTime: string;
  status: string;
  antResolution: string;
} 