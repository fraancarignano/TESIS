import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClientesService } from '../services/clientes.service';
import { Cliente } from '../models/cliente.model';
import { ClienteFormComponent } from './cliente-form/cliente-form.component';
import { ClienteDetalleModalComponent } from '../cliente-detalle-modal/cliente-detalle-modal.component';
import { ClienteFiltrosComponent, FiltrosCliente } from './cliente-filtros/cliente-filtros.component';
import { AlertasService } from '../../../core/services/alertas';
import { ExportService } from '../../../core/services/export.service';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    ClienteFormComponent,
    ClienteDetalleModalComponent,
    ClienteFiltrosComponent
  ],
  templateUrl: './clientes.component.html',
  styleUrls: ['./clientes.component.css']
})
export class ClientesComponent implements OnInit {
  clientes: Cliente[] = [];
  mostrarFormulario = false;
  mostrarDetalle = false;
  clienteSeleccionado: Cliente | null = null;
  clienteDetalle: Cliente | null = null;
  terminoBusqueda = '';
  loading = false;
  error = false;

  // Filtros aplicados
  filtrosActuales: FiltrosCliente | null = null;

   mostrarMenuExportar = false;

  constructor(
    private alertas: AlertasService,
    private clientesService: ClientesService,
    private exportService: ExportService
  ) {}

  ngOnInit(): void {
    this.cargarClientes();
  }

  /**
   * Cargar clientes desde el backend
   */
  cargarClientes(): void {
    this.loading = true;
    this.error = false;
    
    this.clientesService.obtenerClientes().subscribe({
      next: (data) => {
        this.clientes = data;
        this.loading = false;
        console.log('Clientes cargados:', this.clientes);
        
        // 🔍 DEBUG: Ver estructura de ubicación
        if (this.clientes.length > 0) {
          console.log('Primer cliente (ubicación):', {
            idCiudad: this.clientes[0].nombreCiudad,
            idProvincia: this.clientes[0].nombreProvincia,
            tipoIdCiudad: typeof this.clientes[0].nombreCiudad,
            tipoIdProvincia: typeof this.clientes[0].nombreProvincia
          });
        }
      },
      error: (err) => {
        console.error('Error al cargar clientes:', err);
        this.error = true;
        this.loading = false;
        this.alertas.error('Error', 'No se pudieron cargar los clientes');
      }
    });
  }

  /**
   * Filtrar clientes por término de búsqueda y filtros avanzados
   */
  get clientesFiltrados(): Cliente[] {
    let resultado = [...this.clientes];

    // 1. Aplicar búsqueda por texto
    if (this.terminoBusqueda) {
      const termino = this.terminoBusqueda.toLowerCase();
      resultado = resultado.filter(c => 
        (c.nombre?.toLowerCase().includes(termino)) ||
        (c.apellido?.toLowerCase().includes(termino)) ||
        (c.razonSocial?.toLowerCase().includes(termino)) ||
        (c.email?.toLowerCase().includes(termino)) ||
        (c.numeroDocumento?.toLowerCase().includes(termino)) ||
        (c.cuitCuil?.toLowerCase().includes(termino)) ||
        (c.telefono?.toLowerCase().includes(termino))
      );
    }

    // 2. Aplicar filtros avanzados
    if (this.filtrosActuales) {
      // Filtrar por estados
      if (this.filtrosActuales.estados && this.filtrosActuales.estados.length > 0) {
        resultado = resultado.filter(c => 
          this.filtrosActuales!.estados.includes(c.idEstadoCliente)
        );
      }

      // Filtrar por tipos de cliente
      if (this.filtrosActuales.tiposCliente && this.filtrosActuales.tiposCliente.length > 0) {
        resultado = resultado.filter(c => 
          this.filtrosActuales!.tiposCliente.includes(c.tipoCliente)
        );
      }

      // Filtrar por provincia
if (this.filtrosActuales.idProvincia) {
  console.log('🌍 Filtrando por provincia:', this.filtrosActuales.idProvincia);
  console.log('🌍 Clientes antes de filtrar:', resultado.length);
  resultado = resultado.filter(c => {
    const coincide = c.idProvincia === this.filtrosActuales!.idProvincia;
    if (!coincide) {
      console.log(`❌ Cliente ${c.idCliente} no coincide: tiene provincia ${c.idProvincia}`);
    }
    return coincide;
  });
  console.log('🌍 Clientes después de filtrar:', resultado.length);
}

// Filtrar por ciudad
if (this.filtrosActuales.idCiudad) {
  console.log('🏙️ Filtrando por ciudad:', this.filtrosActuales.idCiudad);
  console.log('🏙️ Clientes antes de filtrar:', resultado.length);
  resultado = resultado.filter(c => {
    const coincide = c.idCiudad === this.filtrosActuales!.idCiudad;
    if (!coincide) {
      console.log(`❌ Cliente ${c.idCliente} no coincide: tiene ciudad ${c.idCiudad}`);
    }
    return coincide;
  });
  console.log('🏙️ Clientes después de filtrar:', resultado.length);
}

      // Filtrar por rango de fechas
      if (this.filtrosActuales.fechaDesde) {
        const fechaDesde = new Date(this.filtrosActuales.fechaDesde);
        fechaDesde.setHours(0, 0, 0, 0); // Inicio del día
        resultado = resultado.filter(c => {
          const fechaAlta = new Date(c.fechaAlta);
          return fechaAlta >= fechaDesde;
        });
      }

      if (this.filtrosActuales.fechaHasta) {
        const fechaHasta = new Date(this.filtrosActuales.fechaHasta);
        fechaHasta.setHours(23, 59, 59, 999); // Fin del día
        resultado = resultado.filter(c => {
          const fechaAlta = new Date(c.fechaAlta);
          return fechaAlta <= fechaHasta;
        });
      }

      // Filtrar por tipo de documento
      if (this.filtrosActuales.tipoDocumento) {
        resultado = resultado.filter(c => c.tipoDocumento === this.filtrosActuales!.tipoDocumento);
      }
    }

    return resultado;
  }

  /**
   * Manejar cambios en los filtros
   */
 onFiltrosChange(filtros: FiltrosCliente | null): void {
  console.log('🔍 Filtros recibidos:', filtros); // DEBUG
  
  // Simplemente asignar los filtros tal cual vienen
  this.filtrosActuales = filtros;
  
  // DEBUG: Ver qué clientes coinciden
  console.log('📊 Clientes totales:', this.clientes.length);
  console.log('📊 Clientes filtrados:', this.clientesFiltrados.length);
}

/**
   * Toggle del menú de exportación
   */
  toggleMenuExportar(): void {
    this.mostrarMenuExportar = !this.mostrarMenuExportar;
    console.log('Menu exportar:', this.mostrarMenuExportar);
  }

  /**
   * Exportar a PDF
   */
  exportarPDF(): void {
    const clientesParaExportar = this.clientesFiltrados;
    
    if (clientesParaExportar.length === 0) {
      this.alertas.warning('Sin datos', 'No hay clientes para exportar');
      return;
    }

    try {
      this.exportService.exportarPDF(clientesParaExportar);
      this.alertas.success(
        'Exportación exitosa', 
        `Se exportaron ${clientesParaExportar.length} clientes a PDF`
      );
      this.mostrarMenuExportar = false;
    } catch (error) {
      console.error('Error al exportar PDF:', error);
      this.alertas.error('Error', 'No se pudo generar el PDF');
    }
  }

  /**
   * Exportar a Excel
   */
  exportarExcel(): void {
    const clientesParaExportar = this.clientesFiltrados;
    
    if (clientesParaExportar.length === 0) {
      this.alertas.warning('Sin datos', 'No hay clientes para exportar');
      return;
    }

    try {
      this.exportService.exportarExcel(clientesParaExportar);
      this.alertas.success(
        'Exportación exitosa', 
        `Se exportaron ${clientesParaExportar.length} clientes a Excel`
      );
      this.mostrarMenuExportar = false;
    } catch (error) {
      console.error('Error al exportar Excel:', error);
      this.alertas.error('Error', 'No se pudo generar el archivo Excel');
    }
  }

  /**
   * Exportar a CSV
   */
  exportarCSV(): void {
    const clientesParaExportar = this.clientesFiltrados;
    
    if (clientesParaExportar.length === 0) {
      this.alertas.warning('Sin datos', 'No hay clientes para exportar');
      return;
    }

    try {
      this.exportService.exportarCSV(clientesParaExportar);
      this.alertas.success(
        'Exportación exitosa', 
        `Se exportaron ${clientesParaExportar.length} clientes a CSV`
      );
      this.mostrarMenuExportar = false;
    } catch (error) {
      console.error('Error al exportar CSV:', error);
      this.alertas.error('Error', 'No se pudo generar el archivo CSV');
    }
  }

  /**
   * Limpiar todos los filtros
   */
  limpiarFiltros(): void {
    this.filtrosActuales = null;
    this.terminoBusqueda = '';
  }

  

  // /**
  //  * Obtener nombre completo del cliente
  //  */
  
  obtenerNombreCompleto(cliente: Cliente): string {
    return cliente.nombreCompleto || 'Sin nombre';
  }
  
  

  /**
   * Obtener identificación del cliente (DNI/CUIT)
   */
  obtenerIdentificacion(cliente: Cliente): string {
    if (cliente.numeroDocumento) {
      return cliente.numeroDocumento;
    }

    // Fallback a cuitCuil si existe (campo deprecated)
    return cliente.cuitCuil || '-';
  }

  abrirFormularioNuevo(): void {
    this.clienteSeleccionado = null;
    this.mostrarFormulario = true;
  }

  abrirFormularioEditar(cliente: Cliente, event: Event): void {
    event.stopPropagation();
    // Crear una copia del cliente para editar
    this.clienteSeleccionado = { ...cliente };
    this.mostrarFormulario = true;
  }

  cerrarFormulario(): void {
    this.mostrarFormulario = false;
    this.clienteSeleccionado = null;
    this.cargarClientes();
  }

  abrirDetalle(cliente: Cliente): void {
    this.clienteDetalle = cliente;
    this.mostrarDetalle = true;
  }

  cerrarDetalle(): void {
    this.mostrarDetalle = false;
    this.clienteDetalle = null;
  }

  /**
   * Eliminar cliente con confirmación
   */
  async eliminarCliente(cliente: Cliente, event: Event): Promise<void> {
    event.stopPropagation();
    
    if (!cliente.idCliente) {
      this.alertas.error('Error', 'Cliente sin ID válido');
      console.error('Cliente sin ID:', cliente);
      return;
    }

    const nombreCliente = this.obtenerNombreCompleto(cliente);
    const confirmado = await this.alertas.confirmar(
      '¿Eliminar cliente?',
      `Se eliminará a ${nombreCliente}. Esta acción no se puede deshacer.`,
      'Sí, eliminar'
    );

    if (confirmado) {
      console.log('Eliminando cliente con ID:', cliente.idCliente);
      
      this.clientesService.eliminarCliente(cliente.idCliente).subscribe({
        next: () => {
          this.alertas.success('Cliente eliminado', 'El cliente se eliminó correctamente');
          this.cargarClientes();
        },
        error: (err) => {
          console.error('Error al eliminar:', err);
          this.alertas.error('Error', 'No se pudo eliminar el cliente');
        }
      });
    }
  }

  /**
   * Función helper para formatear fecha
   */
  formatearFecha(fecha: Date | string | undefined): string {
    if (!fecha) return '-';
    const date = new Date(fecha);
    return date.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  /**
   * Obtener clase CSS según el tipo de cliente
   */
  getTipoClass(tipo: string): string {
    const tipos: { [key: string]: string } = {
      'Persona Física': 'tipo-fisica',
      'Persona Jurídica': 'tipo-juridica',
      'Mayorista': 'tipo-mayorista',
      'Minorista': 'tipo-minorista',
      'Otro': 'tipo-otro'
    };
    return tipos[tipo] || 'tipo-default';
  }

  /**
   * Obtener clase CSS según el estado
   */
  getEstadoClass(estadoId?: number): string {
    const estados: { [key: number]: string } = {
      1: 'badge-activo',
      2: 'badge-inactivo',
      3: 'badge-suspendido',
      4: 'badge-revision'
    };
    return estados[estadoId || 1] || 'badge-default';
  }

  /**
   * Obtener texto del estado
   */
  getEstadoTexto(estadoId?: number): string {
    const estados: { [key: number]: string } = {
      1: 'Activo',
      2: 'Inactivo',
      3: 'Suspendido',
      4: 'En revisión'
    };
    return estados[estadoId || 1] || 'Desconocido';
  }

  /**
   * Obtener texto de ubicación del cliente
   */
  obtenerUbicacion(cliente: any): string {
    const ciudad = cliente.nombreCiudad;
    const provincia = cliente.nombreProvincia;
    
    if (!ciudad && !provincia) {
      return '-';
    }
    
    const partes: string[] = [];
    if (ciudad) partes.push(ciudad);
    if (provincia) partes.push(provincia);
    
    return partes.join(', ');
  }

  /**
   * Obtener icono según tipo de cliente
   */
  getTipoIcon(tipo: string): string {
    return tipo === 'Persona Física' ? '' : '';
  }
}