import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EstadoProyecto, PrioridadProyecto } from '../../models/proyecto.model';

@Component({
  selector: 'app-proyecto-filtros',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './proyecto-filtros.component.html',
  styleUrls: ['./proyecto-filtros.component.css']
})
export class ProyectoFiltrosComponent implements OnInit {
  // Emitir any para evitar conflictos de tipos
  @Output() filtrosChange = new EventEmitter<any>();

  mostrarFiltrosAvanzados = false;
  
  // Estados disponibles
  estadosDisponibles: { valor: EstadoProyecto; seleccionado: boolean }[] = [
    { valor: 'Pendiente', seleccionado: false },
    { valor: 'En Proceso', seleccionado: false },
    { valor: 'Finalizado', seleccionado: false },
    { valor: 'Pausado', seleccionado: false },
    { valor: 'Cancelado', seleccionado: false },
    { valor: 'Archivado', seleccionado: false }
  ];

  // Prioridades disponibles
  prioridadesDisponibles: { valor: PrioridadProyecto; nombre: string; seleccionado: boolean }[] = [
    { valor: 'alta', nombre: 'Alta', seleccionado: false },
    { valor: 'media', nombre: 'Media', seleccionado: false },
    { valor: 'baja', nombre: 'Baja', seleccionado: false }
  ];

  // Tipos de prenda disponibles
  tiposPrendaDisponibles = [
    { valor: 'Remera', seleccionado: false },
    { valor: 'Camisa', seleccionado: false },
    { valor: 'Pantalón', seleccionado: false },
    { valor: 'Vestido', seleccionado: false },
    { valor: 'Buzo', seleccionado: false },
    { valor: 'Campera', seleccionado: false },
    { valor: 'Short', seleccionado: false },
    { valor: 'Otro', seleccionado: false }
  ];

  // Fechas
  fechaDesde = '';
  fechaHasta = '';

  ngOnInit(): void {}

  toggleEstado(estado: any): void {
    estado.seleccionado = !estado.seleccionado;
    this.emitirFiltros();
  }

  togglePrioridad(prioridad: any): void {
    prioridad.seleccionado = !prioridad.seleccionado;
    this.emitirFiltros();
  }

  toggleTipoPrenda(tipo: any): void {
    tipo.seleccionado = !tipo.seleccionado;
    this.emitirFiltros();
  }

  toggleFiltrosAvanzados(): void {
    this.mostrarFiltrosAvanzados = !this.mostrarFiltrosAvanzados;
  }

  aplicarFiltros(): void {
    this.emitirFiltros();
  }

  limpiarFiltros(): void {
    this.estadosDisponibles.forEach(e => e.seleccionado = false);
    this.prioridadesDisponibles.forEach(p => p.seleccionado = false);
    this.tiposPrendaDisponibles.forEach(t => t.seleccionado = false);
    this.fechaDesde = '';
    this.fechaHasta = '';
    this.filtrosChange.emit(null);
  }

  private emitirFiltros(): void {
    const estadosSeleccionados = this.estadosDisponibles
      .filter(e => e.seleccionado)
      .map(e => e.valor);
    
    const prioridadesSeleccionadas = this.prioridadesDisponibles
      .filter(p => p.seleccionado)
      .map(p => p.valor);
    
    const tiposPrendaSeleccionados = this.tiposPrendaDisponibles
      .filter(t => t.seleccionado)
      .map(t => t.valor);

    if (estadosSeleccionados.length === 0 && 
        prioridadesSeleccionadas.length === 0 && 
        tiposPrendaSeleccionados.length === 0 &&
        !this.fechaDesde && 
        !this.fechaHasta) {
      this.filtrosChange.emit(null);
      return;
    }

    // Emitir objeto simple sin tipado estricto
    const filtros = {
      estados: estadosSeleccionados,
      prioridades: prioridadesSeleccionadas,
      tiposPrenda: tiposPrendaSeleccionados,
      fechaDesde: this.fechaDesde || undefined,
      fechaHasta: this.fechaHasta || undefined
    };

    this.filtrosChange.emit(filtros);
  }

  get contadorFiltrosActivos(): number {
    let count = 0;
    count += this.estadosDisponibles.filter(e => e.seleccionado).length;
    count += this.prioridadesDisponibles.filter(p => p.seleccionado).length;
    count += this.tiposPrendaDisponibles.filter(t => t.seleccionado).length;
    if (this.fechaDesde) count++;
    if (this.fechaHasta) count++;
    return count;
  }
}