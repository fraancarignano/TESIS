import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject, of, concat } from 'rxjs';
import { tap, catchError, map, finalize, shareReplay } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { 
  Proyecto, 
  ProyectoVista,
  CrearProyectoDTO, 
  EditarProyectoDTO,
  BuscarProyectosDTO,
  CambiarEstadoDTO,
  ActualizarAvanceDTO,
  RegistrarScrapDTO,
  AgregarObservacionDTO,
  CompletarAreaRequestDTO,
  ProyectoAvanceArea,
  MaterialAsignado,
  proyectoToVista,
  mapearEstadoParaBackend
} from '../models/proyecto.model';

@Injectable({
  providedIn: 'root'
})
export class ProyectosService {
  private apiUrl = `${environment.apiUrl}/Proyecto`;
  private readonly cacheKey = 'proyectos_cache_v2';
  private readonly cacheTimestampKey = 'proyectos_cache_v2_ts';
  private readonly cacheTtlMs = 5 * 60 * 1000; // 5 minutos
  
  private proyectosSubject = new BehaviorSubject<Proyecto[]>([]);
  public proyectos$ = this.proyectosSubject.asObservable();
  private fetchEnCurso$?: Observable<Proyecto[]>;

  constructor(private http: HttpClient) {}

  /**
   * Obtener todos los proyectos
   */
  obtenerProyectos(): Observable<Proyecto[]> {
    return this.obtenerProyectosDesdeApi();
  }

  /**
   * Carga rápida con cache local y actualización asíncrona.
   * Emite primero cache (si existe y no expiró) y luego el fetch real.
   */
  obtenerProyectosConCache(): Observable<Proyecto[]> {
    const cache = this.obtenerCacheValido();
    if (!cache) {
      return this.obtenerProyectosDesdeApi();
    }

    this.proyectosSubject.next(cache);
    return concat(
      of(cache),
      this.obtenerProyectosDesdeApi().pipe(
        catchError(() => of(cache))
      )
    );
  }

  /**
   * Obtener proyectos con datos calculados para la vista
   */
  obtenerProyectosVista(): Observable<ProyectoVista[]> {
    return this.obtenerProyectos().pipe(
      map(proyectos => proyectos.map(p => proyectoToVista(p)))
    );
  }

  /**
   * Obtener proyecto por ID
   */
  obtenerProyectoPorId(id: number): Observable<Proyecto> {
    return this.http.get<Proyecto>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Obtener proyectos por estado (para Kanban)
   */
  obtenerProyectosPorEstado(estado: string): Observable<Proyecto[]> {
    const estadoBackend = mapearEstadoParaBackend(estado);
    return this.http.get<Proyecto[]>(`${this.apiUrl}/estado/${estadoBackend}`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Buscar proyectos con filtros
   */
  buscarProyectos(filtros: BuscarProyectosDTO): Observable<Proyecto[]> {
    return this.http.post<Proyecto[]>(`${this.apiUrl}/buscar`, filtros).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Obtener proyectos asignados a un taller externo
   */
  obtenerProyectosPorTaller(idTaller: number): Observable<Proyecto[]> {
    return this.http.get<Proyecto[]>(`${environment.apiUrl}/Taller/${idTaller}/proyectos`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Crear nuevo proyecto
   */
  crearProyecto(proyecto: CrearProyectoDTO): Observable<Proyecto> {
    return this.http.post<Proyecto>(this.apiUrl, proyecto).pipe(
      tap(() => this.obtenerProyectos().subscribe()),
      catchError(this.handleError)
    );
  }

  /**
   * Actualizar proyecto
   */
  actualizarProyecto(id: number, proyecto: EditarProyectoDTO): Observable<Proyecto> {
    return this.http.put<Proyecto>(`${this.apiUrl}/${id}`, proyecto).pipe(
      tap(() => this.obtenerProyectos().subscribe()),
      catchError(this.handleError)
    );
  }

  /**
   * Cambiar estado (para drag & drop)
   */
  cambiarEstado(id: number, estado: string): Observable<any> {
    const dto: CambiarEstadoDTO = { 
      estado: mapearEstadoParaBackend(estado) 
    };
    return this.http.patch(`${this.apiUrl}/${id}/estado`, dto).pipe(
      tap(() => this.obtenerProyectos().subscribe()),
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

  /**
   * Eliminar definitivamente un proyecto Anulado/Archivado
   */
  eliminarProyectoDefinitivo(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}/definitivo`).pipe(
      tap(() => this.obtenerProyectos().subscribe()),
      catchError(this.handleError)
    );
  }

  /**
   * Agregar materiales al proyecto
   */
  agregarMateriales(id: number, materiales: MaterialAsignado[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/materiales`, materiales).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Actualizar avance de un área
   */
  actualizarAvance(id: number, avance: ActualizarAvanceDTO): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/avance`, avance).pipe(
      tap(() => this.obtenerProyectos().subscribe()),
      catchError(this.handleError)
    );
  }

  obtenerAvanceAreas(idProyecto: number): Observable<ProyectoAvanceArea[]> {
    return this.http.get<ProyectoAvanceArea[]>(`${this.apiUrl}/${idProyecto}/avance-areas`).pipe(
      catchError(this.handleError)
    );
  }

  completarArea(idProyecto: number, area: string, payload: CompletarAreaRequestDTO): Observable<any> {
    return this.http.post(`${this.apiUrl}/${idProyecto}/areas/${encodeURIComponent(area)}/completar`, payload).pipe(
      tap(() => this.obtenerProyectos().subscribe()),
      catchError(this.handleError)
    );
  }

  retrocederArea(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/retroceder-area`, {}).pipe(
      tap(() => this.obtenerProyectos().subscribe()),
      catchError(this.handleError)
    );
  }

  /**
   * Registrar scrap
   */
  registrarScrap(id: number, scrap: RegistrarScrapDTO): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/scrap`, scrap).pipe(
      tap(() => this.obtenerProyectos().subscribe()),
      catchError(this.handleError)
    );
  }

  obtenerScrapsProyecto(id: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${id}/scraps`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Agregar observación
   */
  agregarObservacion(id: number, observacion: AgregarObservacionDTO): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/observaciones`, observacion).pipe(
      tap(() => this.obtenerProyectos().subscribe()),
      catchError(this.handleError)
    );
  }

  private obtenerProyectosDesdeApi(): Observable<Proyecto[]> {
    if (this.fetchEnCurso$) {
      return this.fetchEnCurso$;
    }

    this.fetchEnCurso$ = this.http.get<Proyecto[]>(`${this.apiUrl}/resumen`).pipe(
      tap(proyectos => {
        this.proyectosSubject.next(proyectos);
        this.guardarCache(proyectos);
      }),
      catchError(this.handleError),
      finalize(() => {
        this.fetchEnCurso$ = undefined;
      }),
      shareReplay(1)
    );

    return this.fetchEnCurso$;
  }

  private obtenerCacheValido(): Proyecto[] | null {
    try {
      const cacheRaw = localStorage.getItem(this.cacheKey);
      const tsRaw = localStorage.getItem(this.cacheTimestampKey);
      if (!cacheRaw || !tsRaw) return null;

      const ageMs = Date.now() - Number(tsRaw);
      if (Number.isNaN(ageMs) || ageMs > this.cacheTtlMs) {
        return null;
      }

      const proyectos = JSON.parse(cacheRaw) as Proyecto[];
      return Array.isArray(proyectos) ? proyectos : null;
    } catch {
      return null;
    }
  }

  private guardarCache(proyectos: Proyecto[]): void {
    try {
      localStorage.setItem(this.cacheKey, JSON.stringify(proyectos));
      localStorage.setItem(this.cacheTimestampKey, Date.now().toString());
    } catch {
      // Ignorar errores de almacenamiento local.
    }
  }

  /**
   * Manejo de errores MEJORADO
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
        errorMessage = 'Proyecto no encontrado';
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
        errorMessage = 'No se puede conectar con el servidor';
      } else {
        errorMessage = `Error del servidor: ${error.status}`;
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
