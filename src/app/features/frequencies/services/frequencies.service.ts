import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import { Observable, map } from 'rxjs';
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

  // Hacemos público el getter para que pueda ser usado desde los componentes
  public get cooperativeId(): number | null {
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
  uploadPdfFile(formData: FormData): Observable<{url: string}> {
    return this.http.post<{url: string}>(this.cloudinaryUrl, formData)
      .pipe(
        map(response => {
          // Si la respuesta contiene una ruta relativa, la convertimos en URL completa
          if (response && response.url) {
            // Comprobamos si la URL ya es completa (comienza con http:// o https://)
            if (!response.url.startsWith('http://') && !response.url.startsWith('https://')) {
              return { url: `${environment.API_URL}${response.url}` };
            }
          }
          return response;
        })
      );
  }
} 