import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Bus } from '../models/bus.model';

@Injectable({
  providedIn: 'root'
})
export class BusService {
  private apiUrl = `${environment.API_URL}/buses`;

  constructor(private http: HttpClient) {}

  getBuses(): Observable<Bus[]> {
    return this.http.get<Bus[]>(this.apiUrl);
  }

  getBusById(id: number): Observable<Bus> {
    return this.http.get<Bus>(`${this.apiUrl}/${id}`);
  }

  createBus(bus: Bus): Observable<Bus> {
    return this.http.post<Bus>(this.apiUrl, bus);
  }
  updateBus(bus: Bus): Observable<Bus> {
    const busId = bus.id;
    
    // Crear una copia sin el ID para enviar al backend
    const busCopy = { ...bus };
    delete busCopy.id;
    
    return this.http.put<Bus>(`${this.apiUrl}/${busId}`, busCopy);
  }

  deleteBus(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
} 