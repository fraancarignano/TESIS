import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Cliente, NuevoCliente, ActualizarCliente, Provincia, Ciudad, EstadoCliente } from '../models/cliente.model';
@Injectable({
  providedIn: 'root'
})
export class ClientesService {
  private apiUrl = 'https://localhost:7163/api/Cliente';
  private provinciaUrl = 'https://localhost:7163/api/Provincia'; // Ajusta según tu API
  private ciudadUrl = 'https://localhost:7163/api/Ciudad'; // Ajusta según tu API
  private estadoClienteUrl = 'https://localhost:7163/api/EstadoCliente'; // Ajusta según tu API

  constructor(private http: HttpClient) {}

  /** 
   * Obtener todos los clientes
   */
  obtenerClientes(): Observable<Cliente[]> {
    return this.http.get<Cliente[]>(this.apiUrl).pipe(
      tap(data => console.log('Clientes obtenidos:', data)),
      catchError(this.handleError)
    );
  }

  /** 
   * Obtener cliente por ID
   */
  obtenerClientePorId(id: number): Observable<Cliente> {
    return this.http.get<Cliente>(`${this.apiUrl}/${id}`).pipe(
      tap(data => console.log('Cliente obtenido:', data)),
      catchError(this.handleError)
    );
  }

  /**
   * Crear nuevo Cliente
   */
  agregarCliente(cliente: NuevoCliente): Observable<Cliente> {
    return this.http.post<Cliente>(this.apiUrl, cliente).pipe(
      tap(data => console.log('Cliente creado:', data)),
      catchError(this.handleError)
    );
  }

  /**
   * Actualizar cliente existente
   */
  actualizarCliente(cliente: ActualizarCliente): Observable<Cliente> {
    const { idCliente, ...datos } = cliente;
    return this.http.put<Cliente>(`${this.apiUrl}/${idCliente}`, datos).pipe(
      tap(data => console.log('Cliente actualizado:', data)),
      catchError(this.handleError)
    );
  }

  /**
   * Eliminar cliente
   */
  eliminarCliente(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => console.log('Cliente eliminado:', id)),
      catchError(this.handleError)
    );
  }

  /**
   * Obtener todas las provincias
   */
  obtenerProvincias(): Observable<Provincia[]> {
    return this.http.get<Provincia[]>(this.provinciaUrl).pipe(
      tap(data => console.log('Provincias obtenidas:', data)),
      catchError(this.handleError)
    );
  }

  /**
   * Obtener ciudades por provincia
   */
  obtenerCiudadesPorProvincia(idProvincia: number): Observable<Ciudad[]> {
    return this.http.get<Ciudad[]>(`${this.ciudadUrl}/provincia/${idProvincia}`).pipe(
      tap(data => console.log('Ciudades obtenidas:', data)),
      catchError(this.handleError)
    );
  }

  /**
   * Obtener todos los estados de cliente
   */
  obtenerEstadosCliente(): Observable<EstadoCliente[]> {
    return this.http.get<EstadoCliente[]>(this.estadoClienteUrl).pipe(
      tap(data => console.log('Estados obtenidos:', data)),
      catchError(this.handleError)
    );
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
    
    console.error('Error en ClientesService:', errorMessage, error);
    return throwError(() => new Error(errorMessage));
  }
}