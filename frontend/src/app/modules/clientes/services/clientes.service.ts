import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators'; // ← Agregar este import
import { Cliente, NuevoCliente, ActualizarCliente } from '../models/cliente.model'; // ← Agregar ActualizarCliente

@Injectable({
  providedIn: 'root'
})
export class ClientesService {
  private apiUrl = 'https://localhost:7163/api/Cliente';

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
    return this.http.post<Cliente>(this.apiUrl, cliente).pipe( // ← Cambiar PUT a POST
      tap(data => console.log('Cliente creado:', data)),
      catchError(this.handleError)
    );
  }

  /**
   * Actualizar cliente existente
   */
  actualizarCliente(cliente: ActualizarCliente): Observable<Cliente> {
    const { id, ...datos } = cliente;
    return this.http.put<Cliente>(`${this.apiUrl}/${id}`, datos).pipe(
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
   * Manejo de errores HTTP
   */
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Ocurrió un error desconocido';
    
    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Error del lado del servidor
      errorMessage = `Código: ${error.status}\nMensaje: ${error.message}`;
      
      // Mensajes específicos según el código de error
      switch (error.status) {
        case 404:
          errorMessage = 'Recurso no encontrado';
          break;
        case 500:
          errorMessage = 'Error interno del servidor';
          break;
        case 0:
          errorMessage = 'No se pudo conectar con el servidor. Verifica que el backend esté corriendo en http://localhost:7163';
          break;
      }
    }
    
    console.error('Error en ClientesService:', errorMessage, error);
    return throwError(() => new Error(errorMessage));
  }
}