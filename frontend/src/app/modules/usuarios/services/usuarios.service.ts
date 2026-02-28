import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  Permiso,
  RolUsuario,
  UsuarioAuditoria,
  UsuarioInterno,
  UsuarioInternoCreate,
  UsuarioInternoUpdate
} from '../models/usuario.model';

@Injectable({
  providedIn: 'root'
})
export class UsuariosService {
  private apiUrl = `${environment.apiUrl}/Login`;

  constructor(private http: HttpClient) {}

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

  obtenerPermisos(): Observable<Permiso[]> {
    return this.http.get<Permiso[]>(`${this.apiUrl}/permisos`);
  }

  obtenerAuditoria(idUsuario: number): Observable<UsuarioAuditoria> {
    return this.http.get<UsuarioAuditoria>(`${this.apiUrl}/usuarios/${idUsuario}/auditoria`);
  }
}
