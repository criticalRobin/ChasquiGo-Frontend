import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import { IClerkResponse, IClerk } from '../models/clerk-response.interface';
import { IClerkRequest } from '../models/clerk-request.interface';
import { IClerkUpdateRequest } from '../models/clerk-update-request.interface';
import { IChangePasswordRequest } from '../models/change-password-request.interface';

@Injectable({
  providedIn: 'root'
})
export class ClerkManagementService {
  private readonly http: HttpClient = inject(HttpClient);
  private readonly apiUrl = `${environment.API_URL}/user-worker`;

  getClerks(cooperativeId: number, page: number = 1, limit: number = 10): Observable<IClerkResponse> {
    let params = new HttpParams()
      .set('cooperativeId', cooperativeId.toString())
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<IClerkResponse>(this.apiUrl, { params });
  }

  getClerkById(id: number): Observable<IClerk> {
    return this.http.get<IClerk>(`${this.apiUrl}/${id}`);
  }

  createClerk(clerkData: IClerkRequest): Observable<IClerk> {
    return this.http.post<IClerk>(this.apiUrl, clerkData);
  }

  updateClerk(id: number, clerkData: IClerkUpdateRequest): Observable<IClerk> {
    return this.http.put<IClerk>(`${this.apiUrl}/${id}`, clerkData);
  }

  changePassword(id: number, passwordData: IChangePasswordRequest): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/change-password`, passwordData);
  }

  deleteClerk(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
