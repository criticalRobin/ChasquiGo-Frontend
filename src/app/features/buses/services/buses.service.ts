import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { IBuses } from '../models/buses.interface';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BusesService {
  private apiUrl = `${environment.API_URL}/buses`;

  constructor(private http: HttpClient) { }

  getBuses(): Observable<IBuses[]> {
    return this.http.get<IBuses[]>(this.apiUrl);
  }

  getBusById(id: string): Observable<IBuses> {
    return this.http.get<IBuses>(`${this.apiUrl}/${id}`);
  }

  createBus(bus: IBuses): Observable<IBuses> {
    return this.http.post<IBuses>(this.apiUrl, bus);
  }

  updateBus(id: string, bus: IBuses): Observable<IBuses> {
    return this.http.put<IBuses>(`${this.apiUrl}/${id}`, bus);
  }

  deleteBus(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getBusesByCooperative(cooperativeId: number): Observable<IBuses[]> {
    return this.http.get<IBuses[]>(`${this.apiUrl}/cooperative/${cooperativeId}`);
  }
}