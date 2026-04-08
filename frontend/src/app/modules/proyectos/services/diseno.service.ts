import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import {
  ProyectoDisenoDetalle,
  ProyectoDisenoPayload,
  ProyectoResumenDiseno
} from '../models/diseno.model';

@Injectable({
  providedIn: 'root'
})
export class DisenoService {
  private apiUrl = `${environment.apiUrl}/Proyecto`;

  constructor(private http: HttpClient) {}

  obtenerResumenProyecto(idProyecto: number): Observable<ProyectoResumenDiseno> {
    return this.http.get<ProyectoResumenDiseno>(`${this.apiUrl}/${idProyecto}/resumen`).pipe(
      catchError(this.handleError)
    );
  }

  obtenerDiseno(idProyecto: number): Observable<ProyectoDisenoDetalle> {
    return this.http.get<ProyectoDisenoDetalle>(`${this.apiUrl}/${idProyecto}/diseno`).pipe(
      catchError(this.handleError)
    );
  }

  guardarDiseno(idProyecto: number, diseno: ProyectoDisenoPayload): Observable<ProyectoDisenoDetalle> {
    return this.http.post<ProyectoDisenoDetalle>(`${this.apiUrl}/${idProyecto}/diseno`, diseno).pipe(
      catchError(this.handleError)
    );
  }

  completarArea(idProyecto: number, observaciones?: string): Observable<ProyectoDisenoDetalle> {
    return this.http.post<ProyectoDisenoDetalle>(
      `${this.apiUrl}/${idProyecto}/areas/Diseño/completar`,
      { observaciones: observaciones?.trim() || undefined }
    ).pipe(
      catchError(this.handleError)
    );
  }

  sincronizarDesdeMuestra(idMuestra: number): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/Muestra/${idMuestra}/sincronizar-diseno`, {}).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Ocurrió un error inesperado.';

    if (error.error instanceof ErrorEvent) {
      errorMessage = error.error.message;
    } else if (error.status === 0) {
      errorMessage = 'No se pudo conectar con el servidor.';
    } else if (typeof error.error === 'string' && error.error.trim()) {
      errorMessage = error.error;
    } else if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.error?.title) {
      errorMessage = error.error.title;
    } else if (error.status === 404) {
      errorMessage = 'No se encontró el proyecto solicitado.';
    }

    return throwError(() => ({
      message: errorMessage,
      status: error.status,
      error: error.error
    }));
  }
}
