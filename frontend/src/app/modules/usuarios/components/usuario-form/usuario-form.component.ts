import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AreaSubrol, RolUsuario, UsuarioInterno } from '../../models/usuario.model';

export interface UsuarioFormSubmit {
  nombre: string;
  apellido: string;
  nombreUsuarioIngreso: string;
  contrasena?: string;
  idRol: number;
  estado: string;
  subRoles: number[];
}

@Component({
  selector: 'app-usuario-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './usuario-form.component.html',
  styleUrls: ['./usuario-form.component.css']
})
export class UsuarioFormComponent implements OnInit {
  @Input() usuario: UsuarioInterno | null = null;
  @Input() roles: RolUsuario[] = [];
  @Input() areasSubrol: AreaSubrol[] = [];
  @Input() subRolesSeleccionados: number[] = [];

  @Output() cerrar = new EventEmitter<void>();
  @Output() guardar = new EventEmitter<UsuarioFormSubmit>();

  formulario!: FormGroup;
  esEdicion = false;
  mostrarContrasena = false;
  intentoGuardar = false;

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.esEdicion = !!this.usuario;

    this.formulario = this.fb.group({
      nombre: [this.usuario?.nombre ?? '', [Validators.required, Validators.minLength(2)]],
      apellido: [this.usuario?.apellido ?? '', [Validators.required, Validators.minLength(2)]],
      nombreUsuarioIngreso: [this.usuario?.nombreUsuarioIngreso ?? '', [Validators.required, Validators.minLength(3)]],
      contrasena: ['', this.esEdicion ? [] : [Validators.required, Validators.minLength(4)]],
      idRol: [this.usuario?.idRol ?? null, [Validators.required]],
      estado: [this.usuario?.estado ?? 'Activo', [Validators.required]]
    });
  }

  get titulo(): string {
    return this.esEdicion ? 'Modificar Usuario Interno' : 'Nuevo Usuario Interno';
  }

  get esOperario(): boolean {
    const idRol = Number(this.formulario.get('idRol')?.value);
    const rol = this.roles.find(r => r.idRol === idRol);
    if (!rol) {
      // Fallback por ID historico de Operario cuando el nombre no viene cargado.
      return idRol === 3;
    }

    const nombreRol = rol.nombreRol.toLowerCase();
    return nombreRol.includes('operario') || nombreRol.includes('operador');
  }

  onRolChange(): void {
    if (!this.esOperario) {
      this.subRolesSeleccionados = [];
    }
  }

  onToggleSubrol(idArea: number): void {
    const existe = this.subRolesSeleccionados.includes(idArea);
    if (existe) {
      this.subRolesSeleccionados = this.subRolesSeleccionados.filter(id => id !== idArea);
      return;
    }

    this.subRolesSeleccionados = [...this.subRolesSeleccionados, idArea];
  }

  guardarFormulario(): void {
    this.intentoGuardar = true;

    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    const value = this.formulario.value;

    this.guardar.emit({
      nombre: value.nombre.trim(),
      apellido: value.apellido.trim(),
      nombreUsuarioIngreso: value.nombreUsuarioIngreso.trim(),
      contrasena: value.contrasena?.trim() || undefined,
      idRol: Number(value.idRol),
      estado: value.estado,
      subRoles: this.esOperario ? this.subRolesSeleccionados : []
    });
  }

  cancelar(): void {
    this.intentoGuardar = false;
    this.cerrar.emit();
  }

  toggleMostrarContrasena(): void {
    this.mostrarContrasena = !this.mostrarContrasena;
  }

  tieneError(campo: string): boolean {
    const control = this.formulario.get(campo);
    return !!control && control.invalid && (control.touched || this.intentoGuardar);
  }
}
