import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ClientesService } from '../../services/clientes.service';
import { Cliente } from '../../models/cliente.model';

@Component({
  selector: 'app-cliente-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './cliente-form.component.html',
  styleUrls: ['./cliente-form.component.css']
})
export class ClienteFormComponent implements OnInit {
  @Input() cliente: Cliente | null = null;
  @Output() cerrar = new EventEmitter<void>();

  formulario: FormGroup;
  esEdicion = false;

  constructor(
    private fb: FormBuilder,
    private clientesService: ClientesService
  ) {
    this.formulario = this.fb.group({
      // Información Personal
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      apellido: ['', [Validators.required, Validators.minLength(2)]],
      telefono: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      
      // Información Corporativa
      empresa: ['', [Validators.required]],
      razon_social: [''], // Opcional
      cuit: ['', [Validators.required, Validators.pattern(/^\d{2}-\d{8}-\d$/)]],
      tipo_cliente: ['', [Validators.required]],
      
      // Información Adicional
      observaciones: [''] // Opcional
    });
  }

  ngOnInit(): void {
    if (this.cliente) {
      this.esEdicion = true;
      this.formulario.patchValue(this.cliente);
    }
  }

  guardar(): void {
    if (this.formulario.valid) {
      const clienteData = this.formulario.value;
      
      if (this.esEdicion && this.cliente?.id) {
        this.clientesService.actualizarCliente({ ...clienteData, id: this.cliente.id });
      } else {
        this.clientesService.agregarCliente(clienteData);
      }
      
      this.cerrar.emit();
    } else {
      this.marcarCamposComoTocados();
    }
  }

  cancelar(): void {
    this.cerrar.emit();
  }

  private marcarCamposComoTocados(): void {
    Object.keys(this.formulario.controls).forEach(key => {
      this.formulario.get(key)?.markAsTouched();
    });
  }

  get titulo(): string {
    return this.esEdicion ? 'Modificar Cliente' : 'Nuevo Cliente';
  }
}