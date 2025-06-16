import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import { Observable } from 'rxjs';
import { IRoute } from '../models/route.interface';
import { IRouteRequest } from '../models/route-request.interface';
import { LoginService } from '@core/login/services/login.service';
import { ICooperative } from '@features/coops/models/cooperative.interface';
import { IFrequency, IFrequencyRequest } from '../models/frequency.interface';

@Injectable({
  providedIn: 'root',
})
export class RoutesService {
  private readonly baseUrl: string = `${environment.API_URL}/frequencies`;
  private readonly cloudinaryUrl: string = `${environment.API_URL}/cloudinary/pdf`;
  private readonly http: HttpClient = inject(HttpClient);
  private readonly loginService: LoginService = inject(LoginService);

  private get cooperativeId(): number | null {
    const cooperative = this.loginService.getCooperativeFromLocalStorage();
    return cooperative?.id || null;
  }

  getAllFrequencies(): Observable<IFrequency[]> {
    // Obtener frecuencias filtradas por cooperativa
    if (this.cooperativeId) {
      return this.http.get<IFrequency[]>(`${this.baseUrl}?cooperativeId=${this.cooperativeId}`);
    }
    // Si no hay cooperativa, obtener todas (aunque esto probablemente no debería ocurrir)
    return this.http.get<IFrequency[]>(this.baseUrl);
  }

  getFrequencyById(id: number): Observable<IFrequency> {
    return this.http.get<IFrequency>(`${this.baseUrl}/${id}`);
  }

  createFrequency(frequency: IFrequencyRequest): Observable<IFrequency> {
    // Asegurar que la frecuencia se crea asociada a la cooperativa del usuario
    if (this.cooperativeId) {
      const frequencyWithCooperative = {
        ...frequency,
        cooperativeId: this.cooperativeId
      };
      return this.http.post<IFrequency>(this.baseUrl, frequencyWithCooperative);
    }
    return this.http.post<IFrequency>(this.baseUrl, frequency);
  }

  updateFrequency(id: number, frequency: IFrequencyRequest): Observable<IFrequency> {
    // Asegurar que la actualización mantiene la asociación con la cooperativa
    if (this.cooperativeId) {
      const frequencyWithCooperative = {
        ...frequency,
        cooperativeId: this.cooperativeId
      };
      return this.http.put<IFrequency>(`${this.baseUrl}/${id}`, frequencyWithCooperative);
    }
    return this.http.put<IFrequency>(`${this.baseUrl}/${id}`, frequency);
  }

  deleteFrequency(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  // Método para subir un archivo PDF a Cloudinary
  uploadPdfFile(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(this.cloudinaryUrl, formData);
  }
} 