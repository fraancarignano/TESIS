import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrdenCompraService } from '../services/orden-compra.service';
import { OrdenCompra } from '../models/orden-compra.model';
import { OrdenCompraFormComponent } from './orden-compra-form/orden-compra-form.component';
import { AlertasService } from '../../../../../No-Frontend/src/app/core/services/alertas';

@Component({
  selector: 'app-orden-compra',
  standalone: true,
  imports: [CommonModule, FormsModule, OrdenCompraFormComponent],
  templateUrl: './orden-compra.component.html',
  styleUrls: ['./orden-compra.component.css']
})
export class OrdenCompraComponent implements OnInit {
  ordenes: OrdenCompra[] = [];
  mostrarFormulario = false;
  mostrarDetalle = false;
  ordenSeleccionada: OrdenCompra | null = null;
  loading = false;
  error = false;
  terminoBusqueda = '';

  constructor(
    private ordenCompraService: OrdenCompraService,
    private alertas: AlertasService
  ) {}

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
        console.error('Error al cargar órdenes:', err);
        this.error = true;
        this.loading = false;
        this.alertas.error('Error', 'No se pudieron cargar las órdenes de compra');
      }
    });
  }

  get ordenesFiltradas(): OrdenCompra[] {
    if (!this.terminoBusqueda) {
      return this.ordenes;
    }

    const termino = this.terminoBusqueda.toLowerCase();
    return this.ordenes.filter(o =>
      o.nroOrden.toLowerCase().includes(termino) ||
      o.nombreProveedor?.toLowerCase().includes(termino) ||
      o.estado.toLowerCase().includes(termino)
    );
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

  async eliminarOrden(orden: OrdenCompra, event: Event): Promise<void> {
    event.stopPropagation();

    const confirmado = await this.alertas.confirmar(
      '¿Eliminar orden de compra?',
      `Se eliminará la orden ${orden.nroOrden}. Esta acción no se puede deshacer.`,
      'Sí, eliminar'
    );

    if (confirmado) {
      this.ordenCompraService.eliminarOrden(orden.idOrdenCompra).subscribe({
        next: () => {
          this.alertas.success('Orden eliminada', 'La orden de compra se eliminó correctamente');
          this.cargarOrdenes();
        },
        error: (err) => {
          console.error('Error al eliminar:', err);
          this.alertas.error('Error', 'No se pudo eliminar la orden de compra');
        }
      });
    }
  }

  getEstadoClass(estado: string): string {
    const estados: { [key: string]: string } = {
      'Pendiente': 'badge-pendiente',
      'Aprobada': 'badge-aprobada',
      'Recibida': 'badge-recibida',
      'Cancelada': 'badge-cancelada'
    };
    return estados[estado] || 'badge-default';
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
}