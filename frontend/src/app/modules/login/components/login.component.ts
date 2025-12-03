import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { AlertasService } from '../../../core/services/alertas';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  nombreUsuario = '';
  password = ''; // ✅ Cambiado de contraseña a password
  mostrarPassword = false; // ✅ Cambiado de mostrarContraseña a mostrarPassword
  cargando = false;

  constructor(
    private authService: AuthService,
    private alertas: AlertasService
  ) {}

  toggleMostrarPassword(): void { // ✅ Cambiado
    this.mostrarPassword = !this.mostrarPassword;
  }

  async iniciarSesion(): Promise<void> {
    if (!this.nombreUsuario || !this.password) {
      this.alertas.error('Campos vacíos', 'Por favor completa todos los campos');
      return;
    }

    this.cargando = true;

    this.authService.login(this.nombreUsuario, this.password).subscribe({
      next: (response) => {
        this.cargando = false;
        if (response.token) {
          this.authService.guardarToken(response.token);
        }
        this.alertas.success('Bienvenido', 'Inicio de sesión exitoso');
        this.authService.navegarAClientes();
      },
      error: (error) => {
        this.cargando = false;
        this.alertas.error('Error de autenticación', 'Usuario o contraseña incorrectos');
        console.error('Error en login:', error);
      }
    });
  }
}