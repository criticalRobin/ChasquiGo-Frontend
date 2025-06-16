import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import { Observable } from 'rxjs';
import { IIntermediateStop, IIntermediateStopRequest } from '../models/intermediate-stop.interface';

@Injectable({
  providedIn: 'root',
})
export class IntermediateStopService {
  private readonly baseUrl: string = `${environment.API_URL}/intermediate-stops`;
  private readonly http: HttpClient = inject(HttpClient);

  getAllIntermediateStops(): Observable<IIntermediateStop[]> {
    return this.http.get<IIntermediateStop[]>(this.baseUrl);
  }

  getIntermediateStopsByFrequencyId(frequencyId: number): Observable<IIntermediateStop[]> {
    return this.http.get<IIntermediateStop[]>(`${this.baseUrl}/frequency/${frequencyId}`);
  }

  getIntermediateStopById(id: number): Observable<IIntermediateStop> {
    return this.http.get<IIntermediateStop>(`${this.baseUrl}/${id}`);
  }

  createIntermediateStop(intermediateStop: IIntermediateStopRequest): Observable<IIntermediateStop> {
    return this.http.post<IIntermediateStop>(this.baseUrl, intermediateStop);
  }

  updateIntermediateStop(id: number, intermediateStop: IIntermediateStopRequest): Observable<IIntermediateStop> {
    return this.http.put<IIntermediateStop>(`${this.baseUrl}/${id}`, intermediateStop);
  }

  deleteIntermediateStop(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
} 