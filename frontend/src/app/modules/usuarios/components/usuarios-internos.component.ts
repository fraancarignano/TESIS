import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AlertasService } from '../../../core/services/alertas';
import { UsuariosService } from '../services/usuarios.service';
import { AreaSubrol, RolUsuario, UsuarioAuditoria, UsuarioInterno } from '../models/usuario.model';
import { UsuarioDetalleModalComponent } from './usuario-detalle-modal/usuario-detalle-modal.component';
import { UsuarioFormComponent, UsuarioFormSubmit } from './usuario-form/usuario-form.component';

@Component({
  selector: 'app-usuarios-internos',
  standalone: true,
  imports: [CommonModule, FormsModule, UsuarioFormComponent, UsuarioDetalleModalComponent],
  templateUrl: './usuarios-internos.component.html',
  styleUrls: ['./usuarios-internos.component.css']
})
export class UsuariosInternosComponent implements OnInit {
  usuarios: UsuarioInterno[] = [];
  roles: RolUsuario[] = [];
  areasSubrol: AreaSubrol[] = [];

  terminoBusqueda = '';
  loading = false;
  error = false;

  mostrarFormulario = false;
  mostrarDetalle = false;

  usuarioSeleccionado: UsuarioInterno | null = null;
  usuarioDetalle: UsuarioInterno | null = null;

  auditoriaDetalle: UsuarioAuditoria | null = null;
  loadingAuditoria = false;

  subRolesSeleccionados: number[] = [];

  constructor(
    private usuariosService: UsuariosService,
    private alertas: AlertasService
  ) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.loading = true;
    this.error = false;

    this.usuariosService.obtenerUsuarios().subscribe({
      next: (data) => {
        this.usuarios = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.error = true;
      }
    });

    this.usuariosService.obtenerRoles().subscribe({
      next: (roles) => {
        const tieneDeposito = roles.some(r => this.normalizarTexto(r.nombreRol) === 'deposito');
        this.roles = tieneDeposito
          ? roles
          : [...roles, { idRol: 4, nombreRol: 'Deposito' }];
      }
    });

    this.usuariosService.obtenerAreasSubrol().subscribe({
      next: (areas) => {
        this.areasSubrol = areas.filter(a => this.normalizarTexto(a.nombreArea) !== 'confeccion');
      }
    });
  }

  get usuariosFiltrados(): UsuarioInterno[] {
    if (!this.terminoBusqueda) return this.usuarios;

    const t = this.terminoBusqueda.toLowerCase();
    return this.usuarios.filter(u =>
      `${u.nombre} ${u.apellido}`.toLowerCase().includes(t) ||
      u.nombreUsuarioIngreso.toLowerCase().includes(t) ||
      u.nombreRol.toLowerCase().includes(t) ||
      u.estado.toLowerCase().includes(t)
    );
  }

  abrirFormularioNuevo(): void {
    this.usuarioSeleccionado = null;
    this.subRolesSeleccionados = [];
    this.mostrarFormulario = true;
  }

  abrirFormularioEditar(usuario: UsuarioInterno, event: Event): void {
    event.stopPropagation();
    this.usuarioSeleccionado = { ...usuario };
    this.subRolesSeleccionados = usuario.subRolesAreaIds || [];
    this.mostrarFormulario = true;
  }

  cerrarFormulario(): void {
    this.mostrarFormulario = false;
    this.usuarioSeleccionado = null;
  }

  guardarUsuario(payload: UsuarioFormSubmit): void {
    const request = {
      nombre: payload.nombre,
      apellido: payload.apellido,
      nombreUsuarioIngreso: payload.nombreUsuarioIngreso,
      contrasena: payload.contrasena,
      idRol: payload.idRol,
      estado: payload.estado,
      subRolesAreaIds: payload.subRoles
    };

    if (this.usuarioSeleccionado) {
      this.usuariosService.actualizarUsuario(this.usuarioSeleccionado.idUsuario, request).subscribe({
        next: () => {
          this.alertas.success('Usuario actualizado', 'Se guardaron los cambios');
          this.cerrarFormulario();
          this.cargarDatos();
        },
        error: (err) => this.alertas.error('Error', err?.error?.message || 'No se pudo actualizar')
      });
      return;
    }

    this.usuariosService.crearUsuario({
      nombre: payload.nombre,
      apellido: payload.apellido,
      nombreUsuarioIngreso: payload.nombreUsuarioIngreso,
      contrasena: payload.contrasena || '',
      idRol: payload.idRol,
      subRolesAreaIds: payload.subRoles
    }).subscribe({
      next: () => {
        this.alertas.success('Usuario creado', 'Alta de usuario interno correcta');
        this.cerrarFormulario();
        this.cargarDatos();
      },
      error: (err) => this.alertas.error('Error', err?.error?.message || 'No se pudo crear el usuario')
    });
  }

  async eliminarUsuario(usuario: UsuarioInterno, event: Event): Promise<void> {
    event.stopPropagation();

    const confirm = await this.alertas.confirmar(
      '¿Desactivar usuario?',
      `Se desactivará a ${usuario.nombre} ${usuario.apellido}`,
      'Sí, desactivar'
    );

    if (!confirm) return;

    this.usuariosService.borrarUsuario(usuario.idUsuario).subscribe({
      next: () => {
        this.alertas.success('Usuario desactivado', 'Se realizó la baja lógica');
        this.cargarDatos();
      },
      error: (err) => this.alertas.error('Error', err?.error?.message || 'No se pudo desactivar')
    });
  }

  abrirDetalle(usuario: UsuarioInterno): void {
    this.usuarioDetalle = usuario;
    this.mostrarDetalle = true;
    this.loadingAuditoria = true;
    this.auditoriaDetalle = null;

    this.usuariosService.obtenerAuditoria(usuario.idUsuario).subscribe({
      next: (auditoria) => {
        this.auditoriaDetalle = auditoria;
        this.loadingAuditoria = false;
      },
      error: () => {
        this.loadingAuditoria = false;
      }
    });
  }

  cerrarDetalle(): void {
    this.mostrarDetalle = false;
    this.usuarioDetalle = null;
    this.auditoriaDetalle = null;
  }

  formatearFecha(fecha?: string | null): string {
    if (!fecha) return '-';
    return new Date(fecha).toLocaleDateString('es-AR');
  }

  getEstadoClass(estado: string): string {
    return estado?.toLowerCase() === 'activo' ? 'badge-activo' : 'badge-inactivo';
  }

  private normalizarTexto(valor: string): string {
    return (valor || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase();
  }
}
