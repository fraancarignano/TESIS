import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Insumo } from '../models/insumo.model';
import { UbicacionDetalleModalComponent } from '../../ubicaciones/components/ubicacion-detalle-modal/ubicacion-detalle-modal.component';
import { UbicacionesService, Ubicacion } from '../../ubicaciones/services/ubicaciones.service';

@Component({
  selector: 'app-insumo-detalle-modal',
  standalone: true,
  imports: [CommonModule, UbicacionDetalleModalComponent],
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
              <p>Información completa del insumo</p>
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
                <label>Estado</label>
                <div class="valor">
                  <span class="badge" [ngClass]="getEstadoClass()">
                    {{ insumo.estado || 'Disponible' }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Stock e Inventario -->
          <div class="seccion">
            <div class="seccion-titulo">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="8" y1="6" x2="21" y2="6"></line>
                <line x1="8" y1="12" x2="21" y2="12"></line>
                <line x1="8" y1="18" x2="21" y2="18"></line>
                <line x1="3" y1="6" x2="3.01" y2="6"></line>
                <line x1="3" y1="12" x2="3.01" y2="12"></line>
                <line x1="3" y1="18" x2="3.01" y2="18"></line>
              </svg>
              <span>Stock e Inventario</span>
            </div>
            <div class="campos-grid">
              <div class="campo">
                <label>Stock Actual</label>
                <div class="valor" [class.valor-alerta]="stockBajo()">
                  {{ insumo.stockActual }} {{ insumo.unidadMedida }}
                  <span *ngIf="stockBajo()" class="icono-alerta">⚠️</span>
                </div>
              </div>
              <div class="campo">
                <label>Stock Mínimo</label>
                <div class="valor">
                  {{ insumo.stockMinimo ? (insumo.stockMinimo + ' ' + insumo.unidadMedida) : 'No definido' }}
                </div>
              </div>
              <div class="campo">
                <label>Ubicación Física</label>
                <div class="valor">
                  <span *ngIf="insumo.codigoUbicacion" 
                    class="badge-ubicacion clickable" 
                    (click)="verDetalleUbicacion()">
                    {{ insumo.codigoUbicacion }}
                  </span>
                  <span *ngIf="!insumo.codigoUbicacion" style="color: #999;">No asignada</span>
                </div>
              </div>
              <div class="campo">
                <label>Fecha de Actualización</label>
                <div class="valor">{{ formatearFecha(insumo.fechaActualizacion) }}</div>
              </div>
              <div class="campo" *ngIf="stockBajo()">
                <label>Estado del Stock</label>
                <div class="valor valor-alerta">
                  <strong>Stock por debajo del mínimo</strong>
                </div>
              </div>
            </div>
          </div>

          <!-- Información del Proveedor -->
          <div class="seccion">
            <div class="seccion-titulo">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              <span>Información del Proveedor</span>
            </div>
            <div class="campos-grid">
              <div class="campo">
                <label>Proveedor</label>
                <div class="valor">{{ insumo.proveedor?.nombreProveedor || 'Sin proveedor asignado' }}</div>
              </div>
              <div class="campo" *ngIf="insumo.proveedor?.cuit as cuit">
  <label>CUIT</label>
  <div class="valor">{{ cuit }}</div>
</div>
            </div>
          </div>

          <!-- Alerta de stock bajo -->
          <div class="alerta-stock-bajo" *ngIf="stockBajo()">
            <div class="alerta-icono">⚠️</div>
            <div class="alerta-contenido">
              <h4>Alerta de Stock Bajo</h4>
              <p>
                El stock actual ({{ insumo.stockActual }} {{ insumo.unidadMedida }}) 
                está por debajo del stock mínimo establecido 
                ({{ insumo.stockMinimo }} {{ insumo.unidadMedida }}).
                Se recomienda realizar un pedido de reposición.
              </p>
            </div>
          </div>
        </div>

          <!-- Proyectos Asignados -->
          <div class="seccion" *ngIf="insumo.proyectosAsignados && insumo.proyectosAsignados.length > 0">
            <div class="seccion-titulo">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2-2z"></path>
              </svg>
              <span>Proyectos Asignados</span>
            </div>
            <div class="tabla-container">
              <table>
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Proyecto</th>
                    <th>Prenda</th>
                    <th>Cantidad</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let p of insumo.proyectosAsignados">
                    <td>{{ p.codigoProyecto }}</td>
                    <td>{{ p.nombreProyecto }}</td>
                    <td>{{ p.nombrePrenda || 'General' }}</td>
                    <td>{{ p.cantidad }} {{ p.unidadMedida }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        <div class="modal-footer">
          <button class="btn-secundario" (click)="cerrar.emit()">Cerrar</button>
        </div>
      </div>
    </div>

    <app-ubicacion-detalle-modal *ngIf="mostrarDetalleUbicacion" 
      [ubicacion]="ubicacionSeleccionada!" 
      (cerrar)="mostrarDetalleUbicacion = false">
    </app-ubicacion-detalle-modal>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      animation: fadeIn 0.2s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .modal-container {
      background: white;
      border-radius: 10px;
      width: 90%;
      max-width: 620px;
      max-height: 82vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      animation: slideUp 0.3s ease;
      font-size: 0.85rem;
    }

    @keyframes slideUp {
      from {
        transform: translateY(20px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
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

    .header-content {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .icon-wrapper {
      background: rgba(255, 255, 255, 0.2);
      padding: 6px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .modal-header h2 {
      margin: 0;
      font-size: 16px;
      font-weight: 700;
    }

    .modal-header p {
      margin: 4px 0 0 0;
      font-size: 11px;
      opacity: 0.9;
    }

    .btn-cerrar {
      background: rgba(255, 255, 255, 0.2);
      border: none;
      color: white;
      width: 26px;
      height: 26px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
    }

    .btn-cerrar:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: scale(1.1);
    }

    .modal-body {
      padding: 12px 14px;
      overflow-y: auto;
      flex: 1;
    }

    .seccion {
      margin-bottom: 12px;
    }

    .seccion:last-child {
      margin-bottom: 0;
    }

    .seccion-titulo {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 8px;
      color: #ff5722;
      font-weight: 600;
      font-size: 12px;
      padding-bottom: 4px;
      border-bottom: 2px solid #f5f5f5;
    }

    .seccion-titulo svg {
      flex-shrink: 0;
    }

    .campos-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 8px;
    }

    .campo label {
      display: block;
      font-size: 11px;
      font-weight: 600;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 3px;
    }

    .campo .valor {
      font-size: 12px;
      color: #333;
      padding: 6px 8px;
      background: #f8f8f8;
      border-radius: 4px;
      border: 1px solid #e8e8e8;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .valor-alerta {
      background: #fff3e0 !important;
      border-color: #ff9800 !important;
      color: #e65100 !important;
      font-weight: 600;
    }

    .icono-alerta {
      font-size: 13px;
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    .badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 8px;
      font-size: 11px;
      font-weight: 600;
    }

    .estado-en-uso {
      background: #ffebee;
      color: #c62828;
    }

    .estado-a-designar {
      background: #fff9c4;
      color: #f57f17;
    }

    .estado-agotado {
      background: #e0e0e0;
      color: #424242;
    }

    .estado-disponible {
      background: #e8f5e9;
      color: #2e7d32;
    }

    .badge-ubicacion {
      background-color: #f0f4f8;
      color: #546e7a;
      padding: 2px 8px;
      border-radius: 4px;
      font-family: monospace;
      font-weight: 600;
      font-size: 11px;
      border: 1px solid #cfd8dc;
    }

    .badge-ubicacion.clickable {
      cursor: pointer;
      color: #2196f3;
      border-color: #2196f3;
      transition: all 0.2s;
    }

    .badge-ubicacion.clickable:hover {
      background: #e3f2fd;
      transform: scale(1.05);
    }

    .alerta-stock-bajo {
      background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
      border-left: 4px solid #ff9800;
      border-radius: 6px;
      padding: 8px;
      display: flex;
      gap: 8px;
      margin-top: 10px;
    }

    .alerta-icono {
      font-size: 20px;
      flex-shrink: 0;
    }

    .alerta-contenido h4 {
      margin: 0 0 8px 0;
      color: #e65100;
      font-size: 13px;
    }

    .alerta-contenido p {
      margin: 0;
      color: #f57c00;
      font-size: 12px;
      line-height: 1.35;
    }

    .modal-footer {
      padding: 8px 14px 10px;
      border-top: 1px solid #f0f0f0;
      display: flex;
      justify-content: flex-end;
      gap: 6px;
    }

    .btn-secundario {
      background: #f5f5f5;
      color: #333;
      border: none;
      padding: 7px 12px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      font-weight: 600;
      transition: all 0.2s ease;
    }

    .btn-secundario:hover {
      background: #e0e0e0;
      transform: translateY(-1px);
    }

    @media (max-width: 768px) {
      .modal-container {
        width: 95%;
        max-height: 95vh;
      }

      .modal-header {
        padding: 10px 12px;
      }

      .modal-header h2 {
        font-size: 14px;
      }

      .campos-grid {
        grid-template-columns: 1fr;
        gap: 8px;
      }

      .modal-body {
        padding: 10px 12px;
      }

      .alerta-stock-bajo {
        flex-direction: column;
        text-align: center;
      }
    }

    .tabla-container {
      overflow-x: auto;
      border: 1px solid #e8e8e8;
      border-radius: 5px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }

    th, td {
      padding: 7px 8px;
      text-align: left;
      border-bottom: 1px solid #f0f0f0;
    }

    th {
      background: #f8f8f8;
      font-weight: 600;
      color: #666;
    }

    tr:last-child td {
      border-bottom: none;
    }
  `]
})
export class InsumoDetalleModalComponent {
  @Input() insumo!: Insumo;
  @Output() cerrar = new EventEmitter<void>();

  mostrarDetalleUbicacion = false;
  ubicacionSeleccionada: Ubicacion | null = null;

  constructor(private ubicacionesService: UbicacionesService) { }

  verDetalleUbicacion(): void {
    if (!this.insumo.idUbicacion) return;

    // Necesitamos el objeto Ubicacion completo para el modal
    this.ubicacionesService.getUbicacion(this.insumo.idUbicacion).subscribe({
      next: (u) => {
        this.ubicacionSeleccionada = u;
        this.mostrarDetalleUbicacion = true;
      },
      error: (err: any) => console.error('Error al cargar ubicación:', err)
    });
  }

  getEstadoClass(): string {
    const estado = (this.insumo.estado || 'disponible').toLowerCase();
    if (estado.includes('en uso')) return 'estado-en-uso';
    if (estado.includes('a designar')) return 'estado-a-designar';
    if (estado.includes('agotado')) return 'estado-agotado';
    return 'estado-disponible';
  }

  stockBajo(): boolean {
    if (!this.insumo.stockMinimo) return false;
    return this.insumo.stockActual < this.insumo.stockMinimo;
  }

  formatearFecha(fecha: string): string {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
}
