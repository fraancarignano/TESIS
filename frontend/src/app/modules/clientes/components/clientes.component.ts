import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClientesService } from '../services/clientes.service';
import { Cliente } from '../models/cliente.model';
import { ClienteFormComponent } from './cliente-form/cliente-form.component';
import { ClienteDetalleModalComponent } from '../cliente-detalle-modal/cliente-detalle-modal.component';
import { AlertasService } from '../../../core/services/alertas';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    ClienteFormComponent,
    ClienteDetalleModalComponent
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

  constructor(
    private alertas: AlertasService,
    private clientesService: ClientesService
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
   * Filtrar clientes por término de búsqueda
   */
  get clientesFiltrados(): Cliente[] {
    if (!this.terminoBusqueda) {
      return this.clientes;
    }
    const termino = this.terminoBusqueda.toLowerCase();
    return this.clientes.filter(c => 
      (c.nombre?.toLowerCase().includes(termino)) ||
      (c.apellido?.toLowerCase().includes(termino)) ||
      (c.razonSocial?.toLowerCase().includes(termino)) ||
      (c.email?.toLowerCase().includes(termino)) ||
      (c.cuitCuil?.toLowerCase().includes(termino)) ||
      (c.numeroDocumento?.toLowerCase().includes(termino))
    );
  }

  /**
   * Obtener nombre completo del cliente
   */
  obtenerNombreCompleto(cliente: Cliente): string {
    if (cliente.tipoCliente === 'Persona Física') {
      return `${cliente.nombre || ''} ${cliente.apellido || ''}`.trim();
    } else {
      return cliente.razonSocial || 'Sin nombre';
    }
  }

  /**
   * Obtener identificación del cliente (DNI/CUIT)
   */
  obtenerIdentificacion(cliente: Cliente): string {
    if (cliente.tipoCliente === 'Persona Física') {
      return cliente.numeroDocumento || '-';
    } else {
      return cliente.cuitCuil || '-';
    }
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
      return;
    }

    const nombreCliente = this.obtenerNombreCompleto(cliente);
    const confirmado = await this.alertas.confirmar(
      '¿Eliminar cliente?',
      `Se eliminará a ${nombreCliente}. Esta acción no se puede deshacer.`,
      'Sí, eliminar'
    );

    if (confirmado) {
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
      'Persona Jurídica': 'tipo-juridica'
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
      3: 'badge-suspendido'
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
      3: 'Suspendido'
    };
    return estados[estadoId || 1] || 'Desconocido';
  }

  /**
   * Obtener icono según tipo de cliente
   */
  getTipoIcon(tipo: string): string {
    return tipo === 'Persona Física' ? '' : '';
  }
}