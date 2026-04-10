import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HasPermissionDirective } from '../../../core/directives/has-permission.directive';
import { AlertasService } from '../../../core/services/alertas';
import { PermissionService } from '../../../core/services/permission.service';
import { AuthService } from '../../login/services/auth.service';

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [CommonModule, RouterLink, HasPermissionDirective],
  templateUrl: './inicio.component.html',
  styleUrls: ['./inicio.component.css']
})
export class InicioComponent {
  constructor(
    private authService: AuthService,
    private alertas: AlertasService,
    public permissionService: PermissionService
  ) {}

  obtenerNombreUsuario(): string {
    const usuario = this.authService.obtenerUsuarioActual();
    if (!usuario) return 'Usuario';

    const nombre = usuario.nombreUsuario || '';
    const apellido = usuario.apellidoUsuario || '';
    const nombreCompleto = `${nombre} ${apellido}`.trim();
    return nombreCompleto || 'Usuario';
  }

  async cerrarSesion(): Promise<void> {
    const confirmar = await this.alertas.confirmar(
      'Est\u00e1s seguro de que deseas cerrar sesi\u00f3n?',
      'S\u00ed, cerrar sesi\u00f3n'
    );

    if (confirmar) {
      this.authService.cerrarSesion();
    }
  }
}
