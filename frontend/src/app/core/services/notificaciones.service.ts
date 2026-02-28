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

  emitirCambio(): void {
    this.cambiosSubject.next();
  }
}
