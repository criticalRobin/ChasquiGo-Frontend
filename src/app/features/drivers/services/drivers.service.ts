import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import { Observable } from 'rxjs';
import { IDriver } from '../models/driver.interface';
import { IBaseUser } from '@shared/models/base-user.interface';
import { IDriverRequest } from '../pages/create-update-driver/models/driver-request.interface';

@Injectable({
  providedIn: 'root',
})
export class DriversService {
  private readonly baseUrl: string = `${environment.API_URL}`;
  private readonly http: HttpClient = inject(HttpClient);

  getAllUsers(): Observable<IDriver[]> {
    const url: string = `${this.baseUrl}/users`;
    return this.http.get<IDriver[]>(url);
  }
}
