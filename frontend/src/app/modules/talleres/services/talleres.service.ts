import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { Taller, NuevoTaller, ActualizarTaller, Provincia, Ciudad } from '../models/taller.model';

@Injectable({
  providedIn: 'root'
})
export class TalleresService {
  private apiUrl = `${environment.apiUrl}/Taller`;
  private provinciaUrl = `${environment.apiUrl}/Provincia`;
  private ciudadUrl = `${environment.apiUrl}/Ciudad`;

  constructor(private http: HttpClient) {}

  obtenerTalleres(): Observable<Taller[]> {
    return this.http.get<Taller[]>(this.apiUrl).pipe(
      tap(data => console.log('Talleres obtenidos:', data)),
      catchError(this.handleError)
    );
  }

  obtenerTallerPorId(id: number): Observable<Taller> {
    return this.http.get<Taller>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  agregarTaller(taller: NuevoTaller): Observable<Taller> {
    return this.http.post<Taller>(this.apiUrl, taller).pipe(
      catchError(this.handleError)
    );
  }

  actualizarTaller(taller: ActualizarTaller): Observable<Taller> {
    const { idTaller, ...datos } = taller;
    return this.http.put<Taller>(`${this.apiUrl}/${idTaller}`, datos).pipe(
      catchError(this.handleError)
    );
  }

  eliminarTaller(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  obtenerProvincias(): Observable<Provincia[]> {
    return this.http.get<Provincia[]>(this.provinciaUrl).pipe(
      catchError(this.handleError)
    );
  }

  obtenerCiudadesPorProvincia(idProvincia: number): Observable<Ciudad[]> {
    return this.http.get<Ciudad[]>(`${this.ciudadUrl}/provincia/${idProvincia}`).pipe(
      catchError(this.handleError)
    );
  }

  asignarProyectoATaller(idTaller: number, idProyecto: number): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/${idTaller}/proyectos/${idProyecto}`, {}).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Ocurrio un error desconocido';

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      if (error.status === 404) {
        errorMessage = 'Recurso no encontrado';
      } else if (error.status === 500) {
        errorMessage = 'Error interno del servidor';
      } else if (error.status === 0) {
        errorMessage = `No se pudo conectar con el servidor. Verifica que el backend este corriendo en ${environment.apiBaseUrl}`;
      } else if (typeof error.error === 'string') {
        errorMessage = error.error;
      } else if (error.error?.message) {
        errorMessage = error.error.message;
      }
    }

    console.error('Error en TalleresService:', errorMessage, error);
    return throwError(() => new Error(errorMessage));
  }
}
