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

  constructor(
    private alertas: AlertasService,
    private clientesService: ClientesService
  ) {}

  ngOnInit(): void {
    this.clientesService.getClientes().subscribe(
      clientes => this.clientes = clientes
    );
  }

  get clientesFiltrados(): Cliente[] {
    if (!this.terminoBusqueda) {
      return this.clientes;
    }
    const termino = this.terminoBusqueda.toLowerCase();
    return this.clientes.filter(c => 
      c.nombre.toLowerCase().includes(termino) ||
      c.apellido.toLowerCase().includes(termino) ||
      c.empresa.toLowerCase().includes(termino) ||
      c.email.toLowerCase().includes(termino)
    );
  }

  abrirFormularioNuevo(): void {
    this.clienteSeleccionado = null;
    this.mostrarFormulario = true;
  }

  abrirFormularioEditar(cliente: Cliente, event: Event): void {
    event.stopPropagation(); // Evita que se abra el detalle
    this.clienteSeleccionado = { ...cliente };
    this.mostrarFormulario = true;
  }

  cerrarFormulario(): void {
    this.mostrarFormulario = false;
    this.clienteSeleccionado = null;
  }

  abrirDetalle(cliente: Cliente): void {
    this.clienteDetalle = cliente;
    this.mostrarDetalle = true;
  }

  cerrarDetalle(): void {
    this.mostrarDetalle = false;
    this.clienteDetalle = null;
  }

  async eliminarCliente(id: number, event: Event): Promise<void> {
    event.stopPropagation(); // Evita que se abra el detalle
    
    const confirmado = await this.alertas.confirmar(
      '¿Eliminar cliente?',
      'Esta acción no se puede deshacer',
      'Sí, eliminar'
    );

    if (confirmado) {
      this.clientesService.eliminarCliente(id);
      this.alertas.success('Cliente eliminado', 'El cliente se eliminó correctamente');
    }
  }
}