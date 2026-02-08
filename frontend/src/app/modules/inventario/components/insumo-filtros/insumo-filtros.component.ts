import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InsumosService } from '../../services/insumos.service';
import { TipoInsumo } from '../../models/insumo.model';

export interface FiltrosInsumo {
  nombreInsumo?: string;
  idTipoInsumo?: number;
  unidadMedida?: string;
  estado?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  soloStockBajo?: boolean;
}

@Component({
  selector: 'app-insumo-filtros',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './insumo-filtros.component.html',
  styleUrls: ['./insumo-filtros.component.css']
})
export class InsumoFiltrosComponent implements OnInit {
  @Output() filtrosChange = new EventEmitter<FiltrosInsumo>();

  mostrarFiltrosAvanzados = false;
  
  // Estados disponibles para chips
  estadosDisponibles = [
    { nombre: 'Disponible', seleccionado: false },
    { nombre: 'En uso', seleccionado: false },
    { nombre: 'Agotado', seleccionado: false },
    { nombre: 'A designar', seleccionado: false }
  ];

  tiposInsumo: TipoInsumo[] = [];
  unidadesMedida: string[] = ['Unidades', 'Metros', 'Litros', 'Kg', 'Rollos']; // Valores comunes, podrían venir de un servicio

  filtros: FiltrosInsumo = {
    unidadMedida: '',
    fechaDesde: '',
    fechaHasta: ''
  };

  constructor(private insumosService: InsumosService) {}

  ngOnInit(): void {
    this.cargarTiposInsumo();
  }

  cargarTiposInsumo(): void {
    this.insumosService.getTiposInsumo().subscribe({
      next: (data) => {
        this.tiposInsumo = data;
      },
      error: (err) => {
        console.error('Error al cargar tipos de insumo:', err);
      }
    });
  }

  toggleEstado(estado: any): void {
    // Para simplificar y que coincida con el backend que espera un solo string de estado,
    // haremos que solo se pueda seleccionar uno a la vez en los chips o enviar una lista si el backend lo permite.
    // Viendo el InsumoSearchDTO del backend, 'Estado' es string, así que seleccionaremos uno solo.
    
    const yaSeleccionado = estado.seleccionado;
    this.estadosDisponibles.forEach(e => e.seleccionado = false);
    estado.seleccionado = !yaSeleccionado;
    
    this.filtros.estado = estado.seleccionado ? estado.nombre : undefined;
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
    this.filtros = {
      unidadMedida: '',
      fechaDesde: '',
      fechaHasta: '',
      idTipoInsumo: undefined,
      estado: undefined
    };
    this.emitirFiltros();
  }

  private emitirFiltros(): void {
    // Limpiar campos vacíos antes de emitir
    const filtrosAEnviar = { ...this.filtros };
    if (!filtrosAEnviar.fechaDesde) delete filtrosAEnviar.fechaDesde;
    if (!filtrosAEnviar.fechaHasta) delete filtrosAEnviar.fechaHasta;
    if (!filtrosAEnviar.unidadMedida) delete filtrosAEnviar.unidadMedida;
    
    this.filtrosChange.emit(filtrosAEnviar);
  }

  get contadorFiltrosActivos(): number {
    let count = 0;
    if (this.filtros.estado) count++;
    if (this.filtros.idTipoInsumo) count++;
    if (this.filtros.unidadMedida) count++;
    if (this.filtros.fechaDesde || this.filtros.fechaHasta) count++;
    return count;
  }
}
