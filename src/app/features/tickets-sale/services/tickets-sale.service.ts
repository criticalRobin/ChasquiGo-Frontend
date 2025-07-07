import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import { ICity } from '../models/cities.interface';
import { IFrequencyDetail, ISearchRequest } from '../models/frequencie-detail.interface';
import { IBusSeatsResponse } from '../models/seats-layout.interface';
import { ITicketPurchaseRequest, ITicketPurchaseResponse } from '../models/ticket.interface';

@Injectable({
  providedIn: 'root'
})
export class TicketsSaleService {
  private readonly baseUrl = environment.API_URL;

  constructor(private http: HttpClient) { }

  /**
   * Obtiene todas las ciudades disponibles
   * @returns Observable<ICity[]>
   */
  getCities(): Observable<ICity[]> {
    return this.http.get<ICity[]>(`${this.baseUrl}/cities`);
  }

  /**
   * Busca frecuencias disponibles según los criterios de búsqueda
   * @param searchRequest - Criterios de búsqueda (origen, destino, fecha)
   * @returns Observable<IFrequencyDetail[]>
   */
  searchFrequencies(searchRequest: ISearchRequest): Observable<IFrequencyDetail[]> {
    const params = new URLSearchParams({
      originCityId: searchRequest.originCityId.toString(),
      destinationCityId: searchRequest.destinationCityId.toString(),
      date: searchRequest.date
    });

    return this.http.get<IFrequencyDetail[]>(`${this.baseUrl}/frequencies/search?${params.toString()}`);
  }

  /**
   * Obtiene el layout de asientos de un bus para una hoja de ruta específica
   * @param routeSheetDetailId - ID del detalle de la hoja de ruta
   * @returns Observable<IBusSeatsResponse>
   */
  getBusSeats(routeSheetDetailId: number): Observable<IBusSeatsResponse> {
    return this.http.get<IBusSeatsResponse>(`${this.baseUrl}/frequencies-buses/bus-seats/${routeSheetDetailId}`);
  }

  /**
   * Realiza la compra de tickets en efectivo
   * @param purchaseData - Datos de la compra
   * @returns Observable<ITicketPurchaseResponse>
   */
  purchaseTicket(purchaseData: ITicketPurchaseRequest): Observable<ITicketPurchaseResponse> {
    return this.http.post<ITicketPurchaseResponse>(`${this.baseUrl}/tickets/purchase-cash`, purchaseData);
  }
}
