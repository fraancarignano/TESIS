import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AlertasService } from '../../../core/services/alertas';
import { UsuariosService } from '../services/usuarios.service';
import { Permiso, RolUsuario, UsuarioAuditoria, UsuarioInterno } from '../models/usuario.model';
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
  permisos: Permiso[] = [];

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

  private readonly subRolesStorageKey = 'usuarios_internos_subroles';

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

    this.usuariosService.obtenerRoles().subscribe({ next: (roles) => (this.roles = roles) });
    this.usuariosService.obtenerPermisos().subscribe({ next: (permisos) => (this.permisos = permisos) });
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
    this.subRolesSeleccionados = this.obtenerSubRolesUsuario(usuario.idUsuario);
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
      estado: payload.estado
    };

    if (this.usuarioSeleccionado) {
      this.usuariosService.actualizarUsuario(this.usuarioSeleccionado.idUsuario, request).subscribe({
        next: (usuario) => {
          this.guardarSubRolesUsuario(usuario.idUsuario, payload.subRoles);
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
      idRol: payload.idRol
    }).subscribe({
      next: (usuario) => {
        this.guardarSubRolesUsuario(usuario.idUsuario, payload.subRoles);
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

  private obtenerSubRolesUsuario(idUsuario: number): number[] {
    const data = this.obtenerMapaSubRoles();
    return data[idUsuario] || [];
  }

  private guardarSubRolesUsuario(idUsuario: number, subRoles: number[]): void {
    const data = this.obtenerMapaSubRoles();
    data[idUsuario] = subRoles;
    localStorage.setItem(this.subRolesStorageKey, JSON.stringify(data));
  }

  private obtenerMapaSubRoles(): Record<number, number[]> {
    try {
      const raw = localStorage.getItem(this.subRolesStorageKey);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }
}
