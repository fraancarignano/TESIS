import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Proveedor, NuevoProveedor, ActualizarProveedor, Provincia, Ciudad } from '../models/proveedor.model';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProveedoresService {
  private apiUrl = `${environment.apiUrl}/Proveedor`;
  private provinciaUrl = `${environment.apiUrl}/Provincia`;
  private ciudadUrl = `${environment.apiUrl}/Ciudad`;

  constructor(private http: HttpClient) {}

  obtenerProveedores(): Observable<Proveedor[]> {
    return this.http.get<Proveedor[]>(this.apiUrl).pipe(
      tap(data => console.log('Proveedores obtenidos:', data)),
      catchError(this.handleError)
    );
  }

  obtenerProveedorPorId(id: number): Observable<Proveedor> {
    return this.http.get<Proveedor>(`${this.apiUrl}/${id}`).pipe(
      tap(data => console.log('Proveedor obtenido:', data)),
      catchError(this.handleError)
    );
  }

  agregarProveedor(proveedor: NuevoProveedor): Observable<Proveedor> {
    return this.http.post<Proveedor>(this.apiUrl, proveedor).pipe(
      tap(data => console.log('Proveedor creado:', data)),
      catchError(this.handleError)
    );
  }

  actualizarProveedor(proveedor: ActualizarProveedor): Observable<Proveedor> {
    const { idProveedor, ...datos } = proveedor;
    return this.http.put<Proveedor>(`${this.apiUrl}/${idProveedor}`, datos).pipe(
      tap(data => console.log('Proveedor actualizado:', data)),
      catchError(this.handleError)
    );
  }

  eliminarProveedor(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => console.log('Proveedor eliminado:', id)),
      catchError(this.handleError)
    );
  }

  obtenerProvincias(): Observable<Provincia[]> {
    return this.http.get<Provincia[]>(this.provinciaUrl).pipe(
      tap(data => console.log('Provincias obtenidas:', data)),
      catchError(this.handleError)
    );
  }

  obtenerCiudadesPorProvincia(idProvincia: number): Observable<Ciudad[]> {
    return this.http.get<Ciudad[]>(`${this.ciudadUrl}/provincia/${idProvincia}`).pipe(
      tap(data => console.log('Ciudades obtenidas:', data)),
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Ocurrio un error desconocido';

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      errorMessage = `Codigo: ${error.status}\nMensaje: ${error.message}`;

      switch (error.status) {
        case 404:
          errorMessage = 'Recurso no encontrado';
          break;
        case 500:
          errorMessage = 'Error interno del servidor';
          break;
        case 0:
          errorMessage = `No se pudo conectar con el servidor. Verifica que el backend este corriendo en ${environment.apiBaseUrl}`;
          break;
      }
    }

    console.error('Error en ProveedoresService:', errorMessage, error);
    return throwError(() => new Error(errorMessage));
  }
}
