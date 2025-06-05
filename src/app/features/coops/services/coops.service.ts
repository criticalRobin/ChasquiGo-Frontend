import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import { Observable } from 'rxjs';
import { ICoopResponse } from '../models/coop-response.interface';

@Injectable({
  providedIn: 'root',
})
export class CoopsService {
  private readonly baseUrl: string = `${environment.API_URL}/cooperatives`;
  private readonly http: HttpClient = inject(HttpClient);

  getCoopByAdminId(adminId: number): Observable<ICoopResponse> {
    const url: string = `${this.baseUrl}/${adminId}`;
    const response: Observable<ICoopResponse> =
      this.http.get<ICoopResponse>(url);

    return response;
  }
}
