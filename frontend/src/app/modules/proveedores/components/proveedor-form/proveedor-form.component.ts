import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Proveedor } from '../../models/proveedor.model';
import { ProveedoresService } from '../../services/proveedores.service';
import { AlertasService } from '../../../../core/services/alertas';

@Component({
  selector: 'app-proveedor-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './proveedor-form.component.html',
  styleUrls: ['./proveedor-form.component.css']
})
export class ProveedorFormComponent implements OnInit {
  @Input() proveedor: Proveedor | null = null;
  @Output() cerrar = new EventEmitter<void>();

  formulario: FormGroup;
  esEdicion = false;

  constructor(
    private fb: FormBuilder,
    private proveedoresService: ProveedoresService,
    private alertas: AlertasService
  ) {
    this.formulario = this.fb.group({
      nombreProveedor: ['', [Validators.required, Validators.minLength(3)]],
      cuit: ['', [Validators.required, Validators.pattern(/^\d{2}-\d{8}-\d$/)]],
      telefono: [''],
      email: ['', [Validators.email]],
      direccion: [''],
      observaciones: ['']
    });
  }

  ngOnInit(): void {
    if (this.proveedor) {
      this.esEdicion = true;
      this.formulario.patchValue({
        nombreProveedor: this.proveedor.nombreProveedor,
        cuit: this.proveedor.cuit,
        telefono: this.proveedor.telefono || '',
        email: this.proveedor.email || '',
        direccion: this.proveedor.direccion || '',
        observaciones: this.proveedor.observaciones || ''
      });
    }
  }

  guardar(): void {
    if (this.formulario.invalid) {
      this.marcarCamposComoTocados();
      this.alertas.warning('Formulario incompleto', 'Completa los campos requeridos');
      return;
    }

    const datos = this.formulario.value;

    if (this.esEdicion && this.proveedor?.idProveedor) {
      this.proveedoresService.actualizarProveedor({
        idProveedor: this.proveedor.idProveedor,
        ...datos
      }).subscribe({
        next: () => {
          this.alertas.success('Proveedor actualizado', 'Los cambios se guardaron correctamente');
          this.cerrar.emit();
        },
        error: (err) => {
          console.error('Error al actualizar proveedor:', err);
          this.alertas.error('Error', 'No se pudo actualizar el proveedor');
        }
      });
      return;
    }

    this.proveedoresService.agregarProveedor(datos).subscribe({
      next: () => {
        this.alertas.success('Proveedor creado', 'El proveedor se registro correctamente');
        this.cerrar.emit();
      },
      error: (err) => {
        console.error('Error al crear proveedor:', err);
        this.alertas.error('Error', 'No se pudo crear el proveedor');
      }
    });
  }

  async cancelar(): Promise<void> {
    if (this.formulario.dirty) {
      const confirmado = await this.alertas.confirmar(
        'Descartar cambios?',
        'Los datos ingresados se perderan',
        'Si, salir'
      );

      if (confirmado) {
        this.cerrar.emit();
      }
      return;
    }

    this.cerrar.emit();
  }

  tieneError(campo: string): boolean {
    const control = this.formulario.get(campo);
    return !!(control && control.invalid && control.touched);
  }

  obtenerMensajeError(campo: string): string {
    const control = this.formulario.get(campo);
    if (!control) return '';

    if (control.hasError('required')) {
      return 'Este campo es requerido';
    }

    if (control.hasError('email')) {
      return 'Ingresa un email valido';
    }

    if (control.hasError('minlength')) {
      return `Minimo ${control.errors?.['minlength'].requiredLength} caracteres`;
    }

    if (control.hasError('pattern')) {
      return 'Formato invalido (XX-XXXXXXXX-X)';
    }

    return '';
  }

  get titulo(): string {
    return this.esEdicion ? 'Modificar Proveedor' : 'Nuevo Proveedor';
  }

  /**
   * Formatea CUIT automaticamente con patron XX-XXXXXXXX-X
   */
  formatearCuit(): void {
    const control = this.formulario.get('cuit');
    if (!control) return;

    const soloDigitos = (control.value || '').replace(/\D/g, '').slice(0, 11);

    let formateado = soloDigitos;
    if (soloDigitos.length > 2) {
      formateado = `${soloDigitos.slice(0, 2)}-${soloDigitos.slice(2)}`;
    }
    if (soloDigitos.length > 10) {
      formateado = `${soloDigitos.slice(0, 2)}-${soloDigitos.slice(2, 10)}-${soloDigitos.slice(10, 11)}`;
    }

    if (control.value !== formateado) {
      control.setValue(formateado, { emitEvent: false });
    }
  }

  private marcarCamposComoTocados(): void {
    Object.keys(this.formulario.controls).forEach(campo => {
      this.formulario.get(campo)?.markAsTouched();
    });
  }
}
