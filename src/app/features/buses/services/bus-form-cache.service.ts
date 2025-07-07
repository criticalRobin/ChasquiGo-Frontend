import { Injectable } from '@angular/core';
import { IBuses } from '../models/buses.interface';

@Injectable({
  providedIn: 'root'
})
export class BusFormCacheService {
  private cachedData: IBuses | null = null;

  cacheFormData(data: IBuses): void {
    this.cachedData = data;
  }

  getCachedData(): IBuses | null {
    return this.cachedData;
  }

  clearCache(): void {
    this.cachedData = null;
  }
}
