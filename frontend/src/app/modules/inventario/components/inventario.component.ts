import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InsumosService } from '../services/insumos.service';
import { Insumo } from './../models/insumo.model';
import { InsumoDetalleModalComponent } from '../insumo-detalle-modal/insumo-detalle-modal.component';
import { InsumoFormComponent } from '../insumo-form/insumo-form.component';
import { InsumoFiltrosComponent, FiltrosInsumo } from './insumo-filtros/insumo-filtros.component';
import { AlertasService } from '../../../core/services/alertas';
import { NotificacionesService } from '../../../core/services/notificaciones.service';
import { PermissionService } from '../../../core/services/permission.service';
import { HasPermissionDirective } from '../../../core/directives/has-permission.directive';

@Component({
  selector: 'app-inventario',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    InsumoDetalleModalComponent,
    InsumoFormComponent,
    InsumoFiltrosComponent,
    HasPermissionDirective
  ],
  templateUrl: './inventario.component.html',
  styleUrls: ['./inventario.component.css']
})
export class InventarioComponent implements OnInit {
  insumos: Insumo[] = [];
  mostrarDetalle = false;
  mostrarFormulario = false;
  insumoSeleccionado: Insumo | null = null;
  insumoDetalle: Insumo | null = null;
  terminoBusqueda = '';
  filtrosActivos: FiltrosInsumo = {};

  // Dropdown de estado
  insumoDropdownAbierto: number | null = null;
  estadosDisponibles = ['Disponible', 'En uso', 'A designar', 'Agotado'];

  // Selección múltiple para ajuste de precios
  seleccionados = new Set<number>();
  porcentajeAjuste: number | null = null;

  get todosSeleccionados(): boolean {
    return this.insumosFiltrados.length > 0 &&
      this.insumosFiltrados.every(i => this.seleccionados.has(i.idInsumo!));
  }

  toggleSeleccion(insumo: Insumo): void {
    if (this.seleccionados.has(insumo.idInsumo!)) this.seleccionados.delete(insumo.idInsumo!);
    else this.seleccionados.add(insumo.idInsumo!);
  }

  toggleSeleccionTodos(): void {
    if (this.todosSeleccionados) this.limpiarSeleccion();
    else this.insumosFiltrados.forEach(i => this.seleccionados.add(i.idInsumo!));
  }

  limpiarSeleccion(): void {
    this.seleccionados.clear();
    this.porcentajeAjuste = null;
  }

  aplicarAjusteMasivo(): void {
    if (!this.porcentajeAjuste || this.seleccionados.size === 0) return;
    const ids = Array.from(this.seleccionados);
    const pct = this.porcentajeAjuste;
    const signo = pct > 0 ? `+${pct}%` : `${pct}%`;
    this.alertas.confirmar(
      '¿Aplicar ajuste de precios?',
      `Se aplicará un ajuste de ${signo} a ${ids.length} insumo(s). Solo afecta insumos que ya tienen precio cargado.`,
      'Sí, aplicar'
    ).then(confirmado => {
      if (!confirmado) return;
      this.insumosService.ajustarPreciosMasivo(ids, pct).subscribe({
        next: (res: any) => {
          this.alertas.success('Precios actualizados', `Se actualizaron ${res.message}`);
          this.limpiarSeleccion();
          this.cargarInsumos();
        },
        error: () => this.alertas.error('Error', 'No se pudieron actualizar los precios')
      });
    });
  }

  // Confirmacion de cambio de estado
  confirmacion: {
    visible: boolean;
    insumo: Insumo | null;
    nuevoEstado: string;
  } = { visible: false, insumo: null, nuevoEstado: '' };

  // Confirmacion de eliminacion
  confirmacionEliminar: {
    visible: boolean;
    insumo: Insumo | null;
  } = { visible: false, insumo: null };

  // Modal de notificacion de stock
  notificacionModal: {
    visible: boolean;
    insumo: Insumo | null;
    tipo: 'Faltante' | 'Sobrante';
    mensaje: string;
    enviando: boolean;
  } = {
    visible: false,
    insumo: null,
    tipo: 'Faltante',
    mensaje: '',
    enviando: false
  };

  constructor(
    private insumosService: InsumosService,
    private alertas: AlertasService,
    private notificacionesService: NotificacionesService,
    public permissionService: PermissionService
  ) { }

  ngOnInit(): void {
    this.cargarInsumos();
  }

  // Cierra el dropdown si se hace click fuera
  @HostListener('document:click')
  cerrarDropdownGlobal(): void {
    this.insumoDropdownAbierto = null;
  }

  cargarInsumos(): void {
    this.insumosService.getInsumosConStock().subscribe({
      next: (insumos) => {
        this.insumos = insumos;
      },
      error: (error: any) => {
        console.error('Error al cargar insumos:', error);
      }
    });
  }

  onFiltrosChange(filtros: FiltrosInsumo): void {
    this.filtrosActivos = filtros;
    this.aplicarFiltrosAvanzados();
  }

  aplicarFiltrosAvanzados(): void {
    if (Object.keys(this.filtrosActivos).length === 0 && !this.terminoBusqueda) {
      this.cargarInsumos();
      return;
    }

    const searchDto: FiltrosInsumo = {
      ...this.filtrosActivos,
      nombreInsumo: this.terminoBusqueda || undefined
    };

    this.insumosService.buscarInsumosConStock(searchDto).subscribe({
      next: (insumos) => {
        this.insumos = insumos;
      },
      error: (err: any) => {
        console.error('Error al buscar insumos:', err);
      }
    });
  }

  get insumosFiltrados(): Insumo[] {
    return this.insumos;
  }

  abrirFormularioNuevo(): void {
    this.insumoSeleccionado = null;
    this.mostrarFormulario = true;
  }

  abrirFormularioEditar(insumo: Insumo, event: Event): void {
    event.stopPropagation();
    this.insumoSeleccionado = { ...insumo };
    this.mostrarFormulario = true;
  }

  cerrarFormulario(): void {
    this.mostrarFormulario = false;
    this.insumoSeleccionado = null;
    this.cargarInsumos();
  }

  abrirDetalle(insumo: Insumo): void {
    if (insumo.idInsumo) {
      this.insumosService.getInsumoById(insumo.idInsumo).subscribe({
        next: (insumoDetalle) => {
          this.insumoDetalle = insumoDetalle;
          this.mostrarDetalle = true;
        },
        error: (error: any) => {
          console.error('Error al obtener detalle:', error);
          this.insumoDetalle = insumo;
          this.mostrarDetalle = true;
        }
      });
    }
  }

  cerrarDetalle(): void {
    this.mostrarDetalle = false;
    this.insumoDetalle = null;
  }

  eliminarInsumo(id: number, event: Event): void {
    event.stopPropagation();
    const insumo = this.insumos.find(i => i.idInsumo === id);
    if (insumo) {
      this.confirmacionEliminar = { visible: true, insumo };
    }
  }

  confirmarEliminar(): void {
    if (!this.confirmacionEliminar.insumo?.idInsumo) return;
    const id = this.confirmacionEliminar.insumo.idInsumo;

    this.insumosService.eliminarInsumo(id).subscribe({
      next: () => {
        this.confirmacionEliminar = { visible: false, insumo: null };
        this.cargarInsumos();
      },
      error: (error: any) => {
        console.error('Error al eliminar:', error);
        alert('Error al eliminar el insumo');
        this.confirmacionEliminar = { visible: false, insumo: null };
      }
    });
  }

  cancelarEliminar(): void {
    this.confirmacionEliminar = { visible: false, insumo: null };
  }

  // Abre/cierra el dropdown del estado
  toggleDropdownEstado(insumo: Insumo, event: Event): void {
    event.stopPropagation();
    this.insumoDropdownAbierto =
      this.insumoDropdownAbierto === insumo.idInsumo ? null : insumo.idInsumo!;
  }

  // Cuando se selecciona un estado del dropdown -> muestra confirmacion
  seleccionarEstado(insumo: Insumo, nuevoEstado: string): void {
    const estadoActual = insumo.estado || 'Disponible';
    this.insumoDropdownAbierto = null;

    if (estadoActual === nuevoEstado) return;

    this.confirmacion = { visible: true, insumo, nuevoEstado };
  }

  confirmarCambio(): void {
    if (!this.confirmacion.insumo) return;
    const insumo = this.confirmacion.insumo;
    const nuevoEstado = this.confirmacion.nuevoEstado;

    this.confirmacion = { visible: false, insumo: null, nuevoEstado: '' };

    this.insumosService.cambiarEstado(insumo.idInsumo!, nuevoEstado).subscribe({
      next: () => {
        const idx = this.insumos.findIndex(i => i.idInsumo === insumo.idInsumo);
        if (idx !== -1) {
          this.insumos[idx] = { ...this.insumos[idx], estado: nuevoEstado };
        }
      },
      error: (error: any) => {
        console.error('Error al cambiar estado:', error);
        alert('Error al cambiar el estado');
      }
    });
  }

  cancelarCambio(): void {
    this.confirmacion = { visible: false, insumo: null, nuevoEstado: '' };
  }

  getEstadoClass(estado?: string): string {
    if (!estado) return 'estado-disponible';

    switch (estado.toLowerCase()) {
      case 'en uso':
        return 'estado-en-uso';
      case 'a designar':
        return 'estado-a-designar';
      case 'agotado':
        return 'estado-agotado';
      case 'disponible':
        return 'estado-disponible';
      default:
        return 'estado-disponible';
    }
  }

  stockBajo(insumo: Insumo): boolean {
    if (!insumo.stockMinimo) return false;
    return insumo.stockActual < insumo.stockMinimo;
  }

  stockSobrante(insumo: Insumo): boolean {
    if (!insumo.stockMinimo || insumo.stockMinimo <= 0) return false;
    return insumo.stockActual > (insumo.stockMinimo * 1.5);
  }

  abrirModalNotificacion(insumo: Insumo, event: Event): void {
    event.stopPropagation();

    const tipoSugerido: 'Faltante' | 'Sobrante' = this.stockBajo(insumo) ? 'Faltante' : 'Sobrante';
    const mensajeSugerido = tipoSugerido === 'Faltante'
      ? 'Stock por debajo del minimo, gestionar compra.'
      : 'Stock alto, revisar reposicion y consumo.';

    this.notificacionModal = {
      visible: true,
      insumo,
      tipo: tipoSugerido,
      mensaje: mensajeSugerido,
      enviando: false
    };
  }

  cerrarModalNotificacion(): void {
    this.notificacionModal = {
      visible: false,
      insumo: null,
      tipo: 'Faltante',
      mensaje: '',
      enviando: false
    };
  }

  enviarNotificacionStock(): void {
    if (!this.notificacionModal.insumo?.idInsumo || this.notificacionModal.enviando) return;

    const { insumo, tipo, mensaje } = this.notificacionModal;
    this.notificacionModal.enviando = true;

    this.notificacionesService.crearNotificacionStock({
      idInsumo: insumo.idInsumo!,
      tipo,
      stockActual: insumo.stockActual,
      stockMinimo: insumo.stockMinimo,
      mensaje: mensaje.trim() || undefined
    }).subscribe({
      next: () => {
        this.alertas.success('Notificacion enviada', 'Se notifico al supervisor correctamente');
        this.cerrarModalNotificacion();
      },
      error: () => {
        this.notificacionModal.enviando = false;
        this.alertas.error('Error', 'No se pudo enviar la notificacion');
      }
    });
  }
}
