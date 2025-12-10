import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { AlertasService } from '../../../core/services/alertas';
import { LoginCredentials } from '../models/auth.model';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  nombreUsuario = '';
  password = '';
  mostrarPassword = false;
  cargando = false;

  constructor(
    private authService: AuthService,
    private alertas: AlertasService
  ) {}

  toggleMostrarPassword(): void {
    this.mostrarPassword = !this.mostrarPassword;
  }

  async iniciarSesion(): Promise<void> {
    // Validación de campos vacíos
    if (!this.nombreUsuario.trim() || !this.password.trim()) {
      this.alertas.error('Campos vacíos', 'Por favor completa todos los campos');
      return;
    }

    this.cargando = true;

    // Crear objeto tipado con las credenciales
    const credentials: LoginCredentials = {
      nombreUsuario: this.nombreUsuario.trim(),
      contraseña: this.password // ⚠️ El backend espera "contraseña", no "password"
    };

    this.authService.login(credentials).subscribe({
      next: (response) => {
        this.cargando = false;
        
        // El servicio ya guarda el token automáticamente con el operador tap()
        this.alertas.success(
          `¡Bienvenido ${response.nombreUsuario}!`, 
          'Inicio de sesión exitoso'
        );
        
        this.authService.navegarAClientes();
      },
      error: (error) => {
        this.cargando = false;
        
        // Manejo de errores más detallado
        const mensaje = error.error?.message || 'Usuario o contraseña incorrectos';
        this.alertas.error('Error de autenticación', mensaje);
        
        console.error('Error en login:', error);
      }
    });
  }

  // Método opcional para limpiar el formulario
  limpiarFormulario(): void {
    this.nombreUsuario = '';
    this.password = '';
    this.mostrarPassword = false;
  }
}