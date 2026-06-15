import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrdenCompraService } from '../services/orden-compra.service';
import { OrdenCompra } from '../models/orden-compra.model';
import { OrdenCompraFormComponent } from './orden-compra-form/orden-compra-form.component';
import { OrdenCompraReceiveComponent } from './orden-compra-receive/orden-compra-receive.component';
import { AlertasService } from '../../../core/services/alertas';
import { AuthService } from '../../login/services/auth.service';
import { HasPermissionDirective } from '../../../core/directives/has-permission.directive';
import { ExportService } from '../../../core/services/export.service';

@Component({
  selector: 'app-orden-compra',
  standalone: true,
  imports: [CommonModule, FormsModule, OrdenCompraFormComponent, OrdenCompraReceiveComponent, HasPermissionDirective],
  templateUrl: './orden-compra.component.html',
  styleUrls: ['./orden-compra.component.css']
})
export class OrdenCompraComponent implements OnInit {
  ordenes: OrdenCompra[] = [];
  mostrarFormulario = false;
  mostrarDetalle = false;
  mostrarRecepcion = false;
  ordenSeleccionada: OrdenCompra | null = null;
  loading = false;
  error = false;
  terminoBusqueda = '';

  // Filtros
  filtroEstado = '';
  filtroFechaDesde = '';
  filtroFechaHasta = '';
  mostrarRecibidas = false;

  readonly ORDEN_ESTADOS: Record<string, number> = {
    'Verificada': 0,
    'PendienteControl': 1,
    'Pendiente': 2,
    'Aprobada': 3,
    'Recibida': 4,
    'Anulada': 5,
    'Cancelada': 6
  };

  constructor(
    private ordenCompraService: OrdenCompraService,
    private alertas: AlertasService,
    private authService: AuthService,
    private exportService: ExportService
  ) { }

  ngOnInit(): void {
    this.cargarOrdenes();
  }

  cargarOrdenes(): void {
    this.loading = true;
    this.error = false;

    this.ordenCompraService.obtenerOrdenes().subscribe({
      next: (data) => {
        this.ordenes = data;
        this.loading = false;
        console.log('Órdenes cargadas:', this.ordenes);
      },
      error: (err) => {
        console.error('Error al cargar pedidos:', err);
        this.error = true;
        this.loading = false;
        this.alertas.error('Error', 'No se pudieron cargar las notas de pedido');
      }
    });
  }

  get ordenesFiltradas(): OrdenCompra[] {
    let result = this.ordenes;

    // Por defecto mostrar solo activas (ocultar Recibida, Anulada, Cancelada, Ingresada)
    if (!this.mostrarRecibidas) {
      result = result.filter(o =>
        o.estado !== 'Recibida' &&
        o.estado !== 'Anulada' &&
        o.estado !== 'Cancelada' &&
        o.estado !== 'Ingresada'
      );
    }

    // Filtro por estado
    if (this.filtroEstado) {
      result = result.filter(o => o.estado === this.filtroEstado);
    }

    // Filtro por texto
    if (this.terminoBusqueda) {
      const t = this.terminoBusqueda.toLowerCase();
      result = result.filter(o =>
        o.nroOrden.toLowerCase().includes(t) ||
        (o.nombreProveedor || '').toLowerCase().includes(t) ||
        (o.nombreProyecto || '').toLowerCase().includes(t)
      );
    }

    // Filtro por fecha desde
    if (this.filtroFechaDesde) {
      result = result.filter(o => o.fechaSolicitud >= this.filtroFechaDesde);
    }

    // Filtro por fecha hasta
    if (this.filtroFechaHasta) {
      result = result.filter(o => o.fechaSolicitud <= this.filtroFechaHasta);
    }

    // Orden: Verificada → PendienteControl → Pendiente → resto
    return result.sort((a, b) => {
      const pa = this.ORDEN_ESTADOS[a.estado] ?? 99;
      const pb = this.ORDEN_ESTADOS[b.estado] ?? 99;
      if (pa !== pb) return pa - pb;
      return b.fechaSolicitud.localeCompare(a.fechaSolicitud);
    });
  }

  abrirFormularioNuevo(): void {
    this.mostrarFormulario = true;
  }

  cerrarFormulario(): void {
    this.mostrarFormulario = false;
  }

  abrirDetalle(orden: OrdenCompra): void {
    this.ordenSeleccionada = orden;
    this.mostrarDetalle = true;
  }

  cerrarDetalle(): void {
    this.mostrarDetalle = false;
    this.ordenSeleccionada = null;
  }

  abrirRecepcion(orden: OrdenCompra): void {
    this.ordenSeleccionada = orden;
    this.mostrarDetalle = false;
    this.mostrarRecepcion = true;
  }

  cerrarRecepcion(): void {
    this.mostrarRecepcion = false;
    this.ordenSeleccionada = null;
  }

  async rechazarOrden(orden: OrdenCompra): Promise<void> {
    const confirmado = await this.alertas.confirmar(
      '¿Rechazar pedido?',
      `Se rechazará el pedido ${orden.nroOrden}. Esta acción no se puede deshacer.`,
      'Sí, rechazar'
    );

    if (confirmado) {
      // TODO: Implementar endpoint de rechazo en el backend
      this.alertas.info('Funcionalidad pendiente', 'El rechazo de órdenes aún no está implementado en el backend');
    }
  }

  async habilitarControl(orden: OrdenCompra, event?: Event): Promise<void> {
    event?.stopPropagation();

    const confirmado = await this.alertas.confirmar(
      '¿Habilitar recepción?',
      `La orden ${orden.nroOrden} quedará disponible para que el operario realice el control de recepción.`,
      'Sí, habilitar'
    );
    if (!confirmado) return;

    const usuario = this.authService.obtenerUsuarioActual();
    if (!usuario) { this.alertas.error('Error', 'No se pudo obtener el usuario actual'); return; }

    this.ordenCompraService.habilitarControl(orden.idOrdenCompra, usuario.idUsuario).subscribe({
      next: () => {
        this.alertas.success('Recepción habilitada', 'El operario ya puede realizar el control.');
        this.cargarOrdenes();
        this.cerrarDetalle();
      },
      error: () => this.alertas.error('Error', 'No se pudo habilitar el control de recepción.')
    });
  }

  async recalcularRecepcion(orden: OrdenCompra, event?: Event): Promise<void> {
    event?.stopPropagation();

    const confirmado = await this.alertas.confirmar(
      '¿Recalcular recepción?',
      `La orden ${orden.nroOrden} volverá a estado "Pendiente Control" para que el operario realice un nuevo control. El stock registrado no se revertirá.`,
      'Sí, recalcular'
    );
    if (!confirmado) return;

    this.ordenCompraService.recalcularRecepcion(orden.idOrdenCompra).subscribe({
      next: () => {
        this.alertas.success('Control reabierto', 'La orden está nuevamente disponible para el operario.');
        this.cargarOrdenes();
        this.cerrarDetalle();
      },
      error: () => this.alertas.error('Error', 'No se pudo recalcular la recepción.')
    });
  }

  async verificarOrden(orden: OrdenCompra, event?: Event): Promise<void> {
    event?.stopPropagation();
    const confirmado = await this.alertas.confirmar(
      '¿Verificar pedido?',
      `El pedido ${orden.nroOrden} quedará verificado y listo para asignar a ubicación o proyecto.`,
      'Sí, verificar'
    );
    if (!confirmado) return;

    this.ordenCompraService.verificarOrden(orden.idOrdenCompra).subscribe({
      next: () => {
        this.alertas.success('Pedido verificado', 'El pedido está listo para ser asignado.');
        this.cargarOrdenes();
        this.cerrarDetalle();
      },
      error: () => this.alertas.error('Error', 'No se pudo verificar la orden.')
    });
  }

  async anularOrden(orden: OrdenCompra, event?: Event): Promise<void> {    event?.stopPropagation();

    const confirmado = await this.alertas.confirmar(
      '¿Anular pedido?',
      `El pedido ${orden.nroOrden} quedará anulado. Luego podrá eliminarla definitivamente.`,
      'Sí, anular'
    );
    if (!confirmado) return;

    this.ordenCompraService.anularOrden(orden.idOrdenCompra).subscribe({
      next: () => {
        this.alertas.success('Pedido anulado', 'El pedido fue anulado correctamente.');
        this.cargarOrdenes();
        this.cerrarDetalle();
      },
      error: () => this.alertas.error('Error', 'No se pudo anular la orden.')
    });
  }

  async eliminarOrden(orden: OrdenCompra, event?: Event): Promise<void> {
    if (event) event.stopPropagation();

    const confirmado = await this.alertas.confirmar(
      '¿Eliminar pedido?',
      `Se eliminará permanentemente el pedido ${orden.nroOrden}. Esta acción no se puede deshacer.`,
      'Sí, eliminar'
    );

    if (confirmado) {
      this.ordenCompraService.eliminarOrden(orden.idOrdenCompra).subscribe({
        next: () => {
          this.alertas.success('Pedido eliminado', 'El pedido se eliminó correctamente');
          this.cargarOrdenes();
          this.cerrarDetalle();
        },
        error: (err) => {
          console.error('Error al eliminar:', err);
          this.alertas.error('Error', 'No se pudo eliminar el pedido');
        }
      });
    }
  }

  getEstadoClass(estado: string): string {
    const estados: { [key: string]: string } = {
      'Pendiente': 'badge-pendiente',
      'Aprobada': 'badge-aprobada',
      'PendienteControl': 'badge-pendiente-control',
      'Recibida': 'badge-recibida',
      'Verificada': 'badge-verificada',
      'Cancelada': 'badge-cancelada',
      'Anulada': 'badge-anulada'
    };
    return estados[estado] || 'badge-default';
  }

  contarEstado(orden: OrdenCompra, estado: string): number {
    return orden.detalles?.filter(d => d.estadoRecepcion === estado).length ?? 0;
  }

  formatearFecha(fecha: string): string {
    if (!fecha) return '-';
    const date = new Date(fecha);
    return date.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  imprimirPedido(orden: OrdenCompra, event?: Event): void {
    if (event) event.stopPropagation();
    this.exportService.exportarOrdenCompraPDF(orden);
  }

  exportarPDF(orden: OrdenCompra, event?: Event): void {
    if (event) event.stopPropagation();
    this.exportService.exportarOrdenCompraPDF(orden);
  }
}
