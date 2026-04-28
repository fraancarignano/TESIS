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

          <!-- SECCIÓN DE INSUMOS -->
          <div class="insumos-seccion" *ngIf="!esUbicacionDespacho">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <h3>Insumos en esta ubicación ({{ insumos.length }})</h3>
            </div>
            
            <div class="loading-spinner" *ngIf="cargando">
              Cargando insumos...
            </div>

            <div class="tabla-container" *ngIf="!cargando && insumos.length > 0">
              <table>
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Proyecto</th>
                    <th>Stock Actual</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let insumo of insumos">
                    <td class="fw-bold">{{ insumo.nombreInsumo }}</td>
                    <td>
                      <span *ngIf="insumo.detalleStock && insumo.detalleStock.length > 0" class="text-muted">
                        {{ insumo.detalleStock[0].nombreProyecto || 'Stock General' }}
                      </span>
                      <span *ngIf="!insumo.detalleStock || insumo.detalleStock.length === 0">-</span>
                    </td>
                    <td>{{ insumo.stockActual }} {{ insumo.unidadMedida }}</td>
                    <td>
                      <span class="badge-estado" [ngClass]="getEstadoClass(insumo.estado)">
                        {{ getEstadoTexto(insumo.estado) }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="sin-resultados" *ngIf="!cargando && insumos.length === 0">
              No hay insumos almacenados en esta ubicación.
            </div>
          </div>

          <!-- SECCIÓN DE PROYECTOS (Para ubicaciones DES) -->
          <div class="insumos-seccion proyectos-seccion" *ngIf="esUbicacionDespacho">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <h3>Logística de Despacho ({{ proyectos.length }})</h3>
              <span class="badge-despacho">ZONA DES</span>
            </div>
            
            <div class="loading-spinner" *ngIf="cargando">
              Validando proyectos en espera...
            </div>

            <div class="tabla-container" *ngIf="!cargando && proyectos.length > 0">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nombre Proyecto</th>
                    <th>Ingreso a Despacho</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let proy of proyectos">
                    <td class="font-bold">#{{ proy.codigoProyecto }}</td>
                    <td>
                       <div class="d-flex flex-column">
                          <span class="fw-bold">{{ proy.nombreProyecto }}</span>
                          <span class="text-muted" style="font-size: 11px;">ID: {{ proy.idProyecto }}</span>
                       </div>
                    </td>
                    <td>{{ proy.fechaIngreso | date:'dd/MM/yyyy HH:mm' }}</td>
                    <td>
                      <button class="btn-ver-detalle" (click)="verDetalleProyecto(proy.idProyecto)">
                         Ver Control
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="sin-resultados" *ngIf="!cargando && proyectos.length === 0">
              <div class="alert alert-info">
                 Esta ubicación de despacho está vacía. No tiene proyectos asignados actualmente.
              </div>
            </div>
          </div>

          <!-- SECCIÓN DE SCRAP (Para ubicaciones tipo SCRP) -->
          <div class="insumos-seccion scrap-seccion" *ngIf="esUbicacionScrap">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <h3>Inventario de Scrap ({{ scraps.length }} registros)</h3>
              <span class="badge-scrap">ZONA SCRP</span>
            </div>
            
            <div class="scrap-kpis" *ngIf="scraps.length > 0">
              <div class="kpi-card">
                <span class="kpi-label">Total acumulado</span>
                <span class="kpi-valor">{{ totalScrapKg | number:'1.2-2' }} kg</span>
              </div>
              <div class="kpi-card">
                <span class="kpi-label">Proyectos involucrados</span>
                <span class="kpi-valor">{{ proyectosConScrap }}</span>
              </div>
            </div>

            <div class="loading-spinner" *ngIf="cargando">
              Cargando registros de scrap...
            </div>

            <div class="tabla-container" *ngIf="!cargando && scraps.length > 0">
              <table>
                <thead>
                  <tr>
                    <th>Proyecto</th>
                    <th>Material</th>
                    <th>Cantidad</th>
                    <th>Motivo</th>
                    <th>Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let s of scraps">
                    <td>
                      <div class="d-flex flex-column">
                        <span class="badge-proyecto">{{ s.codigoProyecto || '#' + s.idProyecto }}</span>
                        <small class="text-muted">{{ s.nombreProyecto }}</small>
                      </div>
                    </td>
                    <td class="fw-bold">{{ s.nombreInsumo }}</td>
                    <td>{{ s.cantidadKg | number:'1.2-2' }} kg</td>
                    <td><span class="badge-motivo">{{ s.motivo || 'Corte' }}</span></td>
                    <td>{{ s.fechaRegistro | date:'dd/MM/yyyy' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="sin-resultados" *ngIf="!cargando && scraps.length === 0">
              No hay remanentes de scrap registrados en esta ubicación.
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
      max-width: 700px;
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

    .btn-ver-detalle {
      background: #e3f2fd;
      color: #1976d2;
      border: none;
      padding: 5px 10px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 5px;
      transition: all 0.2s;
    }

    .btn-ver-detalle:hover {
      background: #bbdefb;
      transform: scale(1.05);
    }

    .badge-despacho {
      background: #fff3e0;
      color: #ef6c00;
      padding: 2px 10px;
      border-radius: 20px;
      font-size: 10px;
      font-weight: 800;
      border: 1px solid #ffe0b2;
    }

    .badge-scrap {
      background: #f3e5f5;
      color: #7b1fa2;
      padding: 2px 10px;
      border-radius: 20px;
      font-size: 10px;
      font-weight: 800;
      border: 1px solid #e1bee7;
    }

    .scrap-kpis {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
      margin-bottom: 20px;
    }

    .kpi-card {
      background: #f8f9fa;
      padding: 15px;
      border-radius: 10px;
      text-align: center;
      border: 1px solid #eee;
    }

    .kpi-label {
      display: block;
      font-size: 11px;
      color: #78909c;
      text-transform: uppercase;
      font-weight: 700;
      margin-bottom: 5px;
    }

    .kpi-valor {
      display: block;
      font-size: 20px;
      font-weight: 800;
      color: #263238;
    }

    .badge-proyecto {
      background: #e1f5fe;
      color: #0288d1;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 700;
      width: fit-content;
    }

    .badge-motivo {
      background: #eceff1;
      color: #546e7a;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 11px;
    }

    .font-bold {
      font-weight: 700;
      color: #263238;
    }

    .fw-bold { font-weight: 700; }
    .text-muted { color: #6c757d; }
    .d-flex { display: flex; }
    .flex-column { flex-direction: column; }
    .justify-content-between { justify-content: space-between; }
    .align-items-center { align-items: center; }
    .mb-3 { margin-bottom: 1rem; }
    .mt-2 { margin-top: 0.5rem; }
    .mt-3 { margin-top: 1rem; }
  `]
})
export class UbicacionDetalleModalComponent implements OnInit {
  @Input() ubicacion!: Ubicacion;
  @Output() cerrar = new EventEmitter<void>();
  @Output() abrirProyecto = new EventEmitter<number>();

  insumos: any[] = [];
  proyectos: any[] = [];
  scraps: any[] = [];
  cargando = true;

  get esUbicacionDespacho(): boolean {
    if (this.ubicacion.tipo) return this.ubicacion.tipo === 'Despacho';
    if (!this.ubicacion.codigo) return false;
    const code = this.ubicacion.codigo.toUpperCase();
    return code.startsWith('DES') || code.includes('-DES');
  }

  get esUbicacionScrap(): boolean {
    if (this.ubicacion.tipo) return this.ubicacion.tipo === 'Scrap';
    if (!this.ubicacion.codigo) return false;
    const code = this.ubicacion.codigo.toUpperCase();
    return code.startsWith('SCRP');
  }

  get totalScrapKg(): number {
    return this.scraps.reduce((acc, s) => acc + (s.cantidadKg || 0), 0);
  }

  get proyectosConScrap(): number {
    return new Set(this.scraps.map(s => s.idProyecto)).size;
  }

  constructor(private ubicacionesService: UbicacionesService) { }

  ngOnInit(): void {
    if (this.ubicacion.idUbicacion) {
      if (this.esUbicacionDespacho) {
        this.cargarProyectos();
      } else if (this.esUbicacionScrap) {
        this.cargarScraps();
      } else {
        this.cargarInsumos();
      }
    }
  }

  cargarInsumos(): void {
    this.cargando = true;
    this.ubicacionesService.getInsumosPorUbicacion(this.ubicacion.idUbicacion!).subscribe({
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

  cargarProyectos(): void {
    this.cargando = true;
    this.ubicacionesService.getProyectosPorUbicacion(this.ubicacion.idUbicacion!).subscribe({
      next: (res) => {
        this.proyectos = res;
        this.cargando = false;
      },
      error: (err: any) => {
        console.error('Error al cargar proyectos de la ubicación:', err);
        this.cargando = false;
      }
    });
  }

  cargarScraps(): void {
    this.cargando = true;
    this.ubicacionesService.getScrapsPorUbicacion(this.ubicacion.idUbicacion!).subscribe({
      next: (res) => {
        this.scraps = res;
        this.cargando = false;
      },
      error: (err: any) => {
        console.error('Error al cargar scraps de la ubicación:', err);
        this.cargando = false;
      }
    });
  }

  verDetalleProyecto(idProyecto: number): void {
    this.abrirProyecto.emit(idProyecto);
  }

  getEstadoClass(estado?: string): string {
    if (!estado) return 'estado-disponible';
    switch (estado.toLowerCase()) {
      case 'en uso': return 'estado-en-uso';
      case 'agotado': return 'estado-agotado';
      case 'a designar': return 'estado-a-designar';
      case 'activo': return 'estado-disponible';
      default: return 'estado-disponible';
    }
  }

  getEstadoTexto(estado?: string): string {
    if (!estado) return 'Disponible';
    const e = estado.trim().toLowerCase();
    if (e === 'pulenta' || e === 'activo') return 'Disponible';
    return estado;
  }
}
