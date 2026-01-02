import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ProyectosService } from '../../services/proyectos.service';
import { CrearProyectoDTO } from '../../models/proyecto.model';
import { ClientesService } from '../../../clientes/services/clientes.service';
import { Cliente } from '../../../clientes/models/cliente.model';
import { InsumosService } from '../../../inventario/services/insumos.service';
import { Insumo } from '../../../inventario/models/insumo.model';

@Component({
  selector: 'app-proyecto-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './proyecto-form.component.html',
  styleUrls: ['./proyecto-form.component.css']
})
export class ProyectoFormComponent implements OnInit {
  @Output() cerrar = new EventEmitter<void>();
  
  // Se agrega '!' para indicar que se inicializará en el constructor/ngOnInit
  formulario!: FormGroup; 
  cargando = false;
  errorMensaje = '';
  
  prioridades = ['baja', 'media', 'alta'];
  estados = ['Pendiente', 'En Proceso', 'Pausado'];
  insumosSeleccionados: { idInsumo: number, nombre: string, cantidad: number, unidad: string }[] = [];
  
  clientes: Cliente[] = [];
  listaInsumosDB: Insumo[] = [];
  
  constructor(
    private fb: FormBuilder,
    private proyectosService: ProyectosService,
    private clientesService: ClientesService,
    private insumosService: InsumosService
  ) {
    // La inicialización debe estar DENTRO de la clase
    this.crearFormulario();
  }
  
  ngOnInit(): void {
    this.cargarClientes();
    this.cargarInsumos();
  }

  private cargarInsumos(): void {
  // Usamos el mismo método getInsumos() que usas en el inventario
  this.insumosService.getInsumos().subscribe({
    next: (data: Insumo[]) => {
      this.listaInsumosDB = data;
    },
    error: (err) => console.error('Error cargando insumos:', err)
  });
  }

  agregarInsumoALista(idInsumoStr: string, cantidadStr: string): void {
  const idInsumo = Number(idInsumoStr);
  const cantidad = Number(cantidadStr);

  const insumo = this.listaInsumosDB.find(i => i.idInsumo === idInsumo);

  // Verificamos que el insumo exista Y que tenga un idInsumo definido
  if (insumo && insumo.idInsumo !== undefined && cantidad > 0) {
    const existe = this.insumosSeleccionados.find(item => item.idInsumo === insumo.idInsumo);
    
    if (existe) {
      existe.cantidad += cantidad;
    } else {
      this.insumosSeleccionados.push({
        idInsumo: insumo.idInsumo, // Ahora TS sabe que aquí no es undefined
        nombre: insumo.nombreInsumo,
        cantidad: cantidad,
        unidad: insumo.unidadMedida
      });
    }
      } else {
        alert("Selecciona un insumo válido y una cantidad mayor a cero");
      }
    }
    quitarInsumo(index: number): void {
        if (index > -1) {
          this.insumosSeleccionados.splice(index, 1);
        }
      }
  
  private cargarClientes(): void {
    this.clientesService.obtenerClientes().subscribe({
      next: (data) => {
        this.clientes = data;
        console.log('Clientes cargados en el formulario:', this.clientes);
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
      tipoPrenda: [''],
      descripcion: [''],
      prioridad: ['media'],
      estado: ['Pendiente'],
      fechaInicio: ['', Validators.required],
      fechaFin: [''],
      cantidadTotal: [null, [Validators.required, Validators.min(1)]],
      idUsuarioEncargado: [null],
      tipoEstacion: ['']
    });
  }

  guardar(): void {
    if (this.formulario.valid) {
      this.cargando = true;
      this.errorMensaje = '';

      const dto: CrearProyectoDTO = {
        ...this.formulario.value,
        estado: 'Pendiente'
      };

      this.proyectosService.crearProyecto(dto).subscribe({
        next: (proyecto) => {
          console.log('Proyecto creado:', proyecto);
          this.cerrar.emit();
        },
        error: (err) => {
          console.error('Error al crear proyecto:', err);
          this.errorMensaje = err.error?.message || 'Error al crear el proyecto';
          this.cargando = false;
        }
      });
    } else {
      this.marcarCamposComoTocados();
    }
  }

  private marcarCamposComoTocados(): void {
    Object.values(this.formulario.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        // Por si tienes grupos anidados en el futuro
        this.marcarCamposComoTocados();
      }
    });
  }

  cancelar(): void {
    this.cerrar.emit();
  }
} 