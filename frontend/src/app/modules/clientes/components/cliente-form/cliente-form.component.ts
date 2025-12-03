import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ClientesService } from '../../services/clientes.service';
import { Cliente } from '../../models/cliente.model';
import { AlertasService } from '../../../../core/services/alertas';

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
    private clientesService: ClientesService,
    private alertas: AlertasService
  ) {
    // Formulario con los campos exactos del HTML
    this.formulario = this.fb.group({
      nombreApellido: ['', [Validators.required, Validators.minLength(2)]],
      telefono: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      razonSocial: [''],
      cuit: ['', [Validators.required, Validators.pattern(/^\d{2}-\d{8}-\d$/)]],
      tipoCliente: ['', [Validators.required]],
      idEstadoCliente: [1, [Validators.required]], // Estado del cliente
      observaciones: ['']
    });
  }

  ngOnInit(): void {
    if (this.cliente) {
      this.esEdicion = true;
      this.formulario.patchValue({
        nombreApellido: this.cliente.nombreApellido,
        telefono: this.cliente.telefono,
        email: this.cliente.email,
        razonSocial: this.cliente.razonSocial,
        cuit: this.cliente.cuit,
        tipoCliente: this.cliente.tipoCliente,
        idEstadoCliente: this.cliente.idEstadoCliente || 1,
        observaciones: this.cliente.observaciones
      });
    }
  }

  /**
   * Guardar o actualizar cliente
   */
  guardar(): void {
    if (this.formulario.valid) {
      const clienteData = this.formulario.value;
      
      if (this.esEdicion && this.cliente?.id) {
        // Actualizar cliente existente
        this.clientesService.actualizarCliente({ 
          id: this.cliente.id,
          ...clienteData
        }).subscribe({
          next: () => {
            this.alertas.success('¡Cliente actualizado!', 'Los cambios se guardaron correctamente');
            this.cerrar.emit();
          },
          error: (err) => {
            console.error('Error al actualizar:', err);
            this.alertas.error('Error', 'No se pudo actualizar el cliente');
          }
        });
      } else {
        // Crear nuevo cliente
        this.clientesService.agregarCliente(clienteData).subscribe({
          next: () => {
            this.alertas.success('¡Cliente registrado!', 'El cliente se guardó correctamente');
            this.cerrar.emit();
          },
          error: (err) => {
            console.error('Error al crear:', err);
            this.alertas.error('Error', 'No se pudo crear el cliente');
          }
        });
      }
    } else {
      // Formulario inválido
      this.marcarCamposComoTocados();
      this.alertas.warning('Formulario incompleto', 'Por favor completa todos los campos requeridos');
    }
  }

  /**
   * Cancelar con confirmación si hay cambios
   */
  async cancelar(): Promise<void> {
    if (this.formulario.dirty) {
      const confirmado = await this.alertas.confirmar(
        '¿Descartar cambios?',
        'Los datos ingresados se perderán',
        'Sí, salir'
      );
      
      if (confirmado) {
        this.cerrar.emit();
      }
    } else {
      this.cerrar.emit();
    }
  }

  /**
   * Marcar todos los campos como tocados para mostrar errores
   */
  private marcarCamposComoTocados(): void {
    Object.keys(this.formulario.controls).forEach(key => {
      this.formulario.get(key)?.markAsTouched();
    });
  }

  /**
   * Verificar si un campo tiene error
   */
  tieneError(campo: string): boolean {
    const control = this.formulario.get(campo);
    return !!(control && control.invalid && control.touched);
  }

  /**
   * Obtener mensaje de error para un campo
   */
  obtenerMensajeError(campo: string): string {
    const control = this.formulario.get(campo);
    if (!control) return '';

    if (control.hasError('required')) {
      return 'Este campo es requerido';
    }
    if (control.hasError('email')) {
      return 'Ingresa un email válido';
    }
    if (control.hasError('minlength')) {
      return `Mínimo ${control.errors?.['minlength'].requiredLength} caracteres`;
    }
    if (control.hasError('pattern')) {
      return 'Formato inválido (XX-XXXXXXXX-X)';
    }
    return '';
  }

  /**
   * Título dinámico del formulario
   */
  get titulo(): string {
    return this.esEdicion ? 'Modificar Cliente' : 'Nuevo Cliente';
  }
}