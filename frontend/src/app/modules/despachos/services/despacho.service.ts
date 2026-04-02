import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Despacho, CreateDespachoDTO, AsignarUbicacionDTO } from '../models/despacho.model';

@Injectable({
  providedIn: 'root'
})
export class DespachoService {
  private apiUrl = `${environment.apiUrl}/Despacho`;

  constructor(private http: HttpClient) {}

  obtenerDespachos(): Observable<Despacho[]> {
    return this.http.get<Despacho[]>(this.apiUrl);
  }

  obtenerDespacho(id: number): Observable<Despacho> {
    return this.http.get<Despacho>(`${this.apiUrl}/${id}`);
  }

  obtenerPorCodigoQR(codigo: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/codigo/${codigo}`);
  }

  crearDespacho(dto: CreateDespachoDTO): Observable<Despacho> {
    return this.http.post<Despacho>(this.apiUrl, dto);
  }

  asignarUbicacion(id: number, dto: AsignarUbicacionDTO): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}/ubicacion`, dto);
  }

  marcarDespachado(id: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}/despachar`, {});
  }
}
