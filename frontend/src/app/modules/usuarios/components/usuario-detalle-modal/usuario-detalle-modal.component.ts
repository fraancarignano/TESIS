import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UsuarioAuditoria, UsuarioInterno } from '../../models/usuario.model';
import { PermisosUsuarioComponent } from '../permisos-usuario/permisos-usuario.component';

@Component({
  selector: 'app-usuario-detalle-modal',
  standalone: true,
  imports: [CommonModule, PermisosUsuarioComponent],
  templateUrl: './usuario-detalle-modal.component.html',
  styleUrls: ['./usuario-detalle-modal.component.css']
})
export class UsuarioDetalleModalComponent {
  @Input() usuario!: UsuarioInterno;
  @Input() auditoria: UsuarioAuditoria | null = null;
  @Input() loadingAuditoria = false;

  @Output() cerrar = new EventEmitter<void>();

  permisosAbiertos = false;

  togglePermisos(): void {
    this.permisosAbiertos = !this.permisosAbiertos;
  }

  formatearFecha(fecha?: string | null): string {
    if (!fecha) return '-';
    return new Date(fecha).toLocaleDateString('es-AR');
  }
}
