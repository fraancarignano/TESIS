import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClientesService } from '../services/clientes.service';
import { Cliente } from '../models/cliente.model';
import { ClienteFormComponent } from './cliente-form/cliente-form.component';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [CommonModule, FormsModule, ClienteFormComponent], // ← ClienteFormComponent aquí
  templateUrl: './clientes.component.html',
  styleUrls: ['./clientes.component.css']
})
export class ClientesComponent implements OnInit {
  clientes: Cliente[] = [];
  mostrarFormulario = false;
  clienteSeleccionado: Cliente | null = null;
  terminoBusqueda = '';

  constructor(private clientesService: ClientesService) {}

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

  abrirFormularioEditar(cliente: Cliente): void {
    this.clienteSeleccionado = { ...cliente };
    this.mostrarFormulario = true;
  }

  cerrarFormulario(): void {
    this.mostrarFormulario = false;
    this.clienteSeleccionado = null;
  }

  eliminarCliente(id: number): void {
    if (confirm('¿Estás seguro de eliminar este cliente?')) {
      this.clientesService.eliminarCliente(id);
    }
  }
}