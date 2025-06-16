import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import { Observable } from 'rxjs';
import { ICity } from '../models/city.interface';

@Injectable({
  providedIn: 'root',
})
export class CitiesService {
  private readonly baseUrl: string = `${environment.API_URL}/cities`;
  private readonly http: HttpClient = inject(HttpClient);

  getAllCities(): Observable<ICity[]> {
    return this.http.get<ICity[]>(this.baseUrl);
  }

  getCityById(id: number): Observable<ICity> {
    return this.http.get<ICity>(`${this.baseUrl}/${id}`);
  }
} 