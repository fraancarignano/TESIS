import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ProyectosService } from '../../services/proyectos.service';
import { CrearProyectoDTO } from '../../models/proyecto.model';
import { ClientesService } from '../../../clientes/services/clientes.service';
import { Cliente } from '../../../clientes/models/cliente.model';
import { InsumosService } from '../../../inventario/services/insumos.service';
import { Insumo } from '../../../inventario/models/insumo.model';
import { AuthService } from '../../../login/services/auth.service';
import { Usuario } from '../../../login/models/auth.model';

@Component({
  selector: 'app-proyecto-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './proyecto-form.component.html',
  styleUrls: ['./proyecto-form.component.css']
})
export class ProyectoFormComponent implements OnInit {
  @Output() cerrar = new EventEmitter<void>();
  
  formulario!: FormGroup; 
  cargando = false;
  errorMensaje = '';
  
  prioridades = ['baja', 'media', 'alta'];
  tiposEstacion = ['Verano', 'Invierno', 'Otoño', 'Primavera', 'Todo el año'];
  tiposPrenda = ['Remera', 'Camisa', 'Pantalón', 'Vestido', 'Buzo', 'Campera', 'Short', 'Otro'];
  
  clientes: Cliente[] = [];
  listaInsumosDB: Insumo[] = [];
  usuarios: Usuario[] = [];
  
  insumosSeleccionados: { 
    idInsumo: number; 
    nombre: string; 
    cantidad: number; 
    unidad: string;
    desperdicioEstimado?: number;
  }[] = [];
  
  constructor(
    private fb: FormBuilder,
    private proyectosService: ProyectosService,
    private clientesService: ClientesService,
    private insumosService: InsumosService,
    private authService: AuthService
  ) {
    this.crearFormulario();
  }
  
  ngOnInit(): void {
    this.cargarClientes();
    this.cargarInsumos();
    this.cargarUsuarios();
    this.setearFechaInicioPorDefecto();
  }

  private setearFechaInicioPorDefecto(): void {
    const hoy = new Date().toISOString().split('T')[0];
    this.formulario.patchValue({ fechaInicio: hoy });
  }

  private cargarUsuarios(): void {
    this.authService.obtenerUsuarios().subscribe({
      next: (data) => {
        // Filtrar solo usuarios activos
        this.usuarios = data.filter(u => u.estado === 'Activo');
        console.log('Usuarios activos cargados:', this.usuarios);
      },
      error: (err) => console.error('Error cargando usuarios:', err)
    });
  }

  private cargarInsumos(): void {
    this.insumosService.getInsumos().subscribe({
      next: (data: Insumo[]) => {
        this.listaInsumosDB = data.filter(i => i.estado === 'Pulenta' || i.estado === 'En uso');
      },
      error: (err) => console.error('Error cargando insumos:', err)
    });
  }

  agregarInsumoALista(idInsumoStr: string, cantidadStr: string, desperdicioStr: string = '0'): void {
    const idInsumo = Number(idInsumoStr);
    const cantidad = Number(cantidadStr);
    const desperdicio = Number(desperdicioStr) || 0;

    if (!idInsumo || cantidad <= 0) {
      this.errorMensaje = 'Selecciona un insumo válido y cantidad > 0';
      setTimeout(() => this.errorMensaje = '', 3000);
      return;
    }

    const insumo = this.listaInsumosDB.find(i => i.idInsumo === idInsumo);
    if (!insumo) return;

    const existe = this.insumosSeleccionados.find(item => item.idInsumo === insumo.idInsumo);
    
    if (existe) {
      existe.cantidad += cantidad;
      existe.desperdicioEstimado = (existe.desperdicioEstimado || 0) + desperdicio;
    } else {
      this.insumosSeleccionados.push({
        idInsumo: insumo.idInsumo!,
        nombre: insumo.nombreInsumo,
        cantidad: cantidad,
        unidad: insumo.unidadMedida,
        desperdicioEstimado: desperdicio
      });
    }
  }

  quitarInsumo(index: number): void {
    this.insumosSeleccionados.splice(index, 1);
  }
  
  private cargarClientes(): void {
    this.clientesService.obtenerClientes().subscribe({
      next: (data) => {
        this.clientes = data.filter(c => c.idEstadoCliente === 1 || c.idEstadoCliente === 4);
      },
      error: (err) => {
        console.error('Error al cargar clientes:', err);
        this.errorMensaje = 'No se pudieron cargar los clientes.';
      }
    });
  }

  private crearFormulario(): void {
    this.formulario = this.fb.group({
      idCliente: ['', Validators.required],
      nombreProyecto: ['', [Validators.required, Validators.minLength(3)]],
      tipoPrenda: ['', Validators.required],
      descripcion: [''],
      prioridad: ['media', Validators.required],
      fechaInicio: ['', Validators.required],
      fechaFin: [''],
      cantidadTotal: [null, [Validators.required, Validators.min(1)]],
      idUsuarioEncargado: [''],
      tipoEstacion: ['']
    });
  }

  guardar(): void {
    if (this.formulario.invalid) {
      this.marcarCamposComoTocados();
      this.errorMensaje = 'Completa los campos obligatorios (*)';
      return;
    }

    if (this.insumosSeleccionados.length === 0) {
      this.errorMensaje = 'Agrega al menos un material';
      return;
    }

    this.cargando = true;
    this.errorMensaje = '';

    const formValue = this.formulario.value;
    
    const dto: CrearProyectoDTO = {
      idCliente: Number(formValue.idCliente),
      nombreProyecto: formValue.nombreProyecto.trim(),
      tipoPrenda: formValue.tipoPrenda || undefined,
      descripcion: formValue.descripcion?.trim() || undefined,
      prioridad: formValue.prioridad,
      estado: 'Pendiente',
      fechaInicio: this.formatearFecha(formValue.fechaInicio),
      fechaFin: formValue.fechaFin ? this.formatearFecha(formValue.fechaFin) : undefined,
      cantidadTotal: Number(formValue.cantidadTotal),
      idUsuarioEncargado: formValue.idUsuarioEncargado ? Number(formValue.idUsuarioEncargado) : undefined,
      tipoEstacion: formValue.tipoEstacion || undefined,
      materiales: this.insumosSeleccionados.map(i => ({
        idInsumo: i.idInsumo,
        idUnidad: 1,
        cantidadAsignada: i.cantidad,
        desperdicioEstimado: i.desperdicioEstimado || 0
      }))
    };

    this.proyectosService.crearProyecto(dto).subscribe({
      next: () => {
        this.cerrar.emit();
      },
      error: (err) => {
        this.errorMensaje = this.extraerMensajeError(err);
        this.cargando = false;
      }
    });
  }

  private extraerMensajeError(err: any): string {
    if (err.error) {
      if (typeof err.error === 'string') return err.error;
      if (err.error.message) return err.error.message;
      if (err.error.errors) {
        const errores = Object.values(err.error.errors).flat();
        return errores.join(', ');
      }
    }
    return err.message || 'Error al crear el proyecto';
  }

  private formatearFecha(fecha: string): string {
    if (!fecha) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return fecha;
    
    const date = new Date(fecha);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private marcarCamposComoTocados(): void {
    Object.values(this.formulario.controls).forEach(control => {
      control.markAsTouched();
    });
  }

  cancelar(): void {
    this.cerrar.emit();
  }
}