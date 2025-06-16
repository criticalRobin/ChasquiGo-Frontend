import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import { Observable } from 'rxjs';
import { ICoopResponse } from '../models/coop-response.interface';
import { ICoopRequest } from '../models/coop-request.interface';

@Injectable({
  providedIn: 'root',
})
export class CoopsService {
  private readonly baseUrl: string = `${environment.API_URL}`;
  private readonly http: HttpClient = inject(HttpClient);

  getCoopByAdminId(adminId: number): Observable<ICoopResponse> {
    console.log('Fetching cooperative data for admin ID:', adminId);
    const url: string = `${this.baseUrl}/users/cooperative/${adminId}`;
    const response: Observable<ICoopResponse> =
      this.http.get<ICoopResponse>(url);

    return response;
  }

  updateCoop(
    coopId: number,
    coopData: ICoopRequest,
    adminId: number
  ): Observable<ICoopResponse> {
    console.log(coopData);
    let url: string = `${this.baseUrl}/cooperatives/${coopId}`;
    const params = new HttpParams().set('userId', adminId.toString());
    return this.http.put<ICoopResponse>(url, coopData, { params });
  }
}
