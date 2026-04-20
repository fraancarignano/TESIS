import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export type CalidadIncidenciaEstado = 'PENDIENTE' | 'EN_TALLER' | 'REINGRESADA' | 'CERRADA';

export interface CalidadIncidencia {
  idCalidadIncidencia: number;
  idProyecto: number;
  idTaller?: number | null;
  nombreTaller?: string | null;
  idUsuarioRegistro: number;
  fechaDeteccion: string;
  nombrePrenda: string;
  talle: string;
  criterioId: string;
  criterioNombre: string;
  cantidad: number;
  detalleFalla?: string | null;
  estado: CalidadIncidenciaEstado | string;
  fechaEnvioTaller?: string | null;
  fechaReingreso?: string | null;
  fechaCierre?: string | null;
}

export interface CrearCalidadIncidencia {
  idTaller?: number | null;
  nombrePrenda: string;
  talle: string;
  criterioId: string;
  criterioNombre: string;
  cantidad: number;
  detalleFalla?: string | null;
}

export interface CalidadIncidenciaDetalleResumen {
  idCalidadIncidencia: number;
  criterioNombre: string;
  cantidad: number;
  estado: string;
  fechaDeteccion: string;
  detalleFalla?: string | null;
}

export interface CalidadIncidenciaResumen {
  nombrePrenda: string;
  talle: string;
  cantidadTotal: number;
  cantidadPendiente: number;
  cantidadEnTaller: number;
  cantidadReingresada: number;
  incidencias: CalidadIncidenciaDetalleResumen[];
}

@Injectable({ providedIn: 'root' })
export class CalidadIncidenciasService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  listar(idProyecto: number, estado?: string): Observable<CalidadIncidencia[]> {
    let params = new HttpParams();
    if (estado) params = params.set('estado', estado);
    return this.http.get<CalidadIncidencia[]>(`${this.apiUrl}/proyectos/${idProyecto}/calidad-incidencias`, { params });
  }

  crear(idProyecto: number, payload: CrearCalidadIncidencia): Observable<CalidadIncidencia> {
    return this.http.post<CalidadIncidencia>(`${this.apiUrl}/proyectos/${idProyecto}/calidad-incidencias`, payload);
  }

  cambiarEstado(idProyecto: number, idCalidadIncidencia: number, estado: CalidadIncidenciaEstado): Observable<any> {
    return this.http.put(`${this.apiUrl}/proyectos/${idProyecto}/calidad-incidencias/${idCalidadIncidencia}/estado`, { estado });
  }

  obtenerResumenPorTalle(idProyecto: number, soloAbiertas: boolean = true): Observable<CalidadIncidenciaResumen[]> {
    let params = new HttpParams();
    params = params.set('soloAbiertas', soloAbiertas.toString());
    return this.http.get<CalidadIncidenciaResumen[]>(`${this.apiUrl}/proyectos/${idProyecto}/calidad-incidencias/resumen-por-talle`, { params });
  }
}
