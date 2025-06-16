import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import { Observable } from 'rxjs';
import { IDriver } from '@features/drivers/models/driver.interface';
import { IDriverRequest } from '../models/driver-request.interface';

@Injectable({
  providedIn: 'root',
})
export class DriverManagementService {
  private readonly baseUrl: string = `${environment.API_URL}`;
  private readonly http: HttpClient = inject(HttpClient);

  createDriver(driverData: IDriverRequest): Observable<IDriver> {
    const url: string = `${this.baseUrl}/drivers`;
    return this.http.post<IDriver>(url, driverData);
  }

  updateDriver(id: number, driverData: IDriverRequest): Observable<IDriver> {
    const url: string = `${this.baseUrl}/drivers/${id}`;
    return this.http.put<IDriver>(url, driverData);
  }

  deleteDriver(id: number): Observable<void> {
    const url: string = `${this.baseUrl}/drivers/${id}`;
    return this.http.delete<void>(url);
  }
}
