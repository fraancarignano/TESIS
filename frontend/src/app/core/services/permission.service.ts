import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, tap, map, catchError } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface PermisoEfectivoItem {
  idPermiso: number;
  nombrePermiso: string;
  modulo: string;
  accion: string;
}

export interface PermisosEfectivosResponse {
  idUsuario: number;
  idRol: number;
  nombreRol: string;
  esAdmin: boolean;
  esSupervisor: boolean;
  esOperario: boolean;
  esDeposito: boolean;
  areasAsignadas: string[];
  permisos: PermisoEfectivoItem[];
}

@Injectable({
  providedIn: 'root'
})
export class PermissionService {
  private readonly apiUrl = `${environment.apiUrl}/Usuarios`;
  private readonly storageKey = 'permisos_efectivos';

  private permisosSet = new Set<string>();
  private permisosSubject = new BehaviorSubject<PermisosEfectivosResponse | null>(null);
  permisos$ = this.permisosSubject.asObservable();

  constructor(private http: HttpClient) {
    this.hidratarDesdeStorage();
  }

  cargarPermisos(idUsuario: number): Observable<PermisosEfectivosResponse> {
    const actual = this.permisosSubject.value;
    if (actual && actual.idUsuario === idUsuario) {
      return of(actual);
    }

    return this.http
      .get<PermisosEfectivosResponse>(`${this.apiUrl}/${idUsuario}/permisos-efectivos`)
      .pipe(
        tap((res) => {
          this.setPermisos(res);
        })
      );
  }

  asegurarPermisosCargados(idUsuario: number): Observable<boolean> {
    const actual = this.permisosSubject.value ?? this.hidratarDesdeStorage();
    if (actual && actual.idUsuario === idUsuario) {
      return of(true);
    }

    return this.cargarPermisos(idUsuario).pipe(
      map(() => true),
      catchError(() => of(false))
    );
  }

  tienePermiso(modulo: string, accion: string): boolean {
    if (this.esAdmin()) return true;
    const key = this.buildKey(modulo, accion);
    if (this.permisosSet.has(key)) return true;

    const perfil = this.permisosSubject.value ?? this.hidratarDesdeStorage();
    if (!perfil) return false;

    const moduloNorm = (modulo || '').trim().toLowerCase();
    const accionNorm = (accion || '').trim().toLowerCase();

    if (perfil.esOperario) {
      return (
        (moduloNorm === 'proyectos' && accionNorm === 'ver') ||
        (moduloNorm === 'proyectos' && accionNorm === 'veravanceareas') ||
        (moduloNorm === 'proyectos' && accionNorm === 'completararea') ||
        (moduloNorm === 'proyectos' && accionNorm === 'agregarobservacion')
      );
    }

    if (perfil.esSupervisor) {
      return (
        (moduloNorm === 'proyectos' && accionNorm === 'ver') ||
        (moduloNorm === 'clientes' && accionNorm === 'ver') ||
        (moduloNorm === 'inventario' && accionNorm === 'ver') ||
        (moduloNorm === 'dashboard' && accionNorm === 'ver') ||
        (moduloNorm === 'notificaciones' && (accionNorm === 'ver' || accionNorm === 'crear')) ||
        (moduloNorm === 'auditoria' && accionNorm === 'ver') ||
        (moduloNorm === 'usuarios' && (accionNorm === 'asignararea' || accionNorm === 'verareas' || accionNorm === 'verpermisos')) ||
        (moduloNorm === 'talleres' && accionNorm === 'gestionar')
      );
    }

    if (perfil.esDeposito) {
      return (
        (moduloNorm === 'inventario' && (accionNorm === 'ver' || accionNorm === 'recepcionar')) ||
        (moduloNorm === 'ubicaciones' && accionNorm === 'ver') ||
        (moduloNorm === 'ordenescompra' && accionNorm === 'recepcionar') ||
        (moduloNorm === 'notificaciones' && (accionNorm === 'ver' || accionNorm === 'crear'))
      );
    }

    return false;
  }

  esAdmin(): boolean {
    const perfil = this.permisosSubject.value ?? this.hidratarDesdeStorage();
    if (perfil?.esAdmin) return true;
    const usuarioRaw = localStorage.getItem('usuario');
    if (!usuarioRaw) return false;
    try {
      const usuario = JSON.parse(usuarioRaw);
      return Number(usuario?.idRol) === 1;
    } catch {
      return false;
    }
  }

  esSupervisor(): boolean {
    const perfil = this.permisosSubject.value ?? this.hidratarDesdeStorage();
    if (perfil) return perfil.esSupervisor;
    return false;
  }

  esOperario(): boolean {
    const perfil = this.permisosSubject.value ?? this.hidratarDesdeStorage();
    if (perfil) return perfil.esOperario;
    return false;
  }

  esDeposito(): boolean {
    const perfil = this.permisosSubject.value ?? this.hidratarDesdeStorage();
    if (perfil) return perfil.esDeposito;
    return false;
  }

  obtenerAreasAsignadas(): string[] {
    const perfil = this.permisosSubject.value ?? this.hidratarDesdeStorage();
    return perfil?.areasAsignadas ?? [];
  }

  limpiar(): void {
    this.permisosSet.clear();
    this.permisosSubject.next(null);
    sessionStorage.removeItem(this.storageKey);
  }

  private setPermisos(perfil: PermisosEfectivosResponse): void {
    this.permisosSet.clear();
    for (const permiso of perfil.permisos ?? []) {
      this.permisosSet.add(this.buildKey(permiso.modulo, permiso.accion));
    }
    this.permisosSubject.next(perfil);
    sessionStorage.setItem(this.storageKey, JSON.stringify(perfil));
  }

  private hidratarDesdeStorage(): PermisosEfectivosResponse | null {
    const raw = sessionStorage.getItem(this.storageKey);
    if (!raw) return null;

    try {
      const perfil = JSON.parse(raw) as PermisosEfectivosResponse;
      this.setPermisos(perfil);
      return perfil;
    } catch {
      sessionStorage.removeItem(this.storageKey);
      return null;
    }
  }

  private buildKey(modulo: string, accion: string): string {
    return `${(modulo || '').trim().toLowerCase()}::${(accion || '').trim().toLowerCase()}`;
  }
}
