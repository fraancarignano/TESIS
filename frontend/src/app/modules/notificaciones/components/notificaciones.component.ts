import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { AlertasService } from '../../../core/services/alertas';
import { NotificacionesService, NotificacionStockItem } from '../../../core/services/notificaciones.service';

@Component({
  selector: 'app-notificaciones',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="notificaciones-container">
      <div class="header">
        <h2>Notificaciones de Stock</h2>
        <button class="btn-recargar" (click)="cargar()">Recargar</button>
      </div>

      <div class="estado" *ngIf="loading">Cargando...</div>
      <div class="estado error" *ngIf="!loading && error">{{ error }}</div>

      <div class="lista" *ngIf="!loading && !error">
        <div class="item" *ngFor="let n of notificaciones" [class.leida]="n.leida">
          <div class="fila1">
            <span class="tipo" [class.sobrante]="n.tipo === 'Sobrante'" [class.faltante]="n.tipo !== 'Sobrante'">{{ n.tipo }}</span>
            <span class="fecha">{{ n.fecha | date: 'dd/MM/yyyy' }}</span>
          </div>
          <div class="msg">{{ n.mensaje }}</div>
          <div class="meta">Insumo #{{ n.idInsumo }} · Reporto: {{ n.usuarioEmisor }}</div>

          <div class="acciones-item">
            <button
              class="btn-leida"
              *ngIf="!n.leida"
              [disabled]="marcandoId === n.idHistorial"
              (click)="marcarComoLeida(n)">
              {{ marcandoId === n.idHistorial ? 'Marcando...' : 'Marcar como leida' }}
            </button>
            <span class="badge-leida" *ngIf="n.leida">Leida</span>
          </div>
        </div>
        <div class="vacio" *ngIf="notificaciones.length === 0">No hay notificaciones.</div>
      </div>
    </div>
  `,
  styles: [`
    .notificaciones-container { padding: 14px; background: #fff; border-radius: 8px; box-shadow: 0 1px 6px rgba(0,0,0,.08); }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    h2 { margin: 0; font-size: 1rem; color: #263238; }
    .btn-recargar { border: 1px solid #ddd; background: #fff; border-radius: 4px; padding: 6px 10px; cursor: pointer; }
    .lista { display: grid; gap: 8px; }
    .item { border: 1px solid #eee; border-radius: 6px; padding: 10px; }
    .item.leida { opacity: .75; background: #fafafa; }
    .fila1 { display: flex; justify-content: space-between; align-items: center; }
    .tipo { font-size: .75rem; font-weight: 700; padding: 2px 8px; border-radius: 10px; }
    .tipo.faltante { background: #ffebee; color: #c62828; }
    .tipo.sobrante { background: #e8f5e9; color: #2e7d32; }
    .fecha { font-size: .75rem; color: #757575; }
    .msg { margin-top: 4px; color: #2f2f2f; }
    .meta { margin-top: 4px; font-size: .75rem; color: #757575; }
    .acciones-item { margin-top: 10px; display: flex; justify-content: flex-end; }
    .btn-leida { border: 1px solid #ff5722; color: #ff5722; background: #fff; border-radius: 6px; padding: 5px 10px; cursor: pointer; font-size: .8rem; }
    .btn-leida:hover { background: #fff3e0; }
    .btn-leida:disabled { opacity: .6; cursor: not-allowed; }
    .badge-leida { font-size: .75rem; font-weight: 600; color: #2e7d32; background: #e8f5e9; border-radius: 10px; padding: 2px 8px; }
    .estado.error { color: #c62828; }
    .vacio { color: #757575; }
  `]
})
export class NotificacionesComponent implements OnInit {
  notificaciones: NotificacionStockItem[] = [];
  loading = false;
  error = '';
  marcandoId: number | null = null;

  constructor(
    private notificacionesService: NotificacionesService,
    private alertas: AlertasService
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.loading = true;
    this.error = '';
    this.notificacionesService.obtenerNotificacionesStock().subscribe({
      next: (res) => {
        this.notificaciones = res;
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.error?.message || 'No se pudieron cargar las notificaciones';
        this.loading = false;
      }
    });
  }

  marcarComoLeida(item: NotificacionStockItem): void {
    if (item.leida || this.marcandoId !== null) return;

    this.marcandoId = item.idHistorial;
    this.notificacionesService.marcarNotificacionLeida(item.idHistorial).subscribe({
      next: () => {
        item.leida = true;
        this.marcandoId = null;
      },
      error: () => {
        this.marcandoId = null;
        this.alertas.error('Error', 'No se pudo marcar la notificacion como leida');
      }
    });
  }
}

export default NotificacionesComponent;
