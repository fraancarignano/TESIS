import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UbicacionesService, Ubicacion } from '../../services/ubicaciones.service';
import { Insumo } from '../../../inventario/models/insumo.model';

@Component({
  selector: 'app-ubicacion-detalle-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-overlay" (click)="cerrar.emit()">
      <div class="modal-container" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <div class="header-content">
            <div class="icon-wrapper">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
            </div>
            <div>
              <h2>Ubicación: {{ ubicacion.codigo }}</h2>
              <p>Rack {{ ubicacion.rack }} - División {{ ubicacion.division }} - Espacio {{ ubicacion.espacio }}</p>
            </div>
          </div>
          <button class="btn-cerrar" (click)="cerrar.emit()">✕</button>
        </div>

        <div class="modal-body">
          <div class="descripcion-ubicacion" *ngIf="ubicacion.descripcion">
            <strong>Descripción:</strong> {{ ubicacion.descripcion }}
          </div>

          <div class="insumos-seccion">
            <h3>Insumos en esta ubicación ({{ insumos.length }})</h3>
            
            <div class="loading-spinner" *ngIf="cargando">
              Cargando insumos...
            </div>

            <div class="tabla-container" *ngIf="!cargando && insumos.length > 0">
              <table>
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Proyecto</th>
                    <th>Stock</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let insumo of insumos">
                    <td>{{ insumo.nombreInsumo }}</td>
                    <td>
                      <span *ngIf="insumo.detalleStock && insumo.detalleStock.length > 0">
                        {{ insumo.detalleStock[0].nombreProyecto || 'General' }}
                      </span>
                      <span *ngIf="!insumo.detalleStock || insumo.detalleStock.length === 0">-</span>
                    </td>
                    <td>{{ insumo.stockActual }} {{ insumo.unidadMedida }}</td>
                    <td>
                      <span class="badge-estado" [ngClass]="getEstadoClass(insumo.estado)">
                        {{ insumo.estado || 'Disponible' }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="sin-resultados" *ngIf="!cargando && insumos.length === 0">
              No hay insumos asignados a esta ubicación.
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-secundario" (click)="cerrar.emit()">Cerrar</button>
        </div>
      </div>
    </div>
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
      z-index: 1100;
    }

    .modal-container {
      background: white;
      border-radius: 12px;
      width: 90%;
      max-width: 650px;
      max-height: 85vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 15px 40px rgba(0, 0, 0, 0.2);
    }

    .modal-header {
      background: #455a64;
      padding: 15px 20px;
      border-radius: 12px 12px 0 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      color: white;
    }

    .header-content {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .icon-wrapper {
      background: rgba(255, 255, 255, 0.15);
      padding: 8px;
      border-radius: 8px;
    }

    .modal-header h2 {
      margin: 0;
      font-size: 18px;
      font-weight: 700;
    }

    .modal-header p {
      margin: 4px 0 0 0;
      font-size: 12px;
      opacity: 0.85;
    }

    .btn-cerrar {
      background: none;
      border: none;
      color: white;
      font-size: 18px;
      cursor: pointer;
      opacity: 0.7;
    }

    .btn-cerrar:hover {
      opacity: 1;
    }

    .modal-body {
      padding: 20px;
      overflow-y: auto;
      flex: 1;
    }

    .descripcion-ubicacion {
      background: #f5f7f9;
      padding: 10px 15px;
      border-radius: 6px;
      margin-bottom: 20px;
      font-size: 14px;
      color: #546e7a;
      border-left: 4px solid #90a4ae;
    }

    .insumos-seccion h3 {
      font-size: 15px;
      color: #263238;
      margin-bottom: 12px;
      font-weight: 600;
    }

    .tabla-container {
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      overflow: hidden;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }

    th {
      background: #f8f9fa;
      text-align: left;
      padding: 10px 12px;
      font-weight: 700;
      color: #607d8b;
      border-bottom: 1px solid #e0e0e0;
    }

    td {
      padding: 10px 12px;
      border-bottom: 1px solid #f0f0f0;
      color: #455a64;
    }

    .badge-estado {
      font-size: 11px;
      padding: 3px 8px;
      border-radius: 10px;
      font-weight: 600;
    }

    .estado-disponible { background: #e8f5e9; color: #2e7d32; }
    .estado-en-uso { background: #ffebee; color: #c62828; }
    .estado-agotado { background: #f5f5f5; color: #616161; }
    .estado-a-designar { background: #fff8e1; color: #f57f17; }

    .sin-resultados {
      text-align: center;
      padding: 30px;
      color: #90a4ae;
      font-style: italic;
    }

    .modal-footer {
      padding: 12px 20px;
      border-top: 1px solid #eee;
      display: flex;
      justify-content: flex-end;
    }

    .btn-secundario {
      padding: 8px 20px;
      border: 1px solid #ccc;
      border-radius: 6px;
      background: white;
      cursor: pointer;
      font-weight: 600;
    }
  `]
})
export class UbicacionDetalleModalComponent implements OnInit {
  @Input() ubicacion!: Ubicacion;
  @Output() cerrar = new EventEmitter<void>();

  insumos: Insumo[] = [];
  cargando = true;

  constructor(private ubicacionesService: UbicacionesService) { }

  ngOnInit(): void {
    if (this.ubicacion.idUbicacion) {
      this.ubicacionesService.getInsumosPorUbicacion(this.ubicacion.idUbicacion).subscribe({
        next: (res) => {
          this.insumos = res;
          this.cargando = false;
        },
        error: (err: any) => {
          console.error('Error al cargar insumos de la ubicación:', err);
          this.cargando = false;
        }
      });
    }
  }

  getEstadoClass(estado?: string): string {
    if (!estado) return 'estado-disponible';
    switch (estado.toLowerCase()) {
      case 'en uso': return 'estado-en-uso';
      case 'agotado': return 'estado-agotado';
      case 'a designar': return 'estado-a-designar';
      default: return 'estado-disponible';
    }
  }
}
