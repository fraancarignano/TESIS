import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:7163/api/Login/login'; // Ajustá el puerto según tu backend

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  login(nombreUsuario: string, contraseña: string): Observable<any> {
    return this.http.post(this.apiUrl, {
      nombreUsuario,
      contraseña
    });
  }

  guardarToken(token: string): void {
    localStorage.setItem('token', token);
  }

  obtenerToken(): string | null {
    return localStorage.getItem('token');
  }

  estaAutenticado(): boolean {
    return !!this.obtenerToken();
  }

  cerrarSesion(): void {
    localStorage.removeItem('token');
    this.router.navigate(['/login']);
  }

  navegarAClientes(): void {
    this.router.navigate(['/clientes']);
  }
}