import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface CrearNotificacionStockPayload {
  idInsumo: number;
  tipo: 'Faltante' | 'Sobrante';
  stockActual?: number;
  stockMinimo?: number;
  mensaje?: string;
}

export interface NotificacionStockItem {
  idHistorial: number;
  idUsuarioEmisor: number;
  usuarioEmisor: string;
  fecha: string;
  idInsumo: number;
  tipo: string;
  mensaje: string;
  leida: boolean;
}

export interface SolicitudMaterialItem {
  idSolicitud: number;
  idProyecto: number;
  nombreProyecto: string;
  nombreTipoInsumo?: string;
  colorSolicitado?: string;
  cantidadEstimada?: number;
  unidadMedida?: string;
  mensaje?: string;
  estado: string;
  usuarioEmisor: string;
  fechaSolicitud: string;
  fechaAtendida?: string;
}

export interface CrearSolicitudMaterialPayload {
  idProyecto: number;
  nombreProyecto: string;
  materiales: {
    idTipoInsumo?: number;
    nombreTipoInsumo?: string;
    colorSolicitado?: string;
    cantidadEstimada?: number;
    unidadMedida?: string;
    mensaje?: string;
  }[];
}

export interface NotificacionControlRecepcionItem {
  idHistorial: number;
  idOrdenCompra: number;
  nroOrden: string;
  /** "HabilitarControl" | "ControlCompletado" */
  tipo: string;
  mensaje: string;
  fecha: string;
  idUsuarioEmisor: number;
  usuarioEmisor: string;
  leida: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NotificacionesService {
  private readonly apiUrl = `${environment.apiUrl}/Notificaciones`;
  private readonly cambiosSubject = new Subject<void>();
  readonly cambios$ = this.cambiosSubject.asObservable();

  constructor(private http: HttpClient) {}

  crearNotificacionStock(payload: CrearNotificacionStockPayload): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/stock`, payload).pipe(
      tap(() => this.emitirCambio())
    );
  }

  obtenerNotificacionesStock(): Observable<NotificacionStockItem[]> {
    return this.http.get<NotificacionStockItem[]>(`${this.apiUrl}/stock`);
  }

  contarNotificacionesStock(): Observable<{ total: number }> {
    return this.http.get<{ total: number }>(`${this.apiUrl}/stock/count`);
  }

  marcarNotificacionLeida(idHistorial: number): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/stock/${idHistorial}/leer`, {}).pipe(
      tap(() => this.emitirCambio())
    );
  }

  // ── Solicitudes de material por proyecto ──────────────────────

  crearSolicitudMaterial(payload: CrearSolicitudMaterialPayload): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/solicitudes-material`, payload).pipe(
      tap(() => this.emitirCambio())
    );
  }

  obtenerSolicitudesMaterial(estado?: string): Observable<SolicitudMaterialItem[]> {
    const params = estado ? `?estado=${estado}` : '';
    return this.http.get<SolicitudMaterialItem[]>(`${this.apiUrl}/solicitudes-material${params}`);
  }

  contarSolicitudesPendientes(): Observable<{ total: number }> {
    return this.http.get<{ total: number }>(`${this.apiUrl}/solicitudes-material/count`);
  }

  atenderSolicitud(id: number): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/solicitudes-material/${id}/atender`, {}).pipe(
      tap(() => this.emitirCambio())
    );
  }

  // ── Control de Recepción de Pedidos ──────────────────────────

  crearNotificacionControlRecepcion(payload: { idOrdenCompra: number; nroOrden: string; tipo: 'HabilitarControl' | 'ControlCompletado' }): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/control-recepcion`, payload).pipe(
      tap(() => this.emitirCambio())
    );
  }

  obtenerNotificacionesControlRecepcion(): Observable<NotificacionControlRecepcionItem[]> {
    return this.http.get<NotificacionControlRecepcionItem[]>(`${this.apiUrl}/control-recepcion`);
  }

  contarNotificacionesControlRecepcion(): Observable<{ total: number }> {
    return this.http.get<{ total: number }>(`${this.apiUrl}/control-recepcion/count`);
  }

  marcarNotificacionControlLeida(idHistorial: number): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/control-recepcion/${idHistorial}/leer`, {}).pipe(
      tap(() => this.emitirCambio())
    );
  }

  emitirCambio(): void {
    this.cambiosSubject.next();
  }
}
