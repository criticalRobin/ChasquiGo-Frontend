import { Injectable } from '@angular/core';
import { Bus } from '../models/bus.model';

@Injectable({
  providedIn: 'root'
})
export class BusFormCacheService {
  private cachedBusData: Bus | null = null;

  cacheFormData(data: Bus): void {
    this.cachedBusData = data;
  }

  getCachedFormData(): Bus | null {
    return this.cachedBusData;
  }

  clearCache(): void {
    this.cachedBusData = null;
  }
}
