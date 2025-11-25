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
  @Input() cliente: Cliente | null = null;  // ← IMPORTANTE: Debe tener @Input()
  @Output() cerrar = new EventEmitter<void>();

  formulario: FormGroup;
  esEdicion = false;

  constructor(
    private fb: FormBuilder,
    private clientesService: ClientesService
  ) {
    this.formulario = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      apellido: ['', [Validators.required, Validators.minLength(2)]],
      empresa: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]]
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