// app.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { AuthService } from './modules/login/services/auth.service';
import { filter } from 'rxjs';
import { AlertasService } from './core/services/alertas';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  mostrarSidebar = false;
  reportesAbierto = false; 
  proyectoAbierto = false; 

  constructor(
    private authService: AuthService,
    private alertas: AlertasService,
    private router: Router
  ) {
    // Verificar ruta inicial
    this.verificarRuta(this.router.url);

    // Escuchar cambios de ruta
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.verificarRuta(event.url);
    });
  }

  private verificarRuta(url: string): void {
    const rutasPublicas = ['/login', '/registro', '/recuperar-password'];
    const estaEnRutaPublica = rutasPublicas.some(ruta => url.includes(ruta));
    
    this.mostrarSidebar = this.authService.estaAutenticado() && !estaEnRutaPublica;
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
        '¿Estás seguro de que deseas cerrar sesión?',
        'Sí, cerrar sesión'
      );

      if (confirmar) {

        this.reportesAbierto = false;
        this.proyectoAbierto = false;
        this.authService.cerrarSesion();
      }
    }

      toggleReportes() {
      this.reportesAbierto = !this.reportesAbierto;
    }
      toggleProyectos() { 
      this.proyectoAbierto = !this.proyectoAbierto;
    }

    

   // cerrarSesion(): void {
   // if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
   //   this.authService.cerrarSesion();
  // }
  }