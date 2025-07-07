import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import { Observable } from 'rxjs';
import { IDriver } from '../models/driver.interface';
@Injectable({
  providedIn: 'root',
})
export class DriversService {
  private readonly baseUrl: string = `${environment.API_URL}`;
  private readonly http: HttpClient = inject(HttpClient);


  getDriversByCooperative(cooperativeId: number): Observable<IDriver[]> {
    const url: string = `${this.baseUrl}/drivers/${cooperativeId}`;
    return this.http.get<IDriver[]>(url);
  }

  getDriverById(id: number): Observable<IDriver> {
    const url: string = `${this.baseUrl}/drivers/one/${id}`;
    return this.http.get<IDriver>(url);
  }

  deleteDriver(id: number): Observable<void> {
    const url: string = `${this.baseUrl}/drivers/${id}`;
    return this.http.delete<void>(url);
  }
}
