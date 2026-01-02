import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
//import { environment } from '../../../../environments/environment';
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
  MaterialAsignado,
  proyectoToVista,
  mapearEstadoParaBackend
} from '../models/proyecto.model';

@Injectable({
  providedIn: 'root'
})
export class ProyectosService {
   private apiUrl = 'https://localhost:7163/api/Proyecto';
  
  private proyectosSubject = new BehaviorSubject<Proyecto[]>([]);
  public proyectos$ = this.proyectosSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Obtener todos los proyectos
   */
  obtenerProyectos(): Observable<Proyecto[]> {
    return this.http.get<Proyecto[]>(this.apiUrl).pipe(
      tap(proyectos => this.proyectosSubject.next(proyectos)),
      catchError(this.handleError)
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

  /**
   * Registrar scrap
   */
  registrarScrap(id: number, scrap: RegistrarScrapDTO): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/scrap`, scrap).pipe(
      tap(() => this.obtenerProyectos().subscribe()),
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

  /**
   * Manejo de errores
   */
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Ocurrió un error desconocido';

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      if (error.status === 404) {
        errorMessage = 'Proyecto no encontrado';
      } else if (error.status === 400) {
        errorMessage = error.error?.message || 'Datos inválidos';
      } else if (error.status === 0) {
        errorMessage = 'No se puede conectar con el servidor';
      } else {
        errorMessage = `Error del servidor: ${error.status}`;
      }
    }

    return throwError(() => new Error(errorMessage));
  }
}