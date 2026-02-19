import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';



export interface Provincia {
  idProvincia: number;
  nombre: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProvinciaService {
  private apiUrl = `${environment.apiUrl}/Provincia`;

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


