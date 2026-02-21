import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AlertasService } from '../../core/services/alertas';
import { AuthService } from '../../modules/login/services/auth.service';

@Component({
  selector: 'app-private-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './private-layout.component.html',
  styleUrls: ['./private-layout.component.css']
})
export class PrivateLayoutComponent {
  reportesAbierto = false;
  proyectoAbierto = false;
  usuariosAbierto = false;

  constructor(
    private authService: AuthService,
    private alertas: AlertasService
  ) {}

  obtenerNombreUsuario(): string {
    const usuario = this.authService.obtenerUsuarioActual();
    if (usuario) {
      return `${usuario.nombreUsuario} `.trim();
    }
    return 'Usuario';
  }

  obtenerIniciales(): string {
    const usuario = this.authService.obtenerUsuarioActual();
    if (usuario) {
      const nombre = usuario.nombreUsuario?.charAt(0) || '';
      const apellido = usuario.apellidoUsuario?.charAt(0) || '';
      return (nombre + apellido).toUpperCase();
    }
    return 'U';
  }

  async cerrarSesion(): Promise<void> {
    const confirmar = await this.alertas.confirmar(
      'Estas seguro de que deseas cerrar sesion?',
      'Si, cerrar sesion'
    );

    if (confirmar) {
      this.reportesAbierto = false;
      this.proyectoAbierto = false;
      this.usuariosAbierto = false;
      this.authService.cerrarSesion();
    }
  }

  toggleReportes(): void {
    this.reportesAbierto = !this.reportesAbierto;
  }

  toggleProyectos(): void {
    this.proyectoAbierto = !this.proyectoAbierto;
  }

  toggleUsuarios(): void {
    this.usuariosAbierto = !this.usuariosAbierto;
  }
}
