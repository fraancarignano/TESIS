import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertasService } from '../../../core/services/alertas';
import { NotificacionesService, NotificacionStockItem, SolicitudMaterialItem } from '../../../core/services/notificaciones.service';

@Component({
  selector: 'app-notificaciones',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="notif-page">

      <!-- TABS -->
      <div class="tabs">
        <button [class.active]="tab === 'solicitudes'" (click)="tab = 'solicitudes'">
          Solicitudes de Material
          <span class="badge" *ngIf="pendientes > 0">{{ pendientes }}</span>
        </button>
        <button [class.active]="tab === 'stock'" (click)="tab = 'stock'">
          Alertas de Stock
        </button>
      </div>

      <!-- TAB: SOLICITUDES DE MATERIAL -->
      <div *ngIf="tab === 'solicitudes'">
        <div class="tab-header">
          <h2>Solicitudes de transferencia de material</h2>
          <div class="filtros">
            <button [class.active]="filtroEstado === ''" (click)="filtroEstado = ''; cargarSolicitudes()">Todas</button>
            <button [class.active]="filtroEstado === 'Pendiente'" (click)="filtroEstado = 'Pendiente'; cargarSolicitudes()">Pendientes</button>
            <button [class.active]="filtroEstado === 'Atendida'" (click)="filtroEstado = 'Atendida'; cargarSolicitudes()">Atendidas</button>
            <button class="btn-recargar" (click)="cargarSolicitudes()">&#8635; Recargar</button>
          </div>
        </div>

        <div class="estado" *ngIf="loadingSolicitudes">Cargando...</div>
        <div class="estado error" *ngIf="!loadingSolicitudes && errorSolicitudes">{{ errorSolicitudes }}</div>

        <div class="lista" *ngIf="!loadingSolicitudes && !errorSolicitudes">
          <div class="item solicitud" *ngFor="let s of solicitudes" [class.atendida]="s.estado === 'Atendida'">
            <div class="sol-header">
              <span class="badge-estado" [class.pendiente]="s.estado === 'Pendiente'" [class.atendida-badge]="s.estado === 'Atendida'">
                {{ s.estado }}
              </span>
              <span class="fecha">{{ s.fechaSolicitud | date:'dd/MM/yyyy' }}</span>
            </div>

            <div class="sol-proyecto"><strong>{{ s.nombreProyecto }}</strong></div>

            <div class="sol-detalle">
              <span *ngIf="s.nombreTipoInsumo"><i>Material:</i> {{ s.nombreTipoInsumo }}</span>
              <span *ngIf="s.colorSolicitado"><i>Color:</i> {{ s.colorSolicitado }}</span>
              <span *ngIf="s.cantidadEstimada"><i>Cantidad:</i> {{ s.cantidadEstimada }} {{ s.unidadMedida }}</span>
            </div>

            <div class="sol-msg" *ngIf="s.mensaje">{{ s.mensaje }}</div>
            <div class="sol-emisor">Solicitado por: {{ s.usuarioEmisor }}</div>

            <div class="sol-acciones" *ngIf="s.estado === 'Pendiente'">
              <button class="btn-transferir" (click)="irATransferir(s)">
                &#8594; Ir a transferir material
              </button>
              <button class="btn-atender" [disabled]="marcandoId === s.idSolicitud" (click)="atenderSolicitud(s)">
                {{ marcandoId === s.idSolicitud ? 'Marcando...' : '&#10003; Marcar como atendida' }}
              </button>
            </div>
            <div class="sol-atendida-info" *ngIf="s.estado === 'Atendida'">
              Atendida el {{ s.fechaAtendida | date:'dd/MM/yyyy' }}
            </div>
          </div>

          <div class="vacio" *ngIf="solicitudes.length === 0">No hay solicitudes.</div>
        </div>
      </div>

      <!-- TAB: ALERTAS DE STOCK -->
      <div *ngIf="tab === 'stock'">
        <div class="tab-header">
          <h2>Alertas de Stock</h2>
          <button class="btn-recargar" (click)="cargarStock()">&#8635; Recargar</button>
        </div>

        <div class="estado" *ngIf="loadingStock">Cargando...</div>
        <div class="estado error" *ngIf="!loadingStock && errorStock">{{ errorStock }}</div>

        <div class="lista" *ngIf="!loadingStock && !errorStock">
          <div class="item" *ngFor="let n of notificaciones" [class.leida]="n.leida">
            <div class="fila1">
              <span class="tipo" [class.sobrante]="n.tipo === 'Sobrante'" [class.faltante]="n.tipo !== 'Sobrante'">{{ n.tipo }}</span>
              <span class="fecha">{{ n.fecha | date:'dd/MM/yyyy' }}</span>
            </div>
            <div class="msg">{{ n.mensaje }}</div>
            <div class="meta">Insumo #{{ n.idInsumo }} &middot; Reportó: {{ n.usuarioEmisor }}</div>
            <div class="acciones-item">
              <button class="btn-leida" *ngIf="!n.leida" [disabled]="marcandoStockId === n.idHistorial" (click)="marcarLeida(n)">
                {{ marcandoStockId === n.idHistorial ? 'Marcando...' : 'Marcar como leída' }}
              </button>
              <span class="badge-leida" *ngIf="n.leida">Leída</span>
            </div>
          </div>
          <div class="vacio" *ngIf="notificaciones.length === 0">No hay alertas.</div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .notif-page { padding: 20px; max-width: 800px; margin: 0 auto; }
    .tabs { display: flex; gap: 8px; margin-bottom: 20px; border-bottom: 2px solid #e0e0e0; }
    .tabs button { padding: 10px 20px; border: none; background: none; cursor: pointer; font-size: .95rem; color: #666; border-bottom: 3px solid transparent; margin-bottom: -2px; display: flex; align-items: center; gap: 6px; }
    .tabs button.active { color: #1976d2; border-bottom-color: #1976d2; font-weight: 600; }
    .badge { background: #f44336; color: #fff; border-radius: 10px; padding: 2px 7px; font-size: .75rem; font-weight: 700; }
    .tab-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; margin-bottom: 16px; }
    .tab-header h2 { margin: 0; font-size: 1.1rem; color: #263238; }
    .filtros { display: flex; gap: 6px; flex-wrap: wrap; }
    .filtros button { padding: 5px 12px; border: 1px solid #ddd; background: #fff; border-radius: 20px; cursor: pointer; font-size: .82rem; }
    .filtros button.active { background: #1976d2; color: #fff; border-color: #1976d2; }
    .btn-recargar { border: 1px solid #ddd; background: #fff; border-radius: 6px; padding: 6px 12px; cursor: pointer; }
    .lista { display: grid; gap: 10px; }
    .item { border: 1px solid #e0e0e0; border-radius: 8px; padding: 14px; background: #fff; }
    .item.leida, .item.atendida { opacity: .7; background: #fafafa; }
    .sol-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .badge-estado { font-size: .75rem; font-weight: 700; padding: 3px 10px; border-radius: 12px; }
    .badge-estado.pendiente { background: #fff3e0; color: #e65100; }
    .badge-estado.atendida-badge { background: #e8f5e9; color: #2e7d32; }
    .sol-proyecto { font-size: 1rem; font-weight: 600; color: #1a237e; margin-bottom: 6px; }
    .sol-detalle { display: flex; gap: 16px; flex-wrap: wrap; font-size: .85rem; color: #555; margin-bottom: 4px; }
    .sol-detalle i { font-style: normal; color: #999; }
    .sol-msg { font-size: .85rem; color: #444; margin: 6px 0; background: #f5f5f5; padding: 6px 10px; border-radius: 4px; }
    .sol-emisor { font-size: .78rem; color: #9e9e9e; margin-top: 4px; }
    .sol-acciones { display: flex; gap: 8px; margin-top: 12px; flex-wrap: wrap; }
    .btn-transferir { background: #1976d2; color: #fff; border: none; border-radius: 6px; padding: 8px 16px; cursor: pointer; font-weight: 600; font-size: .88rem; }
    .btn-transferir:hover { background: #1565c0; }
    .btn-atender { background: #fff; color: #2e7d32; border: 1px solid #2e7d32; border-radius: 6px; padding: 8px 14px; cursor: pointer; font-size: .88rem; }
    .btn-atender:hover:not(:disabled) { background: #e8f5e9; }
    .btn-atender:disabled { opacity: .5; cursor: not-allowed; }
    .sol-atendida-info { font-size: .8rem; color: #2e7d32; margin-top: 8px; }
    .fecha { font-size: .78rem; color: #9e9e9e; }
    .fila1 { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
    .tipo { font-size: .75rem; font-weight: 700; padding: 2px 8px; border-radius: 10px; }
    .tipo.faltante { background: #ffebee; color: #c62828; }
    .tipo.sobrante { background: #e8f5e9; color: #2e7d32; }
    .msg { color: #2f2f2f; margin-bottom: 4px; }
    .meta { font-size: .78rem; color: #9e9e9e; }
    .acciones-item { margin-top: 10px; display: flex; justify-content: flex-end; }
    .btn-leida { border: 1px solid #ff5722; color: #ff5722; background: #fff; border-radius: 6px; padding: 5px 10px; cursor: pointer; font-size: .8rem; }
    .btn-leida:hover:not(:disabled) { background: #fff3e0; }
    .btn-leida:disabled { opacity: .6; cursor: not-allowed; }
    .badge-leida { font-size: .75rem; font-weight: 600; color: #2e7d32; background: #e8f5e9; border-radius: 10px; padding: 2px 8px; }
    .estado.error { color: #c62828; }
    .vacio { color: #9e9e9e; text-align: center; padding: 30px; }
  `]
})
export class NotificacionesComponent implements OnInit {
  tab: 'solicitudes' | 'stock' = 'solicitudes';

  solicitudes: SolicitudMaterialItem[] = [];
  loadingSolicitudes = false;
  errorSolicitudes = '';
  filtroEstado = 'Pendiente';
  pendientes = 0;
  marcandoId: number | null = null;

  notificaciones: NotificacionStockItem[] = [];
  loadingStock = false;
  errorStock = '';
  marcandoStockId: number | null = null;

  constructor(
    private notificacionesService: NotificacionesService,
    private alertas: AlertasService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarSolicitudes();
    this.cargarStock();
  }

  cargarSolicitudes(): void {
    this.loadingSolicitudes = true;
    this.errorSolicitudes = '';
    this.notificacionesService.obtenerSolicitudesMaterial(this.filtroEstado || undefined).subscribe({
      next: (res) => {
        this.solicitudes = res;
        this.pendientes = res.filter(s => s.estado === 'Pendiente').length;
        this.loadingSolicitudes = false;
      },
      error: (err) => {
        this.errorSolicitudes = err?.error?.message || 'No se pudieron cargar las solicitudes';
        this.loadingSolicitudes = false;
      }
    });
  }

  cargarStock(): void {
    this.loadingStock = true;
    this.errorStock = '';
    this.notificacionesService.obtenerNotificacionesStock().subscribe({
      next: (res) => { this.notificaciones = res; this.loadingStock = false; },
      error: (err) => { this.errorStock = err?.error?.message || 'Error al cargar alertas'; this.loadingStock = false; }
    });
  }

  irATransferir(s: SolicitudMaterialItem): void {
    this.router.navigate(['/inventario/asignar-proyecto'], {
      queryParams: { proyecto: s.idProyecto, solicitud: s.idSolicitud }
    });
  }

  atenderSolicitud(s: SolicitudMaterialItem): void {
    if (this.marcandoId !== null) return;
    this.marcandoId = s.idSolicitud;
    this.notificacionesService.atenderSolicitud(s.idSolicitud).subscribe({
      next: () => {
        s.estado = 'Atendida';
        this.marcandoId = null;
        this.pendientes = Math.max(0, this.pendientes - 1);
      },
      error: () => {
        this.marcandoId = null;
        this.alertas.error('Error', 'No se pudo marcar como atendida');
      }
    });
  }

  marcarLeida(n: NotificacionStockItem): void {
    if (n.leida || this.marcandoStockId !== null) return;
    this.marcandoStockId = n.idHistorial;
    this.notificacionesService.marcarNotificacionLeida(n.idHistorial).subscribe({
      next: () => { n.leida = true; this.marcandoStockId = null; },
      error: () => { this.marcandoStockId = null; this.alertas.error('Error', 'No se pudo marcar como leída'); }
    });
  }
}

export default NotificacionesComponent;
