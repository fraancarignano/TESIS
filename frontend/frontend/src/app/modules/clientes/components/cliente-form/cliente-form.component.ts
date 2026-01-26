import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ClientesService } from '../../services/clientes.service';
import { Cliente, Provincia, Ciudad, EstadoCliente } from '../../models/cliente.model';
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
  
  // Datos para los selects
  provincias: Provincia[] = [];
  ciudades: Ciudad[] = [];
  estadosCliente: EstadoCliente[] = [];
  
  // Para discriminar en el UI (NO se guarda en BD)
  tiposPersona = ['Física', 'Jurídica'];
  
  // Para guardar en la BD (regla de negocio)
  tiposCliente = ['Mayorista', 'Minorista', 'Otro'];
  
  tiposDocumento = ['DNI', 'CUIL',];


  constructor(
    private fb: FormBuilder,
    private clientesService: ClientesService,
    private alertas: AlertasService
  ) {
    this.formulario = this.fb.group({
  // Campo TEMPORAL (solo para el form, NO se envía a la BD)
  tiposPersona: ['Física', [Validators.required]], // ← Solo UI
  
  // Campo REAL que se guarda en la BD
  tipoCliente: ['', [Validators.required]], // ← Mayorista/Minorista/Otro
  
  // Campos para Persona Física
  nombre: [''],
  apellido: [''],
  tipoDocumento: ['DNI'],
  numeroDocumento: [''],
  
  // Campos para Persona Jurídica
  razonSocial: [''],
  cuitCuil: [''],
  
  // Campos comunes
  telefono: ['', [Validators.required]],
  email: ['', [Validators.required, Validators.email]],
  idEstadoCliente: [1, [Validators.required]],
  observaciones: [''],
  
  // Ubicación
  idProvincia: [null],
  idCiudad: [null],
  direccion: [''],
  codigoPostal: ['']
  });
  }

  ngOnInit(): void {
    this.cargarDatosIniciales();
    this.configurarValidacionesDinamicas();
    this.configurarCascadaProvinciaCiudad();
    
    if (this.cliente) {
      this.esEdicion = true;
      this.cargarDatosCliente();
    }
  }

  /**
   * Cargar datos iniciales (provincias y estados)
   */
  cargarDatosIniciales(): void {
    // Cargar provincias
    this.clientesService.obtenerProvincias().subscribe({
      next: (data) => {
        this.provincias = data;
      },
      error: (err) => {
        console.error('Error al cargar provincias:', err);
      }
    });

    // Cargar estados de cliente
    this.clientesService.obtenerEstadosCliente().subscribe({
      next: (data) => {
        this.estadosCliente = data;
      },
      error: (err) => {
        console.error('Error al cargar estados:', err);
      }
    });
  }

  /**
   * Configurar cascada Provincia -> Ciudad
   */
  configurarCascadaProvinciaCiudad(): void {
    this.formulario.get('idProvincia')?.valueChanges.subscribe(idProvincia => {
      if (idProvincia) {
        this.clientesService.obtenerCiudadesPorProvincia(idProvincia).subscribe({
          next: (data) => {
            this.ciudades = data;
          },
          error: (err) => {
            console.error('Error al cargar ciudades:', err);
            this.ciudades = [];
          }
        });
      } else {
        this.ciudades = [];
        this.formulario.patchValue({ idCiudad: null });
      }
    });
  }

  /**
   * Configurar validaciones dinámicas según tipo de cliente
   */
  configurarValidacionesDinamicas(): void {
  this.formulario.get('tiposPersona')?.valueChanges.subscribe(tipo => { // ← Cambiar aquí
    this.limpiarValidaciones();
    
    if (tipo === 'Física') { // ← No "Persona Física"
      // Validaciones para Persona Física
      this.formulario.get('nombre')?.setValidators([Validators.required, Validators.minLength(2)]);
      this.formulario.get('apellido')?.setValidators([Validators.required, Validators.minLength(2)]);
      this.formulario.get('tipoDocumento')?.setValidators([Validators.required]);
      this.formulario.get('numeroDocumento')?.setValidators([Validators.required]);
      
      // Limpiar campos de Persona Jurídica
      this.formulario.patchValue({ 
        razonSocial: '',
        cuitCuil: ''
      });
    } else if (tipo === 'Jurídica') { // ← No "Persona Jurídica"
      // Validaciones para Persona Jurídica
      this.formulario.get('razonSocial')?.setValidators([Validators.required, Validators.minLength(3)]);
      this.formulario.get('cuitCuil')?.setValidators([Validators.required, Validators.pattern(/^\d{2}-\d{8}-\d$/)]);
      
      // Limpiar campos de Persona Física
      this.formulario.patchValue({ 
        nombre: '',
        apellido: '',
        tipoDocumento: '',
        numeroDocumento: ''
      });
    }
    
    this.actualizarValidaciones();
  });
}
  /**
   * Limpiar todas las validaciones de campos opcionales
   */
  limpiarValidaciones(): void {
    this.formulario.get('nombre')?.clearValidators();
    this.formulario.get('apellido')?.clearValidators();
    this.formulario.get('tipoDocumento')?.clearValidators();
    this.formulario.get('numeroDocumento')?.clearValidators();
    this.formulario.get('razonSocial')?.clearValidators();
    this.formulario.get('cuitCuil')?.clearValidators();
  }

  /**
   * Actualizar validaciones de todos los campos
   */
  actualizarValidaciones(): void {
    this.formulario.get('nombre')?.updateValueAndValidity();
    this.formulario.get('apellido')?.updateValueAndValidity();
    this.formulario.get('tipoDocumento')?.updateValueAndValidity();
    this.formulario.get('numeroDocumento')?.updateValueAndValidity();
    this.formulario.get('razonSocial')?.updateValueAndValidity();
    this.formulario.get('cuitCuil')?.updateValueAndValidity();
  }

  /**
   * Cargar datos del cliente en edición
   */
  cargarDatosCliente(): void {
  if (!this.cliente) return;
  
  // Inferir tipo de persona desde los datos
  const tiposPersona = this.cliente.razonSocial ? 'Jurídica' : 'Física';
  
  this.formulario.patchValue({
    tiposPersona: tiposPersona, // ← Inferido
    tipoCliente: this.cliente.tipoCliente, // ← Mayorista/Minorista/Otro
    nombre: this.cliente.nombre || '',
    apellido: this.cliente.apellido || '',
    tipoDocumento: this.cliente.tipoDocumento || 'DNI',
    numeroDocumento: this.cliente.numeroDocumento || '',
    razonSocial: this.cliente.razonSocial || '',
    cuitCuil: this.cliente.cuitCuil || '',
    telefono: this.cliente.telefono || '',
    email: this.cliente.email || '',
    idEstadoCliente: this.cliente.idEstadoCliente,
    observaciones: this.cliente.observaciones || '',
    idProvincia: this.cliente.idProvincia || null,
    idCiudad: this.cliente.idCiudad || null,
    direccion: this.cliente.direccion || '',
    codigoPostal: this.cliente.codigoPostal || ''
  });

  // Si tiene provincia, cargar las ciudades
  if (this.cliente.nombreProvincia) {
    this.clientesService.obtenerCiudadesPorProvincia(this.cliente.idProvincia).subscribe({
      next: (data) => {
        this.ciudades = data;
      }
    });
  }
}
  /*
  /**
   * Verificar si es Persona Física
   */
  esPersonaFisica(): boolean {
  return this.formulario.get('tiposPersona')?.value === 'Física'; // ← Cambiar
}

esPersonaJuridica(): boolean {
  return this.formulario.get('tiposPersona')?.value === 'Jurídica'; // ← Cambiar
}

  /**
   * Guardar o actualizar cliente
   */
  guardar(): void {
    if (this.formulario.valid) {
      const clienteData = this.prepararDatosCliente();
      
      if (this.esEdicion && this.cliente?.idCliente) {
        // Actualizar cliente existente
        this.clientesService.actualizarCliente({ 
          idCliente: this.cliente.idCliente,
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
      this.marcarCamposComoTocados();
      this.alertas.warning('Formulario incompleto', 'Por favor completa todos los campos requeridos');
    }
  }

  /**
   * Preparar datos del cliente según el tipo
   */
  prepararDatosCliente(): any {
  const formValue = this.formulario.value;
  
  const cliente: any = {
    // tiposPersona NO se envía ← IMPORTANTE
    tipoCliente: formValue.tipoCliente, // ← Este SÍ (Mayorista/Minorista/Otro)
    telefono: formValue.telefono || null,
    email: formValue.email || null,
    idEstadoCliente: formValue.idEstadoCliente,
    observaciones: formValue.observaciones || null,
    idProvincia: formValue.idProvincia || null,
    idCiudad: formValue.idCiudad || null,
    direccion: formValue.direccion || null,
    codigoPostal: formValue.codigoPostal || null
  };

  if (this.esPersonaFisica()) {
    cliente.nombre = formValue.nombre;
    cliente.apellido = formValue.apellido;
    cliente.tipoDocumento = formValue.tipoDocumento;
    cliente.numeroDocumento = formValue.numeroDocumento;
    cliente.razonSocial = null;
    cliente.cuitCuil = null;
  } else {
    cliente.razonSocial = formValue.razonSocial;
    cliente.cuitCuil = formValue.cuitCuil;
    cliente.nombre = null;
    cliente.apellido = null;
    cliente.tipoDocumento = null;
    cliente.numeroDocumento = null;
  }

  return cliente;
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