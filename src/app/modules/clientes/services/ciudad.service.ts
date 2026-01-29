import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';


export interface Ciudad {
  idCiudad: number;
  //nombreCiudad: string;
  idProvincia: number;
}

@Injectable({
  providedIn: 'root'
})
export class CiudadService {
  private apiUrl = 'https://localhost:7163/api/Ciudad';

  constructor(private http: HttpClient) {}

  /**
   * Obtener todas las ciudades
   */
  obtenerCiudades(): Observable<Ciudad[]> {
    return this.http.get<Ciudad[]>(this.apiUrl);
  }

  /**
   * Obtener ciudades filtradas por provincia
   */
  obtenerCiudadesPorProvincia(idProvincia: number): Observable<Ciudad[]> {
    const params = new HttpParams().set('idProvincia', idProvincia.toString());
    return this.http.get<Ciudad[]>(this.apiUrl, { params });
  }

  /**
   * Obtener una ciudad por ID
   */
  obtenerCiudadPorId(id: number): Observable<Ciudad> {
    return this.http.get<Ciudad>(`${this.apiUrl}/${id}`);
  }

  /**
   * Buscar ciudades por nombre (para autocomplete)
   */
  buscarCiudades(termino: string, idProvincia?: number): Observable<Ciudad[]> {
    let params = new HttpParams().set('buscar', termino);
    if (idProvincia) {
      params = params.set('idProvincia', idProvincia.toString());
    }
    return this.http.get<Ciudad[]>(`${this.apiUrl}/buscar`, { params });
  }
}