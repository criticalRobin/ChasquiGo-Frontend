import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { IBuses, IBusType } from '../models/buses.interface';
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

  getBusesByCooperativeId(cooperativeId: number): Observable<IBuses[]> {
    return this.http.get<IBuses[]>(`${this.apiUrl}/cooperative/${cooperativeId}`);
  }

  getBusById(id: number): Observable<IBuses> {
    return this.http.get<IBuses>(`${this.apiUrl}/${id}`);
  }

  createBus(bus: IBuses): Observable<IBuses> {
    return this.http.post<IBuses>(this.apiUrl, bus);
  }

  updateBus(id: number, bus: IBuses): Observable<IBuses> {
    return this.http.put<IBuses>(`${this.apiUrl}/${id}`, bus);
  }

  deleteBus(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getBusesByCooperative(cooperativeId: number): Observable<IBuses[]> {
    return this.http.get<IBuses[]>(`${this.apiUrl}/cooperative/${cooperativeId}`);
  }

  getBusTypes(): Observable<IBusType[]> {
    return this.http.get<IBusType[]>(`${environment.API_URL}/type-bus`);
  }

  getBusTypeById(id: number): Observable<IBusType> {
    return this.http.get<IBusType>(`${environment.API_URL}/type-bus/${id}`);
  }

  uploadImageToCloudinary(imageFile: File): Observable<{url: string}> {
    const formData = new FormData();
    formData.append('file', imageFile); // Cambio: usar 'file' en lugar de 'image'
    console.log('Subiendo archivo a Cloudinary:', imageFile.name, 'Tamaño:', imageFile.size);
    return this.http.post<{url: string}>(`${environment.API_URL}/cloudinary/image`, formData);
  }
}