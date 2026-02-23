import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Taller } from './models/taller.model';

@Component({
  selector: 'app-taller-detalle-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-overlay" (click)="cerrar.emit()">
      <div class="modal-container" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <div class="header-content">
            <div class="icon-wrapper">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 21h18"></path>
                <path d="M5 21V7l8-4v18"></path>
                <path d="M19 21V11l-6-4"></path>
              </svg>
            </div>
            <div>
              <h2>Detalle del Taller</h2>
              <p>Informacion completa del taller externo</p>
            </div>
          </div>
          <button class="btn-cerrar" (click)="cerrar.emit()">X</button>
        </div>

        <div class="modal-body">
          <div class="seccion">
            <div class="seccion-titulo"><span>Datos del taller</span></div>
            <div class="campos-grid">
              <div class="campo">
                <label>Nombre del taller</label>
                <div class="valor">{{ taller.nombreTaller || '-' }}</div>
              </div>
              <div class="campo">
                <label>Tipo</label>
                <div class="valor">{{ taller.tipoTaller || '-' }}</div>
              </div>
              <div class="campo">
                <label>Responsable</label>
                <div class="valor">{{ taller.responsable || '-' }}</div>
              </div>
            </div>
          </div>

          <div class="seccion">
            <div class="seccion-titulo"><span>Contacto y ubicacion</span></div>
            <div class="campos-grid">
              <div class="campo">
                <label>Numero telefonico</label>
                <div class="valor">{{ taller.telefono || '-' }}</div>
              </div>
              <div class="campo">
                <label>Mail</label>
                <div class="valor">{{ taller.email || '-' }}</div>
              </div>
              <div class="campo">
                <label>Direccion</label>
                <div class="valor">{{ taller.direccion || '-' }}</div>
              </div>
              <div class="campo">
                <label>Provincia</label>
                <div class="valor">{{ taller.nombreProvincia || '-' }}</div>
              </div>
              <div class="campo">
                <label>Ciudad</label>
                <div class="valor">{{ taller.nombreCiudad || '-' }}</div>
              </div>
            </div>
          </div>

          <div class="seccion">
            <div class="seccion-titulo"><span>Proyecto</span></div>
            <div class="campos-grid">
              <div class="campo">
                <label>Proyectos asignados</label>
                <div class="valor">{{ taller.cantidadProyectosAsignados || 0 }}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-secundario" (click)="editar.emit(taller)">Editar</button>
          <button class="btn-peligro" (click)="eliminar.emit(taller)">Eliminar</button>
          <button class="btn-primary" (click)="verProyectos.emit(taller)">Ver proyectos</button>
          <button class="btn-secundario" (click)="cerrar.emit()">Cerrar</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay { position: fixed; inset: 0; background-color: rgba(0,0,0,.5); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 10px; }
    .modal-container { background: white; border-radius: 10px; width: 90%; max-width: 620px; max-height: 82vh; display: flex; flex-direction: column; box-shadow: 0 20px 60px rgba(0,0,0,.3); font-size: .85rem; }
    .modal-header { background: linear-gradient(135deg,#ff5722 0%,#f4511e 100%); padding: 12px 14px; border-radius: 10px 10px 0 0; display: flex; justify-content: space-between; align-items: center; color: white; }
    .header-content { display: flex; align-items: center; gap: 8px; }
    .icon-wrapper { background: rgba(255,255,255,.2); padding: 6px; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
    .modal-header h2 { margin: 0; font-size: 16px; font-weight: 700; }
    .modal-header p { margin: 4px 0 0 0; font-size: 11px; opacity: .9; }
    .btn-cerrar { background: rgba(255,255,255,.2); border: none; color: white; width: 26px; height: 26px; border-radius: 6px; cursor: pointer; font-size: 12px; }
    .modal-body { padding: 12px 14px; overflow-y: auto; flex: 1; }
    .seccion { margin-bottom: 12px; }
    .seccion:last-child { margin-bottom: 0; }
    .seccion-titulo { margin-bottom: 8px; color: #ff5722; font-weight: 600; font-size: 12px; padding-bottom: 4px; border-bottom: 2px solid #f5f5f5; }
    .campos-grid { display: grid; grid-template-columns: repeat(auto-fit,minmax(160px,1fr)); gap: 8px; }
    .campo label { display: block; font-size: 11px; font-weight: 600; color: #666; text-transform: uppercase; margin-bottom: 3px; }
    .campo .valor { font-size: 12px; color: #333; padding: 6px 8px; background: #f8f8f8; border-radius: 4px; border: 1px solid #e8e8e8; }
    .modal-footer { padding: 8px 14px 10px; border-top: 1px solid #f0f0f0; display: flex; justify-content: flex-end; gap: 8px; flex-wrap: wrap; }
    .btn-secundario, .btn-primary, .btn-peligro { border: none; padding: 7px 12px; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: 600; }
    .btn-secundario { background: #f5f5f5; color: #333; }
    .btn-primary { background: #e3f2fd; color: #1565c0; }
    .btn-peligro { background: #ffebee; color: #c62828; }
  `]
})
export class TallerDetalleModalComponent {
  @Input() taller!: Taller;
  @Output() cerrar = new EventEmitter<void>();
  @Output() editar = new EventEmitter<Taller>();
  @Output() eliminar = new EventEmitter<Taller>();
  @Output() verProyectos = new EventEmitter<Taller>();
}

