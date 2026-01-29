// auth.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { 
  LoginCredentials, 
  LoginResponse, 
  UsuarioCreate, 
  Usuario, 
  Rol 
} from '../models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'https://localhost:7163/api/Login';
  private tokenExpirationTimer: any;

  constructor(
    private http: HttpClient,
    public router: Router
  ) {
    // Verificar token al iniciar el servicio
    this.verificarSesionAlCargar();
  }

  // ==================== LOGIN ====================
  login(credentials: LoginCredentials): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credentials)
      .pipe(
        tap(response => {
          if (response.token) {
            this.guardarToken(response.token);
            this.guardarUsuario(response);
            this.iniciarTemporizadorExpiracion();
          }
        })
      );
  }

  // ==================== REGISTRO ====================
  registrarUsuario(usuario: UsuarioCreate): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/registrar`, usuario);
  }

  // ==================== USUARIOS ====================
  obtenerUsuarios(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(`${this.apiUrl}/usuarios`, {
      headers: this.obtenerHeaders()
    });
  }

  obtenerUsuarioPorId(id: number): Observable<LoginResponse> {
    return this.http.get<LoginResponse>(`${this.apiUrl}/usuarios/${id}`, {
      headers: this.obtenerHeaders()
    });
  }

  // ==================== ROLES ====================
  obtenerRoles(): Observable<Rol[]> {
    return this.http.get<Rol[]>(`${this.apiUrl}/roles`);
  }

  // ==================== TOKEN Y STORAGE ====================
  private guardarToken(token: string): void {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiracion = payload.exp * 1000; // Convertir a milisegundos
      
      localStorage.setItem('token', token);
      localStorage.setItem('token_expiration', expiracion.toString());
    } catch (error) {
      console.error('Error al guardar el token:', error);
      this.limpiarSesion();
    }
  }

  private guardarUsuario(usuario: LoginResponse): void {
    localStorage.setItem('usuario', JSON.stringify(usuario));
  }

  obtenerToken(): string | null {
    const token = localStorage.getItem('token');
    const expiracion = localStorage.getItem('token_expiration');
    
    // Si no hay token o expiración, limpiar y retornar null
    if (!token || !expiracion) {
      this.limpiarSesion();
      return null;
    }
    
    // Si el token expiró, limpiar y retornar null
    if (Date.now() >= parseInt(expiracion)) {
      console.log('🔒 Token expirado, limpiando sesión...');
      this.limpiarSesion();
      return null;
    }
    
    return token;
  }

  obtenerUsuarioActual(): LoginResponse | null {
    const usuario = localStorage.getItem('usuario');
    return usuario ? JSON.parse(usuario) : null;
  }

  obtenerHeaders(): HttpHeaders {
    const token = this.obtenerToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  private limpiarSesion(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('token_expiration');
    localStorage.removeItem('usuario');
    
    if (this.tokenExpirationTimer) {
      clearTimeout(this.tokenExpirationTimer);
    }
  }

  // ==================== AUTO-LOGOUT ====================
  private iniciarTemporizadorExpiracion(): void {
    const expiracion = localStorage.getItem('token_expiration');
    if (!expiracion) return;
    
    const tiempoRestante = parseInt(expiracion) - Date.now();
    
    if (tiempoRestante > 0) {
      console.log(`⏱️ Sesión expirará en ${Math.round(tiempoRestante / 1000 / 60)} minutos`);
      
      this.tokenExpirationTimer = setTimeout(() => {
        console.log('⏰ Sesión expirada automáticamente');
        this.cerrarSesionPorExpiracion();
      }, tiempoRestante);
    } else {
      this.limpiarSesion();
    }
  }

  private verificarSesionAlCargar(): void {
    // Al cargar la app, verificar si el token sigue válido
    const token = this.obtenerToken();
    if (token) {
      this.iniciarTemporizadorExpiracion();
    }
  }

  private cerrarSesionPorExpiracion(): void {
    this.limpiarSesion();
    this.router.navigate(['/login'], {
      queryParams: { sesionExpirada: 'true' }
    });
  }

  // ==================== AUTENTICACIÓN ====================
  estaAutenticado(): boolean {
    const token = this.obtenerToken(); // Ya valida la expiración internamente
    return !!token;
  }

  cerrarSesion(): void {
    console.log('👋 Cerrando sesión manualmente');
    this.limpiarSesion();
    this.router.navigate(['/login']);
  }

  // ==================== NAVEGACIÓN ====================
  navegarAClientes(): void {
    this.router.navigate(['/proyectos']);
  }

  navegarADashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  
}