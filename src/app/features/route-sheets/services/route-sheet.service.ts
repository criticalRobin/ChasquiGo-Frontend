import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import { Observable } from 'rxjs';
import { IRouteSheet, IRouteSheetRequest } from '../models/route-sheet.interface';
import { LoginService } from '@core/login/services/login.service';

@Injectable({
  providedIn: 'root',
})
export class RouteSheetService {
  private readonly baseUrl: string = `${environment.API_URL}/route-sheets`;
  private readonly http: HttpClient = inject(HttpClient);
  private readonly loginService: LoginService = inject(LoginService);

  // Hacemos público el getter para que pueda ser usado desde los componentes
  public get cooperativeId(): number | null {
    const cooperative = this.loginService.getCooperativeFromLocalStorage();
    return cooperative?.id || null;
  }

  getAllRouteSheets(): Observable<IRouteSheet[]> {
    // Obtener hojas de ruta filtradas por cooperativa
    if (this.cooperativeId) {
      return this.http.get<IRouteSheet[]>(`${this.baseUrl}?cooperativeId=${this.cooperativeId}`);
    }
    // Si no hay cooperativa, obtener todas (aunque esto probablemente no debería ocurrir)
    return this.http.get<IRouteSheet[]>(this.baseUrl);
  }

  getRouteSheetById(id: number): Observable<IRouteSheet> {
    return this.http.get<IRouteSheet>(`${this.baseUrl}/${id}`);
  }

  createRouteSheet(routeSheet: IRouteSheetRequest): Observable<IRouteSheet> {
    // Asegurar que la hoja de ruta se crea asociada a la cooperativa del usuario
    if (this.cooperativeId) {
      const routeSheetWithCooperative = {
        ...routeSheet,
        cooperativeId: this.cooperativeId
      };
      return this.http.post<IRouteSheet>(this.baseUrl, routeSheetWithCooperative);
    }
    return this.http.post<IRouteSheet>(this.baseUrl, routeSheet);
  }

  updateRouteSheet(id: number, routeSheet: IRouteSheetRequest): Observable<IRouteSheet> {
    // Asegurar que la actualización mantiene la asociación con la cooperativa
    if (this.cooperativeId) {
      const routeSheetWithCooperative = {
        ...routeSheet,
        cooperativeId: this.cooperativeId
      };
      return this.http.put<IRouteSheet>(`${this.baseUrl}/${id}`, routeSheetWithCooperative);
    }
    return this.http.put<IRouteSheet>(`${this.baseUrl}/${id}`, routeSheet);
  }

  deleteRouteSheet(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
