import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Subscription } from 'rxjs';
import { HasPermissionDirective } from '../../core/directives/has-permission.directive';
import { AlertasService } from '../../core/services/alertas';
import { NotificacionesService } from '../../core/services/notificaciones.service';
import { PermissionService } from '../../core/services/permission.service';
import { AuthService } from '../../modules/login/services/auth.service';

@Component({
  selector: 'app-private-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, HasPermissionDirective],
  templateUrl: './private-layout.component.html',
  styleUrls: ['./private-layout.component.css']
})
export class PrivateLayoutComponent implements OnInit, OnDestroy {
  reportesAbierto = false;
  proyectoAbierto = false;
  usuariosAbierto = false;
  inventarioAbierto = false;
  notificacionesStockCount = 0;
  private timer?: any;
  private cambiosNotificacionesSub?: Subscription;

  constructor(
    private authService: AuthService,
    public permissionService: PermissionService,
    private alertas: AlertasService,
    private notificacionesService: NotificacionesService
  ) { }

  ngOnInit(): void {
    this.cargarCountNotificaciones();
    this.timer = setInterval(() => this.cargarCountNotificaciones(), 60000);
    this.cambiosNotificacionesSub = this.notificacionesService.cambios$.subscribe(() => {
      this.cargarCountNotificaciones();
    });
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
    this.cambiosNotificacionesSub?.unsubscribe();
  }

  tienePermiso(modulo: string, accion: string): boolean {
    return this.permissionService.tienePermiso(modulo, accion);
  }

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
      this.inventarioAbierto = false;
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

  toggleInventario(): void {
    this.inventarioAbierto = !this.inventarioAbierto;
  }

  private cargarCountNotificaciones(): void {
    if (!this.permissionService.tienePermiso('Notificaciones', 'Ver')) {
      this.notificacionesStockCount = 0;
      return;
    }

    this.notificacionesService.contarNotificacionesStock().subscribe({
      next: (res) => this.notificacionesStockCount = res.total || 0,
      error: () => this.notificacionesStockCount = 0
    });
  }
}
