import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { map } from 'rxjs/operators';
import { Insumo } from '../models/insumo.model';
import { UbicacionDetalleModalComponent } from '../../ubicaciones/components/ubicacion-detalle-modal/ubicacion-detalle-modal.component';
import { ProyectoDetalleModalComponent } from '../../proyectos/components/proyecto-detalle-modal/proyecto-detalle-modal.component';
import { UbicacionesService, Ubicacion } from '../../ubicaciones/services/ubicaciones.service';
import { ProyectosService } from '../../proyectos/services/proyecto.service';
import { ProyectoVista, proyectoToVista } from '../../proyectos/models/proyecto.model';

@Component({
  selector: 'app-insumo-detalle-modal',
  standalone: true,
  imports: [CommonModule, UbicacionDetalleModalComponent, ProyectoDetalleModalComponent],
  template: `
    <div class="modal-overlay" (click)="cerrar.emit()">
      <div class="modal-container" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <div class="header-content">
            <div class="icon-wrapper">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                <line x1="7" y1="7" x2="7.01" y2="7"></line>
              </svg>
            </div>
            <div>
              <h2>Detalle del Insumo</h2>
              <p>Información completa y trazabilidad</p>
            </div>
          </div>
          <button class="btn-cerrar" (click)="cerrar.emit()">✕</button>
        </div>

        <div class="modal-body">
          <!-- Información General -->
          <div class="seccion">
            <div class="seccion-titulo">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                <line x1="7" y1="7" x2="7.01" y2="7"></line>
              </svg>
              <span>Información General</span>
            </div>
            <div class="campos-grid">
              <div class="campo">
                <label>Nombre del Insumo</label>
                <div class="valor">{{ insumo.nombreInsumo }}</div>
              </div>
              <div class="campo">
                <label>Tipo de Insumo</label>
                <div class="valor">{{ insumo.tipoInsumo?.nombreTipo || '-' }}</div>
              </div>
              <div class="campo">
                <label>Unidad de Medida</label>
                <div class="valor">{{ insumo.unidadMedida }}</div>
              </div>
              <div class="campo">
                <label>Stock Actual Total</label>
                <div class="valor" [class.valor-alerta]="stockBajo()">
                  {{ insumo.stockActual }} {{ insumo.unidadMedida }}
                  <span *ngIf="stockBajo()" class="icono-alerta">⚠️</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Detalle de Stock (Ubicación y Proyecto) -->
          <div class="seccion" *ngIf="insumo.detalleStock && insumo.detalleStock.length > 0">
            <div class="seccion-titulo">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                <line x1="12" y1="22.08" x2="12" y2="12"></line>
              </svg>
              <span>Detalle Stock</span>
            </div>
            <div class="tabla-container">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Proyecto</th>
                    <th>Cantidad</th>
                    <th>Ubicación</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let s of insumo.detalleStock">
                    <td>
                      <span *ngIf="s.idProyecto" class="text-muted">#{{ s.idProyecto }}</span>
                      <span *ngIf="!s.idProyecto" class="text-muted">-</span>
                    </td>
                    <td>
                      <span *ngIf="s.idProyecto" class="link-label" (click)="verDetalleProyecto(s.idProyecto)">
                        {{ s.nombreProyecto }}
                      </span>
                      <span *ngIf="!s.idProyecto" class="text-muted">Stock General</span>
                    </td>
                    <td class="font-bold">{{ s.cantidad }} {{ insumo.unidadMedida }}</td>
                    <td>
                      <span *ngIf="s.idUbicacion" class="link-label" (click)="verDetalleUbicacion(s.idUbicacion)">
                        {{ s.codigoUbicacion }}
                      </span>
                      <span *ngIf="!s.idUbicacion" class="text-muted">-</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Información del Proveedor -->
          <div class="seccion">
            <div class="seccion-titulo">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
              </svg>
              <span>Información del Proveedor</span>
            </div>
            <div class="campos-grid">
              <div class="campo">
                <label>Proveedor</label>
                <div class="valor">{{ insumo.proveedor?.nombreProveedor || 'Sin proveedor' }}</div>
              </div>
              <div class="campo" *ngIf="insumo.proveedor?.cuit">
                <label>CUIT</label>
                <div class="valor">{{ insumo.proveedor?.cuit }}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-secundario" (click)="cerrar.emit()">Cerrar</button>
        </div>
      </div>
    </div>

    <!-- Modales de navegación -->
    <app-ubicacion-detalle-modal *ngIf="mostrarDetalleUbicacion" 
      [ubicacion]="ubicacionSeleccionada!" 
      (cerrar)="mostrarDetalleUbicacion = false">
    </app-ubicacion-detalle-modal>

    <app-proyecto-detalle-modal *ngIf="mostrarDetalleProyecto"
      [proyecto]="proyectoSeleccionado!"
      (cerrar)="mostrarDetalleProyecto = false">
    </app-proyecto-detalle-modal>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }
    .modal-container {
      background: white;
      border-radius: 10px;
      width: 95%;
      max-width: 800px;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    }
    .modal-header {
      background: linear-gradient(135deg, #ff5722 0%, #f4511e 100%);
      padding: 12px 14px;
      border-radius: 10px 10px 0 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      color: white;
    }
    .header-content { display: flex; align-items: center; gap: 8px; }
    .icon-wrapper {
      background: rgba(255, 255, 255, 0.2);
      padding: 6px;
      border-radius: 8px;
    }
    .modal-header h2 { margin: 0; font-size: 16px; font-weight: 700; }
    .modal-header p { margin: 4px 0 0 0; font-size: 11px; opacity: 0.9; }
    .btn-cerrar {
      background: rgba(255, 255, 255, 0.2); border: none; color: white;
      width: 26px; height: 26px; border-radius: 6px; cursor: pointer;
    }
    .modal-body { padding: 14px; overflow-y: auto; flex: 1; }
    .seccion { margin-bottom: 20px; }
    .seccion-titulo {
      display: flex; align-items: center; gap: 6px;
      margin-bottom: 10px; color: #ff5722;
      font-weight: 600; font-size: 13px;
      border-bottom: 1px solid #eee; padding-bottom: 5px;
    }
    .campos-grid {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 10px;
    }
    .campo label {
      display: block; font-size: 11px; font-weight: 600; color: #666;
      text-transform: uppercase; margin-bottom: 3px;
    }
    .campo .valor {
      font-size: 12px; color: #333; padding: 8px;
      background: #f8f8f8; border-radius: 4px; border: 1px solid #eee;
    }
    .valor-alerta { background: #fff3e0 !important; border-color: #ff9800 !important; color: #e65100 !important; }
    .tabla-container { border: 1px solid #eee; border-radius: 6px; overflow: hidden; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th { background: #f5f5f5; padding: 10px; text-align: left; color: #666; }
    td { padding: 10px; border-top: 1px solid #eee; }
    .link-label { color: #2196f3; cursor: pointer; font-weight: 600; text-decoration: underline; }
    .link-label:hover { color: #0d47a1; }
    .text-muted { color: #999; font-style: italic; }
    .font-bold { font-weight: 600; }
    .modal-footer { padding: 14px; border-top: 1px solid #eee; display: flex; justify-content: flex-end; }
    .btn-secundario {
      background: #f5f5f5; border: none; padding: 8px 16px; border-radius: 4px;
      cursor: pointer; font-weight: 600;
    }
  `]
})
export class InsumoDetalleModalComponent {
  @Input() insumo!: Insumo;
  @Output() cerrar = new EventEmitter<void>();

  mostrarDetalleUbicacion = false;
  ubicacionSeleccionada: Ubicacion | null = null;

  mostrarDetalleProyecto = false;
  proyectoSeleccionado: ProyectoVista | null = null;

  constructor(
    private ubicacionesService: UbicacionesService,
    private proyectosService: ProyectosService
  ) { }

  verDetalleUbicacion(idUbicacion: number): void {
    this.ubicacionesService.getUbicacion(idUbicacion).subscribe({
      next: (u: Ubicacion) => {
        this.ubicacionSeleccionada = u;
        this.mostrarDetalleUbicacion = true;
      },
      error: (err: any) => console.error('Error al cargar ubicación:', err)
    });
  }

  verDetalleProyecto(idProyecto: number): void {
    this.proyectosService.obtenerProyectoPorId(idProyecto).pipe(
      map(p => proyectoToVista(p))
    ).subscribe({
      next: (p: ProyectoVista) => {
        this.proyectoSeleccionado = p;
        this.mostrarDetalleProyecto = true;
      },
      error: (err: any) => console.error('Error al cargar proyecto:', err)
    });
  }

  stockBajo(): boolean {
    if (!this.insumo.stockMinimo) return false;
    return this.insumo.stockActual < this.insumo.stockMinimo;
  }

  formatearFecha(fecha: string): string {
    if (!fecha) return '-';
    const date = new Date(fecha);
    return date.toLocaleDateString('es-AR', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  }
}
