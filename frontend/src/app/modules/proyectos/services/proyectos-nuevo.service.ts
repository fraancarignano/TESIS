import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { 
  ProyectoCrearNuevo,
  ProyectoDetalle,
  FormularioProyectoInicializacion,
  CalculoMaterialesRequest,
  CalculoMaterialesResponse,
  ValidacionStock,
  ValidarTallesRequest,
  ValidarTallesResponse,
  ProyectoPrendaDTO
} from '../models/nuevo-proyecto.model'

// Mantener compatibilidad con el servicio anterior
import { Proyecto } from '../models/proyecto.model';

@Injectable({
  providedIn: 'root'
})
export class ProyectosServiceNuevo{
  private apiUrl = 'https://localhost:7163/api/Proyecto';
  
  private proyectosSubject = new BehaviorSubject<ProyectoDetalle[]>([]);
  public proyectos$ = this.proyectosSubject.asObservable();

  constructor(private http: HttpClient) {}

  // ========================================
  // INICIALIZACIÓN DEL FORMULARIO
  // ========================================

  /**
   * Obtiene todos los datos necesarios para inicializar el formulario
   */
  obtenerDatosFormulario(): Observable<FormularioProyectoInicializacion> {
    return this.http.get<FormularioProyectoInicializacion>(`${this.apiUrl}/formulario/inicializacion`).pipe(
      catchError(this.handleError)
    );
  }

  // ========================================
  // CRUD PROYECTOS
  // ========================================

  /**
   * Obtener todos los proyectos
   */
  obtenerProyectos(): Observable<ProyectoDetalle[]> {
    return this.http.get<ProyectoDetalle[]>(this.apiUrl).pipe(
      tap(proyectos => this.proyectosSubject.next(proyectos)),
      catchError(this.handleError)
    );
  }

  /**
   * Obtener proyecto por ID
   */
  obtenerProyectoPorId(id: number): Observable<ProyectoDetalle> {
    return this.http.get<ProyectoDetalle>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Crear nuevo proyecto con múltiples prendas
   */
  crearProyecto(proyecto: ProyectoCrearNuevo): Observable<ProyectoDetalle> {
    return this.http.post<ProyectoDetalle>(this.apiUrl, proyecto).pipe(
      tap(() => this.obtenerProyectos().subscribe()),
      catchError(this.handleError)
    );
  }

  /**
 * Actualizar proyecto existente
 */
actualizarProyecto(id: number, proyecto: any): Observable<any> {
  return this.http.put<any>(`${this.apiUrl}/${id}`, proyecto).pipe(
    tap(() => this.obtenerProyectos().subscribe()),
    catchError(this.handleError)
  );
}

/**
 * Validar qué se puede editar según estado
 */
validarEdicion(id: number): Observable<any> {
  return this.http.get<any>(`${this.apiUrl}/${id}/validar-edicion`).pipe(
    catchError(this.handleError)
  );
}

/**
 * Obtener historial de cambios
 */
obtenerHistorial(id: number, pagina: number = 1, tamanoPagina: number = 20): Observable<any[]> {
  return this.http.get<any[]>(`${this.apiUrl}/${id}/historial?pagina=${pagina}&tamanoPagina=${tamanoPagina}`).pipe(
    catchError(this.handleError)
  );
}

  /**
   * Obtener proyectos por estado
   */
  obtenerProyectosPorEstado(estado: string): Observable<ProyectoDetalle[]> {
    return this.http.get<ProyectoDetalle[]>(`${this.apiUrl}/estado/${estado}`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Obtener proyectos por cliente
   */
  obtenerProyectosPorCliente(idCliente: number): Observable<ProyectoDetalle[]> {
    return this.http.get<ProyectoDetalle[]>(`${this.apiUrl}/cliente/${idCliente}`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Eliminar (archivar) proyecto
   */
  eliminarProyecto(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.obtenerProyectos().subscribe()),
      catchError(this.handleError)
    );
  }

  // ========================================
  // CÁLCULO Y VALIDACIÓN DE MATERIALES
  // ========================================

  /**
   * Calcular materiales necesarios (preview antes de crear)
   */
  calcularMateriales(request: CalculoMaterialesRequest): Observable<CalculoMaterialesResponse> {
    return this.http.post<CalculoMaterialesResponse>(`${this.apiUrl}/calcular-materiales`, request).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Validar si hay stock suficiente
   */
  validarStock(prendas: any[], materialesManuales?: any[]): Observable<ValidacionStock> {
    const body = { prendas, materialesManuales };
    return this.http.post<ValidacionStock>(`${this.apiUrl}/validar-stock`, body).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Recalcular materiales de un proyecto existente
   */
  recalcularMateriales(idProyecto: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${idProyecto}/recalcular-materiales`, {}).pipe(
      tap(() => this.obtenerProyectos().subscribe()),
      catchError(this.handleError)
    );
  }

  // ========================================
  // PRENDAS Y TALLES
  // ========================================

  /**
   * Obtener prendas de un proyecto
   */
  obtenerPrendasProyecto(idProyecto: number): Observable<ProyectoPrendaDTO[]> {
    return this.http.get<ProyectoPrendaDTO[]>(`${this.apiUrl}/${idProyecto}/prendas`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Validar distribución de talles
   */
  validarTalles(request: ValidarTallesRequest): Observable<ValidarTallesResponse> {
    return this.http.post<ValidarTallesResponse>(`${this.apiUrl}/validar-talles`, request).pipe(
      catchError(this.handleError)
    );
  }

  // ========================================
  // MÉTODOS AUXILIARES
  // ========================================

  /**
   * Validar formulario antes de enviar
   */
  validarFormularioLocal(proyecto: ProyectoCrearNuevo): { esValido: boolean; errores: string[] } {
    const errores: string[] = [];

    // Validar datos básicos
    if (!proyecto.idCliente) {
      errores.push('Debe seleccionar un cliente');
    }

    if (!proyecto.nombreProyecto || proyecto.nombreProyecto.trim().length < 3) {
      errores.push('El nombre del proyecto debe tener al menos 3 caracteres');
    }

    if (!proyecto.fechaInicio) {
      errores.push('Debe especificar la fecha de inicio');
    }

    // Validar prendas
    if (!proyecto.prendas || proyecto.prendas.length === 0) {
      errores.push('Debe agregar al menos una prenda');
    }

    // Validar cada prenda
    proyecto.prendas?.forEach((prenda, index) => {
      if (!prenda.idTipoPrenda) {
        errores.push(`Prenda ${index + 1}: Debe seleccionar el tipo de prenda`);
      }

      if (!prenda.idTipoInsumoMaterial) {
        errores.push(`Prenda ${index + 1}: Debe seleccionar el material`);
      }

      if (!prenda.cantidadTotal || prenda.cantidadTotal <= 0) {
        errores.push(`Prenda ${index + 1}: La cantidad debe ser mayor a 0`);
      }

      if (!prenda.talles || prenda.talles.length === 0) {
        errores.push(`Prenda ${index + 1}: Debe distribuir las cantidades por talle`);
      }

      // Validar suma de talles
      const sumaTalles = prenda.talles?.reduce((acc, t) => acc + t.cantidad, 0) || 0;
      if (sumaTalles !== prenda.cantidadTotal) {
        errores.push(
          `Prenda ${index + 1}: La suma de talles (${sumaTalles}) no coincide con la cantidad total (${prenda.cantidadTotal})`
        );
      }
    });

    return {
      esValido: errores.length === 0,
      errores
    };
  }

  /**
   * Manejo de errores
   */
  private handleError(error: HttpErrorResponse) {
    console.error('🔴 HTTP Error completo:', error);
    
    let errorMessage = 'Ocurrió un error desconocido';

    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Error del lado del servidor
      if (error.status === 404) {
        errorMessage = 'Recurso no encontrado';
      } else if (error.status === 400) {
        // Intentar extraer el mensaje del backend
        if (typeof error.error === 'string') {
          errorMessage = error.error;
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        } else if (error.error?.errors) {
          // Errores de validación de .NET
          const errors = error.error.errors;
          const errorMessages = Object.keys(errors).map(key => 
            `${key}: ${errors[key].join(', ')}`
          );
          errorMessage = errorMessages.join(' | ');
        } else if (error.error?.title) {
          errorMessage = error.error.title;
        } else {
          errorMessage = 'Datos inválidos. Verifica los campos del formulario.';
        }
      } else if (error.status === 0) {
        errorMessage = 'No se puede conectar con el servidor. Verifica tu conexión.';
      } else if (error.status === 500) {
        errorMessage = 'Error interno del servidor. Contacta al administrador.';
      } else {
        errorMessage = `Error del servidor: ${error.status} - ${error.statusText}`;
      }
    }

    // Retornar el error HTTP completo para mejor debugging
    return throwError(() => ({
      message: errorMessage,
      status: error.status,
      statusText: error.statusText,
      error: error.error
    }));
  }
}