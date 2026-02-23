import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InsumosService } from '../services/insumos.service';
import { Insumo } from './../models/insumo.model';
import { InsumoDetalleModalComponent } from '../insumo-detalle-modal/insumo-detalle-modal.component';
import { InsumoFormComponent } from '../insumo-form/insumo-form.component';
import { InsumoFiltrosComponent, FiltrosInsumo } from './insumo-filtros/insumo-filtros.component';

@Component({
  selector: 'app-inventario',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    InsumoDetalleModalComponent,
    InsumoFormComponent,
    InsumoFiltrosComponent
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

  // Confirmación de cambio de estado
  confirmacion: {
    visible: boolean;
    insumo: Insumo | null;
    nuevoEstado: string;
  } = { visible: false, insumo: null, nuevoEstado: '' };

  // Confirmación de eliminación
  confirmacionEliminar: {
    visible: boolean;
    insumo: Insumo | null;
  } = { visible: false, insumo: null };

  constructor(private insumosService: InsumosService) { }

  ngOnInit(): void {
    this.cargarInsumos();
  }

  // Cierra el dropdown si se hace click fuera
  @HostListener('document:click')
  cerrarDropdownGlobal(): void {
    this.insumoDropdownAbierto = null;
  }

  cargarInsumos(): void {
    this.insumosService.getInsumos().subscribe({
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

    this.insumosService.buscarInsumos(searchDto).subscribe({
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

  // Cuando se selecciona un estado del dropdown → muestra confirmación
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
}