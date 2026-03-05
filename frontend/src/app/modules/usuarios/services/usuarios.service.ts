import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  AreaSubrol,
  GuardarPermisoItem,
  PermisoPanelResponse,
  RolUsuario,
  UsuarioAuditoria,
  UsuarioInterno,
  UsuarioInternoCreate,
  UsuarioInternoUpdate
} from '../models/usuario.model';

@Injectable({ providedIn: 'root' })
export class UsuariosService {
  private apiUrl = `${environment.apiUrl}/Login`;
  private apiUrlUsuarios = `${environment.apiUrl}/Usuarios`;

  constructor(private http: HttpClient) { }

  obtenerUsuarios(): Observable<UsuarioInterno[]> {
    return this.http.get<UsuarioInterno[]>(`${this.apiUrl}/usuarios`);
  }

  crearUsuario(payload: UsuarioInternoCreate): Observable<UsuarioInterno> {
    return this.http.post<UsuarioInterno>(`${this.apiUrl}/usuarios`, payload);
  }

  actualizarUsuario(idUsuario: number, payload: UsuarioInternoUpdate): Observable<UsuarioInterno> {
    return this.http.put<UsuarioInterno>(`${this.apiUrl}/usuarios/${idUsuario}`, payload);
  }

  borrarUsuario(idUsuario: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/usuarios/${idUsuario}`);
  }

  obtenerRoles(): Observable<RolUsuario[]> {
    return this.http.get<RolUsuario[]>(`${this.apiUrl}/roles`);
  }

  obtenerAreasSubrol(): Observable<AreaSubrol[]> {
    return this.http.get<AreaSubrol[]>(`${this.apiUrl}/areas`);
  }

  obtenerAuditoria(idUsuario: number): Observable<UsuarioAuditoria> {
    return this.http.get<UsuarioAuditoria>(`${this.apiUrl}/usuarios/${idUsuario}/auditoria`);
  }

  obtenerPermisosPanel(idUsuario: number): Observable<PermisoPanelResponse> {
    return this.http.get<PermisoPanelResponse>(`${this.apiUrlUsuarios}/${idUsuario}/permisos-panel`);
  }

  guardarPermisos(idUsuario: number, permisos: GuardarPermisoItem[]): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.apiUrlUsuarios}/${idUsuario}/permisos`, { permisos });
  }
}
