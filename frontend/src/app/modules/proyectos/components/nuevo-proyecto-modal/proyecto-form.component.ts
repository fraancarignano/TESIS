import { Component, Output, EventEmitter, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProyectosServiceNuevo } from '../../services/proyectos-nuevo.service';
import {
  ProyectoCrearNuevo,
  FormularioProyectoInicializacion,
  TipoPrenda,
  Talle,
  TipoInsumo,
  InsumoFormulario,
  ClienteSimple,
  UsuarioSimple,
  PrendaFormulario,
  TalleDistribuido,
  MaterialManualFormulario,
  generarIdTemporal,
  validarSumaTalles,
  obtenerSumaTalles,
  filtrarInsumosPorCategoria,
  filtrarTiposInsumoPorCategoria,
  calcularTotalPrendas,
  obtenerFechaHoy,
  CalculoMaterialesResponse
} from '../../models/nuevo-proyecto.model';
import { Cliente } from '../../../clientes/models/cliente.model';

@Component({
  selector: 'app-proyecto-form-nuevo',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './proyecto-form.component.html',
  styleUrls: ['./proyecto-form.component.css']
})
export class ProyectoFormNuevoComponent implements OnInit {
  @Input() esModal: boolean = false;
  @Output() cerrar = new EventEmitter<void>();

  // Formulario principal
  formulario!: FormGroup;
  cargando = false;
  errorMensaje = '';
  fechaMinima!: string;

  // Datos del formulario (catálogos)
  datosFormulario?: FormularioProyectoInicializacion;
  clientes: Cliente[] = [];
  tiposPrenda: TipoPrenda[] = [];
  talles: Talle[] = [];
  tiposInsumo: TipoInsumo[] = [];
  tiposInsumoTelas: TipoInsumo[] = [];
  tiposInsumoHilos: TipoInsumo[] = [];
  tiposInsumoAccesorios: TipoInsumo[] = [];
  insumos: InsumoFormulario[] = [];
  insumosTelas: InsumoFormulario[] = [];
  insumosHilos: InsumoFormulario[] = [];
  insumosAccesorios: InsumoFormulario[] = [];
  usuarios: UsuarioSimple[] = [];
  prioridades: string[] = ['baja', 'media', 'alta'];
  insumosTelasFiltrados: InsumoFormulario[] = [];

  // Prendas del proyecto
  prendasProyecto: PrendaFormulario[] = [];
  prendaEditando?: PrendaFormulario;
  indexPrendaEditando: number = -1;

  // Modal de talles
  mostrarModalTalles = false;
  tallesDistribuyendo: TalleDistribuido[] = [];
  cantidadTotalTalles = 0;

  // Materiales manuales (hilos, accesorios)
  materialesManuales: MaterialManualFormulario[] = [];

  // Preview de materiales calculados
  materialesCalculados?: CalculoMaterialesResponse;
  mostrarPreviewMateriales = false;

  constructor(
    private fb: FormBuilder,
    private proyectosService: ProyectosServiceNuevo,
    private router: Router
  ) {
    this.crearFormulario();
  }

  ngOnInit(): void {
    this.cargarDatosFormulario();
    this.setearFechaInicioPorDefecto();
    const mañana = new Date();
      mañana.setDate(mañana.getDate() + 1);

      this.fechaMinima = mañana.toISOString().split('T')[0];
  }

  // ========================================
  // INICIALIZACIÓN
  // ========================================

  private crearFormulario(): void {
    this.formulario = this.fb.group({
      idCliente: ['', Validators.required],
      nombreProyecto: ['', [Validators.required, Validators.minLength(3)]],
      descripcion: [''],
      prioridad: ['media', Validators.required],
      fechaInicio: ['', Validators.required],
      fechaFin: [''],
      idUsuarioEncargado: ['']
    });
  }

  private setearFechaInicioPorDefecto(): void {
    this.formulario.patchValue({ fechaInicio: obtenerFechaHoy() });
  }

  obtenerSumaTalles(talles: TalleDistribuido[]): number {
    return obtenerSumaTalles(talles);
  }

  private cargarDatosFormulario(): void {
    this.cargando = true;
    this.proyectosService.obtenerDatosFormulario().subscribe({
      next: (datos) => {
        this.datosFormulario = datos;
        this.clientes = datos.clientes;
        this.tiposPrenda = datos.tiposPrenda;
        this.talles = datos.talles;
        this.tiposInsumo = datos.tiposInsumo;
        this.insumos = datos.insumos;
        this.usuarios = datos.usuarios;
        this.prioridades = datos.prioridades;

        // Filtrar por categorías
        this.tiposInsumoTelas = filtrarTiposInsumoPorCategoria(datos.tiposInsumo, 'Tela');
        this.tiposInsumoHilos = filtrarTiposInsumoPorCategoria(datos.tiposInsumo, 'Hilo');
        this.tiposInsumoAccesorios = filtrarTiposInsumoPorCategoria(datos.tiposInsumo, 'Accesorio');

        this.insumosTelas = filtrarInsumosPorCategoria(datos.insumos, 'Tela');
        this.insumosHilos = filtrarInsumosPorCategoria(datos.insumos, 'Hilo');
        this.insumosAccesorios = filtrarInsumosPorCategoria(datos.insumos, 'Accesorio');

        this.cargando = false;
      },
      error: (err) => {
        console.error('Error cargando datos del formulario:', err);
        this.errorMensaje = 'Error al cargar los datos del formulario';
        this.cargando = false;
      }
    });
  }

  // ========================================
  // FILTRO DE MATERIALES
  // ========================================

  onTipoMaterialChange(): void {
    
    if (!this.prendaEditando?.idTipoInsumoMaterial) {
      this.insumosTelasFiltrados = [];
      this.prendaEditando!.idInsumo = undefined;
      this.prendaEditando!.colorTela = undefined;
      return;
    }

    this.insumosTelasFiltrados = this.insumosTelas.filter(
      insumo => insumo.idTipoInsumo === Number(this.prendaEditando!.idTipoInsumoMaterial)
    );


    this.prendaEditando!.idInsumo = undefined;
    this.prendaEditando!.colorTela = undefined;
  }

  // ========================================
  // GESTIÓN DE PRENDAS
  // ========================================

  agregarPrenda(): void {
    const nuevaPrenda: PrendaFormulario = {
      id: generarIdTemporal(),
      cantidadTotal: 0,
      tieneBordado: false,
      tieneEstampado: false,
      tallesDistribuidos: [],
      mostrarModalTalles: false
    };

    this.prendaEditando = nuevaPrenda;
    this.indexPrendaEditando = -1;
    this.insumosTelasFiltrados = [];
  }

  editarPrenda(prenda: PrendaFormulario, index: number): void {
    this.prendaEditando = { ...prenda };
    this.indexPrendaEditando = index;
    
    if (this.prendaEditando.idTipoInsumoMaterial) {
      this.insumosTelasFiltrados = this.insumosTelas.filter(
        insumo => insumo.idTipoInsumo === this.prendaEditando!.idTipoInsumoMaterial
      );
    }
  }

  guardarPrenda(prenda: PrendaFormulario): void {
    if (!prenda.idTipoPrenda || !prenda.idTipoInsumoMaterial || !prenda.idInsumo || prenda.cantidadTotal <= 0) {
      this.errorMensaje = 'Completa todos los campos de la prenda';
      return;
    }

    if (prenda.tallesDistribuidos.length === 0) {
      this.errorMensaje = 'Debes distribuir las cantidades por talle';
      return;
    }

    if (!validarSumaTalles(prenda.tallesDistribuidos, prenda.cantidadTotal)) {
      this.errorMensaje = `La suma de talles (${obtenerSumaTalles(prenda.tallesDistribuidos)}) no coincide con la cantidad total (${prenda.cantidadTotal})`;
      return;
    }

    const tipoPrenda = this.tiposPrenda.find(tp => tp.idTipoPrenda === prenda.idTipoPrenda);
    const tipoInsumo = this.tiposInsumo.find(ti => ti.idTipoInsumo === prenda.idTipoInsumoMaterial);
    const insumoTela = this.insumosTelas.find(ins => ins.idInsumo === prenda.idInsumo);

    prenda.nombrePrenda = tipoPrenda?.nombrePrenda;
    prenda.nombreMaterial = tipoInsumo?.nombreTipo;
    prenda.colorTela = insumoTela?.color;

    if (this.indexPrendaEditando === -1) {
      this.prendasProyecto.push(prenda);
    } else {
      this.prendasProyecto[this.indexPrendaEditando] = prenda;
    }

    this.prendaEditando = undefined;
    this.indexPrendaEditando = -1;
    this.insumosTelasFiltrados = [];
    this.errorMensaje = '';
  }

  cancelarEditarPrenda(): void {
    this.prendaEditando = undefined;
    this.indexPrendaEditando = -1;
  }

  eliminarPrenda(index: number): void {
    this.prendasProyecto.splice(index, 1);
  }

  // ========================================
  // DISTRIBUCIÓN DE TALLES
  // ========================================

  abrirModalTalles(): void {
    if (!this.prendaEditando || this.prendaEditando.cantidadTotal <= 0) {
      this.errorMensaje = 'Primero especifica la cantidad total';
      return;
    }

    this.cantidadTotalTalles = this.prendaEditando.cantidadTotal;

    if (this.prendaEditando.tallesDistribuidos.length > 0) {
      this.tallesDistribuyendo = [...this.prendaEditando.tallesDistribuidos];
    } else {
      this.tallesDistribuyendo = this.talles.map(t => ({
        idTalle: t.idTalle,
        nombreTalle: t.nombreTalle,
        cantidad: 0
      }));
    }

    this.mostrarModalTalles = true;
  }

  guardarDistribucionTalles(): void {
    const suma = obtenerSumaTalles(this.tallesDistribuyendo);

    if (suma !== this.cantidadTotalTalles) {
      this.errorMensaje = `La suma (${suma}) debe ser igual a ${this.cantidadTotalTalles}`;
      return;
    }

    const tallesConCantidad = this.tallesDistribuyendo.filter(t => t.cantidad > 0);

    if (tallesConCantidad.length === 0) {
      this.errorMensaje = 'Debes asignar cantidades a al menos un talle';
      return;
    }

    if (this.prendaEditando) {
      this.prendaEditando.tallesDistribuidos = tallesConCantidad;
    }

    this.cerrarModalTalles();
  }

  cerrarModalTalles(): void {
    this.mostrarModalTalles = false;
    this.tallesDistribuyendo = [];
    this.errorMensaje = '';
  }

  obtenerSumaTallesActual(): number {
    return obtenerSumaTalles(this.tallesDistribuyendo);
  }

  // ========================================
  // MATERIALES MANUALES
  // ========================================

  agregarMaterialManual(
    idInsumoStr: string,
    cantidadStr: string,
    categoria: 'Hilo' | 'Accesorio'
  ): void {
    const idInsumo = Number(idInsumoStr);
    const cantidad = Number(cantidadStr);

    if (!idInsumo || cantidad <= 0) {
      this.errorMensaje = 'Selecciona un insumo válido y cantidad > 0';
      setTimeout(() => (this.errorMensaje = ''), 3000);
      return;
    }

    const insumo = this.insumos.find(i => i.idInsumo === idInsumo);
    if (!insumo) return;

    const existe = this.materialesManuales.find(m => m.idInsumo === idInsumo);
    if (existe) {
      existe.cantidad += cantidad;
    } else {
      this.materialesManuales.push({
        id: generarIdTemporal(),
        idInsumo: insumo.idInsumo,
        nombreInsumo: insumo.nombreInsumo,
        categoria: insumo.categoria,
        cantidad: cantidad,
        unidadMedida: insumo.unidadMedida,
        stockActual: insumo.stockActual
      });
    }
  }

  eliminarMaterialManual(index: number): void {
    this.materialesManuales.splice(index, 1);
  }

  // ========================================
  // PREVIEW DE MATERIALES
  // ========================================

  calcularMateriales(): void {
    if (this.prendasProyecto.length === 0) {
      this.errorMensaje = 'Agrega al menos una prenda para calcular materiales';
      setTimeout(() => this.errorMensaje = '', 3000);
      return;
    }

    this.cargando = true;
    this.errorMensaje = '';

    const request = {
      prendas: this.prendasProyecto.map(p => ({
        idTipoPrenda: p.idTipoPrenda!,
        idTipoInsumoMaterial: p.idTipoInsumoMaterial!,
        cantidadTotal: p.cantidadTotal
      })),
      materialesManuales: this.materialesManuales.map(m => ({
        idInsumo: m.idInsumo!,
        cantidad: m.cantidad
      }))
    };

    this.proyectosService.calcularMateriales(request).subscribe({
      next: (response) => {
        this.materialesCalculados = response;
        this.cargando = false;
      },
      error: (err) => {
        this.errorMensaje = 'Error al calcular materiales: ' + err.message;
        this.cargando = false;
      }
    });
  }

  cerrarPreviewMateriales(): void {
    this.mostrarPreviewMateriales = false;
  }

  getMaterialesConStock(): number {
    if (!this.materialesCalculados) return 0;
    return this.materialesCalculados.materialesCalculados.filter(m => m.tieneStockSuficiente).length;
  }

  getMaterialesSinStock(): number {
    if (!this.materialesCalculados) return 0;
    return this.materialesCalculados.materialesCalculados.filter(m => !m.tieneStockSuficiente).length;
  }

  // ========================================
  // GUARDAR PROYECTO
  // ========================================

  guardar(): void {
    if (this.formulario.invalid) {
      this.marcarCamposComoTocados();
      this.errorMensaje = 'Completa los campos obligatorios (*)';
      return;
    }

    if (this.prendasProyecto.length === 0) {
      this.errorMensaje = 'Agrega al menos una prenda al proyecto';
      return;
    }

    for (let i = 0; i < this.prendasProyecto.length; i++) {
      const prenda = this.prendasProyecto[i];

      if (!validarSumaTalles(prenda.tallesDistribuidos, prenda.cantidadTotal)) {
        this.errorMensaje = `Prenda ${i + 1}: La distribución de talles no coincide con la cantidad total`;
        return;
      }
    }

    this.cargando = true;
    this.errorMensaje = '';

    const formValue = this.formulario.value;

    const dto: ProyectoCrearNuevo = {
      idCliente: Number(formValue.idCliente),
      nombreProyecto: formValue.nombreProyecto.trim(),
      descripcion: formValue.descripcion?.trim() || undefined,
      prioridad: formValue.prioridad,
      estado: 'Pendiente',
      fechaInicio: formValue.fechaInicio,
      fechaFin: formValue.fechaFin || undefined,
      idUsuarioEncargado: formValue.idUsuarioEncargado
        ? Number(formValue.idUsuarioEncargado)
        : undefined,
      prendas: this.prendasProyecto.map((p, index) => ({
        idTipoPrenda: p.idTipoPrenda!,
        idTipoInsumoMaterial: p.idTipoInsumoMaterial!,
        idInsumo: p.idInsumo!, // AGREGADO
        cantidadTotal: p.cantidadTotal,
        tieneBordado: p.tieneBordado,
        tieneEstampado: p.tieneEstampado,
        descripcionDiseño: p.descripcionDiseno?.trim() || undefined,
        orden: index,
        talles: p.tallesDistribuidos.map(t => ({
          idTalle: t.idTalle,
          cantidad: t.cantidad
        }))
      })),
      materialesManuales:
        this.materialesManuales.length > 0
          ? this.materialesManuales.map(m => ({
              idInsumo: m.idInsumo!,
              cantidad: m.cantidad,
              unidadMedida: m.unidadMedida!,
              observaciones: undefined
            }))
          : undefined
    };

    const validacion = this.proyectosService.validarFormularioLocal(dto);
    if (!validacion.esValido) {
      this.errorMensaje = validacion.errores.join('; ');
      this.cargando = false;
      return;
    }

    this.proyectosService.crearProyecto(dto).subscribe({
      next: () => {
        if (this.esModal) {
          this.cerrar.emit();
        } else {
          this.router.navigate(['/proyectos']);
        }
      },
      error: (err) => {
        this.errorMensaje = this.extraerMensajeError(err);
        this.cargando = false;
      }
    });
  }

  // ========================================
  // UTILIDADES
  // ========================================

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

  private marcarCamposComoTocados(): void {
    Object.values(this.formulario.controls).forEach(control => {
      control.markAsTouched();
    });
  }

  cancelar(): void {
    if (this.esModal) {
      this.cerrar.emit();
    } else {
      this.router.navigate(['/proyectos']);
    }
  }

  // ========================================
  // HELPERS PARA EL TEMPLATE
  // ========================================

    

    getColorInsumo(idInsumo: number): string {
    const insumo = this.insumos.find(i => i.idInsumo === idInsumo);
    return insumo?.color || '-';
    }

  get cantidadTotalProyecto(): number {
    return calcularTotalPrendas(this.prendasProyecto);
  }

  get nombreCliente(): string {
    const idCliente = this.formulario.get('idCliente')?.value;
    if (!idCliente) return '';
    const cliente = this.clientes.find(c => c.idCliente === Number(idCliente));
    return cliente?.nombreCompleto || '';
  }

  getNombreTipoPrenda(idTipoPrenda?: number): string {
    if (!idTipoPrenda) return '';
    const tipo = this.tiposPrenda.find(tp => tp.idTipoPrenda === idTipoPrenda);
    return tipo?.nombrePrenda || '';
  }

  getNombreTipoInsumo(idTipoInsumo?: number): string {
    if (!idTipoInsumo) return '';
    const tipo = this.tiposInsumo.find(ti => ti.idTipoInsumo === idTipoInsumo);
    return tipo?.nombreTipo || '';
  }

  getTallesSeparados(talles: TalleDistribuido[]): string {
    if (!talles || talles.length === 0) return 'Sin distribuir';
    return talles.map(t => `${t.nombreTalle}(${t.cantidad})`).join(', ');
  }

  getDisenoTexto(prenda: PrendaFormulario): string {
    const disenos = [];
    if (prenda.tieneBordado) disenos.push('Bordado');
    if (prenda.tieneEstampado) disenos.push('Estampado');
    return disenos.length > 0 ? disenos.join(' + ') : 'Sin diseño';
  }
}