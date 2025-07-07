import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { IBusType, IBusTypeCreate, IBusTypeUpdate } from '../models/bus-type.interface';

@Injectable({
  providedIn: 'root'
})
export class BusTypesService {
  private apiUrl = `${environment.API_URL}/type-bus`;

  constructor(private http: HttpClient) { }

  // Obtener todos los tipos de bus
  getBusTypes(): Observable<IBusType[]> {
    return this.http.get<IBusType[]>(this.apiUrl);
  }

  // Obtener tipo de bus por ID
  getBusTypeById(id: number): Observable<IBusType> {
    return this.http.get<IBusType>(`${this.apiUrl}/${id}`);
  }

  // Crear nuevo tipo de bus
  createBusType(busType: IBusTypeCreate): Observable<IBusType> {
    return this.http.post<IBusType>(this.apiUrl, busType);
  }

  // Actualizar tipo de bus (solo nombre y descripción)
  updateBusType(id: number, busType: IBusTypeUpdate): Observable<IBusType> {
    return this.http.patch<IBusType>(`${this.apiUrl}/${id}`, busType);
  }

  // Eliminar tipo de bus
  deleteBusType(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
