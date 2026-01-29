import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';



export interface Provincia {
  idProvincia: number;
  nombre: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProvinciaService {
  private apiUrl = 'https://localhost:7163/api/Provincia';

  constructor(private http: HttpClient) {}

  /**
   * Obtener todas las provincias
   */
  obtenerProvincias(): Observable<Provincia[]> {
    return this.http.get<Provincia[]>(this.apiUrl);
  }

  /**
   * Obtener una provincia por ID
   */
  obtenerProvinciaPorId(id: number): Observable<Provincia> {
    return this.http.get<Provincia>(`${this.apiUrl}/${id}`);
  }
}


