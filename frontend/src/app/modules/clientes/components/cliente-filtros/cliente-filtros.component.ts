import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProvinciaService, Provincia } from '../../services/provincia.service';
import { CiudadService, Ciudad } from '../../services/ciudad.service';
import { ClientesService } from '../../services/clientes.service';

export interface FiltrosCliente {
  estados: number[];
  tiposCliente: string[];
  idProvincia?: number;
  idCiudad?: number;
  fechaDesde?: string;
  fechaHasta?: string;
  tipoDocumento?: string;
}

@Component({
  selector: 'app-cliente-filtros',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cliente-filtros.component.html',
  styleUrls: ['./cliente-filtros.component.css']
})
export class ClienteFiltrosComponent implements OnInit {
  @Output() filtrosChange = new EventEmitter<FiltrosCliente>();

  mostrarFiltrosAvanzados = false;
  
  // Estados
  estadosDisponibles = [
    { id: 1, nombre: 'Activo', seleccionado: false },
    { id: 2, nombre: 'Inactivo', seleccionado: false },
    { id: 3, nombre: 'Suspendido', seleccionado: false },
    { id: 4, nombre: 'En Revisión', seleccionado: false }
  ];

  // Tipos de Cliente
  tiposClienteDisponibles = [
    { valor: 'Mayorista', seleccionado: false },
    { valor: 'Minorista', seleccionado: false },
    { valor: 'Otro', seleccionado: false }
  ];

  // Tipos de Documento
  tiposDocumento = ['DNI', 'CUIT/CUIL'];
  tipoDocumentoSeleccionado = '';

  // Ubicación
  provincias: Provincia[] = [];
  ciudades: Ciudad[] = [];
  provinciaSeleccionada?: number;
  ciudadSeleccionada?: number;

  // Fechas
  fechaDesde = '';
  fechaHasta = '';

  constructor(
   // private provinciaService: ProvinciaService,
   // private ciudadService: CiudadService,
    private clientesService: ClientesService
  ) {}

  ngOnInit(): void {
    this.cargarProvincias();
    
  }

  cargarProvincias(): void {
    this.clientesService.obtenerProvincias().subscribe({
      next: (data) => {
        this.provincias = data;
      },
      error: (err) => {
        console.error('Error al cargar provincias:', err);
      }
    });
  }

  onProvinciaChange(): void {
    this.ciudadSeleccionada = undefined;
    this.ciudades = [];
    
    if (this.provinciaSeleccionada) {
        this.clientesService.obtenerCiudadesPorProvincia(this.provinciaSeleccionada).subscribe({
            next: (data) => { 
            this.ciudades = data;
        },
        error: (err) => {
          console.error('Error al cargar ciudades:', err);
        }
      });
    }
  }

  toggleEstado(estado: any): void {
    estado.seleccionado = !estado.seleccionado;
    this.emitirFiltros();
  }

  toggleTipoCliente(tipo: any): void {
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
    // Resetear estados
    this.estadosDisponibles.forEach(e => e.seleccionado = false);
    
    // Resetear tipos de cliente
    this.tiposClienteDisponibles.forEach(t => t.seleccionado = false);
    
    // Resetear ubicación
    this.provinciaSeleccionada = undefined;
    this.ciudadSeleccionada = undefined;
    this.ciudades = [];
    
    // Resetear fechas
    this.fechaDesde = '';
    this.fechaHasta = '';
    
    // Resetear tipo documento
    this.tipoDocumentoSeleccionado = '';
    
    this.emitirFiltros();
  }

  private emitirFiltros(): void {
    const filtros: FiltrosCliente = {
      estados: this.estadosDisponibles
        .filter(e => e.seleccionado)
        .map(e => e.id),
      tiposCliente: this.tiposClienteDisponibles
        .filter(t => t.seleccionado)
        .map(t => t.valor),
      idProvincia: this.provinciaSeleccionada,
      idCiudad: this.ciudadSeleccionada,
      fechaDesde: this.fechaDesde || undefined,
      fechaHasta: this.fechaHasta || undefined,
      tipoDocumento: this.tipoDocumentoSeleccionado || undefined
    };

    this.filtrosChange.emit(filtros);
  }

  get contadorFiltrosActivos(): number {
    let count = 0;
    
    if (this.estadosDisponibles.some(e => e.seleccionado)) count++;
    if (this.tiposClienteDisponibles.some(t => t.seleccionado)) count++;
    if (this.provinciaSeleccionada) count++;
    if (this.ciudadSeleccionada) count++;
    if (this.fechaDesde || this.fechaHasta) count++;
    if (this.tipoDocumentoSeleccionado) count++;
    
    return count;
  }
}