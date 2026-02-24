import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

// Interfaz para el resumen del reporte
export interface ResumenInventarioCritico {
  totalInsumosMonitoreados: number;
  insumosCriticos: number;
  insumosAgotados: number;
  insumosBajos: number;
  insumosAlerta: number;
  porcentajeCriticidad: number;
  insumos: InventarioCritico[];
}

// Interfaz para cada insumo crítico
export interface InventarioCritico {
  idInsumo: number;
  nombreInsumo: string;
  tipoInsumo: string;
  stockActual: number;
  stockMinimo: number;
  unidadMedida: string;
  nivelCriticidad: string;
  diasRestantes?: number;
  ultimaActualizacion: Date;
}

// Interfaz para el dashboard
export interface DashboardInventario {
  stockPorTipo: StockPorTipo[];
  movimientosRecientes: MovimientoReciente[];
  topInsumosUsados: InsumoUsado[];
}

export interface StockPorTipo {
  tipo: string;
  total: number;
  criticos: number;
}

export interface MovimientoReciente {
  periodo: string;
  entradas: number;
  salidas: number;
}

export interface InsumoUsado {
  insumo: string;
  cantidadUsada: number;
}

export interface ProduccionPorPrenda {
  nombrePrenda: string;
  cantidadProducida: number;
}

export interface EvolucionPrenda {
  año: number;
  mes: number;
  cantidad: number;
}

export interface ClienteResumen {
  idCliente: number;
  nombre: string;
}


@Injectable({
  providedIn: 'root'
})
export class ReportesService {
  public apiUrl = `${environment.apiUrl}/Reportes`;

  constructor(private http: HttpClient) { }

  /**
   * Obtener reporte de inventario crítico
   */
  obtenerReporteInventarioCritico(): Observable<ResumenInventarioCritico> {
    console.log('🔍 Llamando a:', `${this.apiUrl}/inventario-critico`);

    return this.http.get<ResumenInventarioCritico>(`${this.apiUrl}/inventario-critico`)
      .pipe(
        tap(datos => console.log('✅ Datos recibidos:', datos)),
        catchError(this.handleError)
      );
  }

  /**
   * Obtener estadísticas del dashboard
   */
  obtenerDashboardInventario(): Observable<DashboardInventario> {
    console.log('🔍 Llamando a:', `${this.apiUrl}/dashboard-inventario`);

    return this.http.get<DashboardInventario>(`${this.apiUrl}/dashboard-inventario`)
      .pipe(
        tap(datos => console.log('✅ Dashboard recibido:', datos)),
        catchError(this.handleError)
      );
  }

  /**
   * Obtener reporte de producción por tipo de prenda (con filtros)
   */
  obtenerProduccionPorTipoPrenda(
    fechaInicio?: string, fechaFin?: string, idCliente?: number, nombrePrenda?: string
  ): Observable<ProduccionPorPrenda[]> {
    const params: string[] = [];
    if (fechaInicio) params.push(`fechaInicio=${fechaInicio}`);
    if (fechaFin) params.push(`fechaFin=${fechaFin}`);
    if (idCliente) params.push(`idCliente=${idCliente}`);
    if (nombrePrenda) params.push(`nombrePrenda=${encodeURIComponent(nombrePrenda)}`);
    const qs = params.length ? `?${params.join('&')}` : '';

    return this.http.get<ProduccionPorPrenda[]>(`${this.apiUrl}/produccion-por-prenda${qs}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Obtener evolución temporal de una prenda por mes
   */
  obtenerEvolucionPrenda(
    nombrePrenda: string, fechaInicio?: string, fechaFin?: string, idCliente?: number
  ): Observable<EvolucionPrenda[]> {
    const params: string[] = [`nombrePrenda=${encodeURIComponent(nombrePrenda)}`];
    if (fechaInicio) params.push(`fechaInicio=${fechaInicio}`);
    if (fechaFin) params.push(`fechaFin=${fechaFin}`);
    if (idCliente) params.push(`idCliente=${idCliente}`);

    return this.http.get<EvolucionPrenda[]>(`${this.apiUrl}/evolucion-prenda?${params.join('&')}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Clientes que tienen proyectos (para el filtro)
   */
  obtenerClientesConProyectos(): Observable<ClienteResumen[]> {
    return this.http.get<ClienteResumen[]>(`${this.apiUrl}/clientes-con-proyectos`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Tipos de prenda usados en proyectos (para el filtro)
   */
  obtenerTiposPrenda(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/tipos-prenda`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Manejo centralizado de errores
   */
  private handleError(error: HttpErrorResponse) {
    let mensajeError = 'Ocurrió un error desconocido';

    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      console.error('❌ Error del cliente:', error.error.message);
      mensajeError = `Error: ${error.error.message}`;
    } else {
      // Error del lado del servidor
      console.error(
        `❌ Error del servidor:\n` +
        `  Código: ${error.status}\n` +
        `  Mensaje: ${error.message}\n` +
        `  Body:`, error.error
      );

      // Mensajes más específicos según el código de error
      switch (error.status) {
        case 0:
          mensajeError = 'No se pudo conectar al servidor. Verifica que el backend esté corriendo.';
          break;
        case 404:
          mensajeError = 'El endpoint no fue encontrado (404)';
          break;
        case 500:
          mensajeError = error.error?.message || 'Error interno del servidor (500)';
          break;
        default:
          mensajeError = `Error ${error.status}: ${error.message}`;
      }
    }

    return throwError(() => new Error(mensajeError));
  }
}
