import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Insumo, TipoInsumo, Proveedor } from '../models/insumo.model';

@Injectable({
  providedIn: 'root'
})
export class InsumosService {
  private apiUrl = 'https://localhost:7163/api/Insumo';
  private tipoInsumoUrl = 'https://localhost:7163/api/TipoInsumo';
  private proveedorUrl = 'https://localhost:7163/api/Proveedor';

  constructor(private http: HttpClient) {}

  /**
   * Obtener todos los insumos
   */
  getInsumos(): Observable<Insumo[]> {
    return this.http.get<any[]>(this.apiUrl).pipe(
      tap(data => {
        console.log('Insumos obtenidos:', data);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Obtener insumo por ID
   */
  getInsumoPorId(id: number): Observable<Insumo> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      tap(data => console.log('Insumo obtenido:', data)),
      catchError(this.handleError)
    );
  }

  /**
   * Obtener tipos de insumo
   */
  getTiposInsumo(): Observable<TipoInsumo[]> {
    return this.http.get<TipoInsumo[]>(this.tipoInsumoUrl).pipe(
      tap(data => console.log('Tipos de insumo obtenidos:', data)),
      catchError(this.handleError)
    );
  }

  /**
   * Obtener proveedores
   */
  getProveedores(): Observable<Proveedor[]> {
    return this.http.get<Proveedor[]>(this.proveedorUrl).pipe(
      tap(data => console.log('Proveedores obtenidos:', data)),
      catchError(this.handleError)
    );
  }

  /**
   * Crear nuevo insumo
   */
  agregarInsumo(insumo: Insumo): Observable<any> {
    const dto = this.mapToBackend(insumo);
    return this.http.post(this.apiUrl, dto).pipe(
      tap(data => console.log('Insumo creado:', data)),
      catchError(this.handleError)
    );
  }

  /**
   * Actualizar insumo existente
   */
  actualizarInsumo(insumo: Insumo): Observable<any> {
    const dto = this.mapToBackend(insumo);
    return this.http.put(`${this.apiUrl}/${insumo.idInsumo}`, dto).pipe(
      tap(data => console.log('Insumo actualizado:', data)),
      catchError(this.handleError)
    );
  }

  /**
   * Eliminar insumo
   */
  eliminarInsumo(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => console.log('Insumo eliminado:', id)),
      catchError(this.handleError)
    );
  }

  /**
   * Cambiar estado del insumo
   */
  cambiarEstado(id: number, nuevoEstado: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/estado`, { nuevoEstado }).pipe(
      tap(() => console.log('Estado cambiado:', { id, nuevoEstado })),
      catchError(this.handleError)
    );
  }

  /**
   * Buscar insumos con filtros
   */
  buscarInsumos(filtros: any): Observable<any[]> {
    return this.http.post<any[]>(`${this.apiUrl}/buscar`, filtros).pipe(
      tap(data => console.log('Insumos encontrados:', data)),
      catchError(this.handleError)
    );
  }

  /**
   * Mapear del backend al frontend
   */
  private mapToFrontend(data: any): Insumo {
    return {
      idInsumo: data.idInsumo,
      nombreInsumo: data.nombreInsumo,
      idTipoInsumo: data.idTipoInsumo,
      tipoInsumo: data.nombreTipoInsumo ? {
        idTipoInsumo: data.idTipoInsumo,
        nombreTipo: data.nombreTipoInsumo,
        descripcion: ''
      } : undefined,
      unidadMedida: data.unidadMedida,
      stockActual: data.stockActual,
      stockMinimo: data.stockMinimo,
      fechaActualizacion: data.fechaActualizacion,
      idProveedor: data.idProveedor,
      proveedor: data.nombreProveedor ? {
        idProveedor: data.idProveedor || 0,
        nombreProveedor: data.nombreProveedor,
        cuit: data.cuitProveedor
      } : undefined,
      estado: data.estado
    };
  }

  /**
   * Mapear del frontend al backend para CREATE/UPDATE
   */
  private mapToBackend(insumo: Insumo): any {
    return {
      nombreInsumo: insumo.nombreInsumo,
      idTipoInsumo: insumo.idTipoInsumo,
      unidadMedida: insumo.unidadMedida,
      stockActual: insumo.stockActual,
      stockMinimo: insumo.stockMinimo,
      idProveedor: insumo.idProveedor,
      estado: insumo.estado
    };
  }

  /**
   * Manejo de errores HTTP
   */
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Ocurrió un error desconocido';
    
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      errorMessage = `Código: ${error.status}\nMensaje: ${error.message}`;
      
      switch (error.status) {
        case 404:
          errorMessage = 'Recurso no encontrado';
          break;
        case 500:
          errorMessage = 'Error interno del servidor';
          break;
        case 0:
          errorMessage = 'No se pudo conectar con el servidor. Verifica que el backend esté corriendo en https://localhost:7163';
          break;
      }
    }
    
    console.error('Error en InsumosService:', errorMessage, error);
    return throwError(() => new Error(errorMessage));
  }
}