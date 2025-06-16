import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface Cooperative {
  id: number;
  name: string;
}

@Injectable({
  providedIn: 'root'
})
export class CooperativeService {
  private apiUrl = `${environment.API_URL}/cooperatives`;

  constructor(private http: HttpClient) {}

  getCooperatives(): Observable<Cooperative[]> {
    return this.http.get<Cooperative[]>(this.apiUrl);
  }

  getCooperativeById(id: number): Observable<Cooperative> {
    return this.http.get<Cooperative>(`${this.apiUrl}/${id}`);
  }
} 