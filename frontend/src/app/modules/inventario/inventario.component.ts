import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InsumosService } from './services/insumos.service';
import { Insumo } from './models/insumo.model';
import { InsumoDetalleModalComponent } from './insumo-detalle-modal/insumo-detalle-modal.component';
import { InsumoFormComponent } from './insumo-form/insumo-form.component';
import { InsumoFiltrosComponent, FiltrosInsumo } from './components/insumo-filtros/insumo-filtros.component';

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

  constructor(private insumosService: InsumosService) { }

  ngOnInit(): void {
    this.cargarInsumos();
  }

  cargarInsumos(): void {
    this.insumosService.getInsumos().subscribe(
      insumos => this.insumos = insumos
    );
  }

  onFiltrosChange(filtros: FiltrosInsumo): void {
    this.filtrosActivos = filtros;
    this.aplicarFiltrosAvanzados();
  }

  aplicarFiltrosAvanzados(): void {
    // Si no hay filtros avanzados activos ni término de búsqueda, cargar todos
    if (Object.keys(this.filtrosActivos).length === 0 && !this.terminoBusqueda) {
      this.cargarInsumos();
      return;
    }

    // Preparar el DTO de búsqueda combinando el término de búsqueda con los filtros
    const searchDto: FiltrosInsumo = {
      ...this.filtrosActivos,
      nombreInsumo: this.terminoBusqueda || undefined
    };

    this.insumosService.buscarInsumos(searchDto).subscribe({
      next: (insumos) => {
        this.insumos = insumos;
      },
      error: (err) => {
        console.error('Error al buscar insumos:', err);
      }
    });
  }

  get insumosFiltrados(): Insumo[] {
    // Como ahora la búsqueda se hace por backend al cambiar filtros o término,
    // simplemente devolvemos la lista actual. 
    // Nota: Para una búsqueda "en vivo" mientras se escribe en el input, 
    // lo ideal sería llamar a aplicarFiltrosAvanzados() en el (ngModelChange) del input.
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
  }

  abrirDetalle(insumo: Insumo): void {
    this.insumoDetalle = insumo;
    this.mostrarDetalle = true;
  }

  cerrarDetalle(): void {
    this.mostrarDetalle = false;
    this.insumoDetalle = null;
  }

  eliminarInsumo(id: number, event: Event): void {
    event.stopPropagation();

    if (confirm('¿Está seguro de eliminar este insumo?')) {
      this.insumosService.eliminarInsumo(id);
    }
  }

  cambiarEstado(insumo: Insumo, event: Event): void {
    event.stopPropagation();

    // Ciclo de estados
    const estados = ['En uso', 'A designar', 'Agotado', 'Disponible'];
    const indexActual = estados.indexOf(insumo.estado || 'Disponible');
    const nuevoEstado = estados[(indexActual + 1) % estados.length];

    this.insumosService.cambiarEstado(insumo.idInsumo!, nuevoEstado);
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