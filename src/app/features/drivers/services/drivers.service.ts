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

  getAllUsers(coopId: number): Observable<IDriver[]> {
    const url: string = `${this.baseUrl}/drivers/${coopId}`;
    return this.http.get<IDriver[]>(url);
  }
}
