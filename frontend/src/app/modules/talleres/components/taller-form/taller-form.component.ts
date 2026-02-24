import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Taller, Provincia, Ciudad } from '../../models/taller.model';
import { TalleresService } from '../../services/talleres.service';
import { AlertasService } from '../../../../core/services/alertas';

@Component({
  selector: 'app-taller-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './taller-form.component.html',
  styleUrls: ['./taller-form.component.css']
})
export class TallerFormComponent implements OnInit {
  @Input() taller: Taller | null = null;
  @Output() cerrar = new EventEmitter<void>();

  formulario: FormGroup;
  esEdicion = false;
  provincias: Provincia[] = [];
  ciudades: Ciudad[] = [];

  constructor(
    private fb: FormBuilder,
    private talleresService: TalleresService,
    private alertas: AlertasService
  ) {
    this.formulario = this.fb.group({
      nombreTaller: ['', [Validators.required, Validators.minLength(3)]],
      tipoTaller: [''],
      responsable: [''],
      telefono: [''],
      email: ['', [Validators.email]],
      direccion: [''],
      idProvincia: [null, Validators.required],
      idCiudad: [null, Validators.required]
    });
  }

  ngOnInit(): void {
    this.cargarProvincias();
    this.configurarCascadaProvinciaCiudad();

    if (this.taller) {
      this.esEdicion = true;
      this.formulario.patchValue({
        nombreTaller: this.taller.nombreTaller,
        tipoTaller: this.taller.tipoTaller || '',
        responsable: this.taller.responsable || '',
        telefono: this.taller.telefono || '',
        email: this.taller.email || '',
        direccion: this.taller.direccion || '',
        idProvincia: this.taller.idProvincia || null,
        idCiudad: this.taller.idCiudad || null
      });

      if (this.taller.idProvincia) {
        this.talleresService.obtenerCiudadesPorProvincia(this.taller.idProvincia).subscribe({
          next: (data) => this.ciudades = data,
          error: () => this.ciudades = []
        });
      }
    }
  }

  guardar(): void {
    if (this.formulario.invalid) {
      this.marcarCamposComoTocados();
      this.alertas.warning('Formulario incompleto', 'Completa los campos requeridos');
      return;
    }

    const formValue = this.formulario.value;
    const datos = {
      ...formValue,
      idProvincia: Number(formValue.idProvincia),
      idCiudad: Number(formValue.idCiudad)
    };

    if (this.esEdicion && this.taller?.idTaller) {
      this.talleresService.actualizarTaller({
        idTaller: this.taller.idTaller,
        ...datos
      }).subscribe({
        next: () => {
          this.alertas.success('Taller actualizado', 'Los cambios se guardaron correctamente');
          this.cerrar.emit();
        },
        error: () => this.alertas.error('Error', 'No se pudo actualizar el taller')
      });
      return;
    }

    this.talleresService.agregarTaller(datos).subscribe({
      next: () => {
        this.alertas.success('Taller creado', 'El taller se registro correctamente');
        this.cerrar.emit();
      },
      error: () => this.alertas.error('Error', 'No se pudo crear el taller')
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

    if (control.hasError('required')) return 'Este campo es requerido';
    if (control.hasError('email')) return 'Ingresa un email valido';
    if (control.hasError('minlength')) return `Minimo ${control.errors?.['minlength'].requiredLength} caracteres`;

    return '';
  }

  get titulo(): string {
    return this.esEdicion ? 'Modificar Taller Externo' : 'Nuevo Taller Externo';
  }

  private cargarProvincias(): void {
    this.talleresService.obtenerProvincias().subscribe({
      next: (data) => this.provincias = data,
      error: () => this.provincias = []
    });
  }

  private configurarCascadaProvinciaCiudad(): void {
    this.formulario.get('idProvincia')?.valueChanges.subscribe(idProvincia => {
      if (idProvincia) {
        this.talleresService.obtenerCiudadesPorProvincia(Number(idProvincia)).subscribe({
          next: (data) => this.ciudades = data,
          error: () => this.ciudades = []
        });
        return;
      }

      this.ciudades = [];
      this.formulario.patchValue({ idCiudad: null }, { emitEvent: false });
    });
  }

  private marcarCamposComoTocados(): void {
    Object.keys(this.formulario.controls).forEach(campo => {
      this.formulario.get(campo)?.markAsTouched();
    });
  }
}
