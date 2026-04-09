import { Component, Output, EventEmitter, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProyectosServiceNuevo } from '../../services/proyectos-nuevo.service';
import { MuestrasService } from '../../services/muestra.service';
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
  selector: 'app-muestra-form-nuevo',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './muestra-form.component.html',
  styleUrls: ['./muestra-form.component.css']
})
export class MuestraFormNuevoComponent implements OnInit {
  @Input() esModal: boolean = false;
  @Input() modoEdicion: boolean = false;
  @Input() proyectoAEditar?: any;
  @Output() cerrar = new EventEmitter<void>();

  // Formulario principal
  formulario!: FormGroup;
  cargando = false;
  errorMensaje = '';
  fechaMinima!: string;

  // Estado y validación para edición
  estadoProyecto: string = 'Pendiente';
  permitirEdicionCompleta: boolean = true;
  permitirEdicionPrendas: boolean = true;
  mensajeRestriccion: string = '';

  // Datos del formulario (catÃ¡logos)
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
  private prendaEditandoSnapshot?: PrendaFormulario;

  // Modal de talles
  mostrarModalTalles = false;
  tallesDistribuyendo: TalleDistribuido[] = [];
  cantidadTotalTalles = 0;

  // Modal nuevo tipo de prenda
  mostrarModalTipoPrenda = false;
  nuevoTipoPrenda = {
    nombrePrenda: '',
    descripcion: '',
    longitudCosturaMetros: null as number | null
  };
  private idTipoPrendaTemporal = -1;

  // Materiales manuales (hilos, accesorios)
  materialesManuales: MaterialManualFormulario[] = [];

  // Preview de materiales calculados
  materialesCalculados?: CalculoMaterialesResponse;
  mostrarPreviewMateriales = false;

  // Referencia visual de la muestra
  referenciaVisual = {
    bordado: { requerido: false, descripcion: '', imagen: '' as string | null },
    estampado: { requerido: false, descripcion: '', imagen: '' as string | null },
    otrosDetalle: '',
    mockup: '' as string | null
  };
  paletaRgb = { r: 0, g: 0, b: 0 };

  constructor(
    private fb: FormBuilder,
    private proyectosService: ProyectosServiceNuevo,
    private muestrasService: MuestrasService,
    private router: Router
  ) {
    this.crearFormulario();
  }

  ngOnInit(): void {
  this.cargarDatosFormulario();
  
  // ========== NUEVO: Detectar modo edición ==========
  if (this.modoEdicion && this.proyectoAEditar) {
    this.estadoProyecto = this.proyectoAEditar.estado;
    // Esperamos a que se carguen los datos del formulario para precargar
  } else {
    this.setearFechaInicioPorDefecto();
  }
  
  const manana = new Date();
  manana.setDate(manana.getDate() + 1);
  this.fechaMinima = manana.toISOString().split('T')[0];
}

  // ========================================
  // INICIALIZACIÃ“N
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

        // Filtrar por categorÃ­as
        this.tiposInsumoTelas = filtrarTiposInsumoPorCategoria(datos.tiposInsumo, 'Tela');
        this.tiposInsumoHilos = filtrarTiposInsumoPorCategoria(datos.tiposInsumo, 'Hilo');
        this.tiposInsumoAccesorios = filtrarTiposInsumoPorCategoria(datos.tiposInsumo, 'Accesorio');

        this.insumosTelas = filtrarInsumosPorCategoria(datos.insumos, 'Tela');
        this.insumosHilos = filtrarInsumosPorCategoria(datos.insumos, 'Hilo');
        this.insumosAccesorios = filtrarInsumosPorCategoria(datos.insumos, 'Accesorio');

        this.cargando = false;

        // ========== NUEVO: Si es modo edición, precargar datos ==========
          if (this.modoEdicion && this.proyectoAEditar) {
          this.precargarDatos();
          this.configurarEdicionSegunEstado();
        }
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

    // Solo informativo, no usamos stock. Asignamos un id ficticio basado en el tipo.
    this.insumosTelasFiltrados = [];
    this.prendaEditando!.idInsumo = Number(this.prendaEditando!.idTipoInsumoMaterial);
  }

  // ========================================
  // GESTIÃ“N DE PRENDAS
  // ========================================

  agregarPrenda(): void {
    const nuevaPrenda: PrendaFormulario = {
      id: generarIdTemporal(),
      cantidadTotal: 1,
      tieneBordado: false,
      tieneEstampado: false,
      tallesDistribuidos: [],
      mostrarModalTalles: false
    };

    this.aplicarTalleDefecto(nuevaPrenda);

    this.prendaEditando = nuevaPrenda;
    this.indexPrendaEditando = -1;
    this.insumosTelasFiltrados = [];
    this.prendaEditandoSnapshot = this.clonarPrenda(this.prendaEditando);
  }

  editarPrenda(prenda: PrendaFormulario, index: number): void {
    this.prendaEditando = { ...prenda };
    this.indexPrendaEditando = index;
    this.prendaEditandoSnapshot = this.clonarPrenda(this.prendaEditando);
    
    if (this.prendaEditando.idTipoInsumoMaterial) {
      this.insumosTelasFiltrados = this.insumosTelas.filter(
        insumo => insumo.idTipoInsumo === this.prendaEditando!.idTipoInsumoMaterial
      );
    }
  }

  guardarPrenda(prenda: PrendaFormulario): void {
    this.aplicarTalleDefecto(prenda);

    if (!prenda.idTipoPrenda || !prenda.idTipoInsumoMaterial || prenda.cantidadTotal <= 0) {
      this.errorMensaje = 'Completa todos los campos obligatorios de la prenda';
      return;
    }

    if (!prenda.idInsumo) {
      prenda.idInsumo = Number(prenda.idTipoInsumoMaterial);
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

    this.recalcularMaterialesSiCorresponde();
  }

  cancelarEditarPrenda(): void {
    this.prendaEditando = undefined;
    this.indexPrendaEditando = -1;
    this.prendaEditandoSnapshot = undefined;
  }

  confirmarCerrarModalPrenda(): void {
    if (this.prendaEditando && this.tieneCambiosEnPrenda()) {
      const confirmar = window.confirm('Tienes cambios sin guardar. Â¿Deseas cerrar la prenda sin guardar?');
      if (!confirmar) return;
    }

    this.cancelarEditarPrenda();
  }

  private tieneCambiosEnPrenda(): boolean {
    if (!this.prendaEditando || !this.prendaEditandoSnapshot) return false;
    return !this.compararPrendas(this.prendaEditando, this.prendaEditandoSnapshot);
  }

  private compararPrendas(a: PrendaFormulario, b: PrendaFormulario): boolean {
    if (
      a.idTipoPrenda !== b.idTipoPrenda ||
      a.idTipoInsumoMaterial !== b.idTipoInsumoMaterial ||
      a.idInsumo !== b.idInsumo ||
      a.cantidadTotal !== b.cantidadTotal ||
      a.tieneBordado !== b.tieneBordado ||
      a.tieneEstampado !== b.tieneEstampado ||
      (a.descripcionDiseno || '').trim() !== (b.descripcionDiseno || '').trim()
    ) {
      return false;
    }

    const ta = (a.tallesDistribuidos || []).map(t => ({ idTalle: t.idTalle, cantidad: t.cantidad })).sort((x, y) => x.idTalle - y.idTalle);
    const tb = (b.tallesDistribuidos || []).map(t => ({ idTalle: t.idTalle, cantidad: t.cantidad })).sort((x, y) => x.idTalle - y.idTalle);
    if (ta.length !== tb.length) return false;
    for (let i = 0; i < ta.length; i++) {
      if (ta[i].idTalle !== tb[i].idTalle || ta[i].cantidad !== tb[i].cantidad) {
        return false;
      }
    }

    return true;
  }

  private clonarPrenda(prenda?: PrendaFormulario): PrendaFormulario | undefined {
    if (!prenda) return undefined;
    return {
      ...prenda,
      tallesDistribuidos: (prenda.tallesDistribuidos || []).map(t => ({ ...t }))
    };
  }

  // ========================================
  // NUEVO TIPO DE PRENDA
  // ========================================

  abrirModalTipoPrenda(): void {
    this.nuevoTipoPrenda = {
      nombrePrenda: '',
      descripcion: '',
      longitudCosturaMetros: null
    };
    this.mostrarModalTipoPrenda = true;
  }

  cancelarModalTipoPrenda(): void {
    this.mostrarModalTipoPrenda = false;
  }

  guardarTipoPrenda(): void {
    const nombre = this.nuevoTipoPrenda.nombrePrenda.trim();
    if (!nombre) {
      this.errorMensaje = 'Ingresa un nombre para el tipo de prenda';
      return;
    }

    const existe = this.tiposPrenda.some(tp => tp.nombrePrenda.trim().toLowerCase() === nombre.toLowerCase());
    if (existe) {
      this.errorMensaje = 'Ese tipo de prenda ya existe';
      return;
    }

    const longitud = this.nuevoTipoPrenda.longitudCosturaMetros ?? undefined;
    if (longitud !== undefined && longitud <= 0) {
      this.errorMensaje = 'La longitud de costura debe ser mayor a 0';
      return;
    }

    const nuevoTipo: TipoPrenda = {
      idTipoPrenda: this.idTipoPrendaTemporal--,
      nombrePrenda: nombre,
      descripcion: this.nuevoTipoPrenda.descripcion.trim() || undefined,
      longitudCosturaMetros: longitud
    };

    this.tiposPrenda = [nuevoTipo, ...this.tiposPrenda];
    if (this.prendaEditando) {
      this.prendaEditando.idTipoPrenda = nuevoTipo.idTipoPrenda;
    }

    this.mostrarModalTipoPrenda = false;
    this.errorMensaje = '';
  }

  eliminarPrenda(index: number): void {
    this.prendasProyecto.splice(index, 1);
    this.recalcularMaterialesSiCorresponde();
  }

  // ========================================
  // DISTRIBUCIÃ“N DE TALLES
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
      this.errorMensaje = 'Selecciona un insumo vÃ¡lido y cantidad > 0';
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
        this.materialesCalculados = this.normalizarStockCalculado(response);
        this.cargando = false;
      },
      error: (err) => {
        this.errorMensaje = 'Error al calcular materiales: ' + err.message;
        this.cargando = false;
      }
    });
  }

  private recalcularMaterialesSiCorresponde(): void {
    if (this.materialesCalculados) {
      this.calcularMateriales();
    }
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

  private normalizarStockCalculado(response: CalculoMaterialesResponse): CalculoMaterialesResponse {
    const epsilon = 0.0001;
    let puedeCrearse = true;

    const materialesNormalizados = response.materialesCalculados.map(m => {
      const stockActual = Number(m.stockActual);
      const cantidadNecesaria = Number(m.cantidadNecesaria);
      const tieneStockSuficiente = stockActual + epsilon >= cantidadNecesaria;
      const faltante = tieneStockSuficiente ? undefined : Math.max(0, cantidadNecesaria - stockActual);

      if (!tieneStockSuficiente) {
        puedeCrearse = false;
      }

      return {
        ...m,
        tieneStockSuficiente,
        faltante
      };
    });

    const alertasFiltradas = response.alertas.filter(a => {
      if (!a.idInsumo) return true;
      const idInsumo = Number(a.idInsumo);
      const mat = materialesNormalizados.find(m => m.idInsumo === idInsumo);
      if (!mat) return true;
      return !mat.tieneStockSuficiente;
    });

    return {
      ...response,
      materialesCalculados: materialesNormalizados,
      alertas: alertasFiltradas,
      puedeCrearse
    };
  }

  // ========================================
  // GUARDAR PROYECTO
  // ========================================

  guardar(): void {
  if (!this.referenciaVisual.mockup) {
    this.errorMensaje = 'El mockup es obligatorio';
    return;
  }

  if (this.referenciaVisual.bordado.requerido && !this.referenciaVisual.bordado.descripcion.trim()) {
    this.errorMensaje = 'Ingresa la descripción del bordado';
    return;
  }

  if (this.referenciaVisual.estampado.requerido && !this.referenciaVisual.estampado.descripcion.trim()) {
    this.errorMensaje = 'Ingresa la descripción del estampado';
    return;
  }

  if (this.formulario.invalid) {
    this.marcarCamposComoTocados();
    this.errorMensaje = 'Completa los campos obligatorios (*)';
    return;
  }

  if (this.prendasProyecto.length === 0) {
    this.errorMensaje = 'Agrega al menos una prenda a la muestra';
    return;
  }

  for (let i = 0; i < this.prendasProyecto.length; i++) {
    const prenda = this.prendasProyecto[i];
    this.aplicarTalleDefecto(prenda);

    if (!validarSumaTalles(prenda.tallesDistribuidos, prenda.cantidadTotal)) {
      this.errorMensaje = `Prenda ${i + 1}: La distribución de talles no coincide con la cantidad total`;
      return;
    }
  }

  this.cargando = true;
  this.errorMensaje = '';

  const formValue = this.formulario.getRawValue(); // getRawValue incluye campos deshabilitados

  // ========== MODO EDICIÃ“N ==========
  if (this.modoEdicion && this.proyectoAEditar) {
    const dtoActualizacion = {
      idProyecto: this.proyectoAEditar.idProyecto,
      idCliente: Number(formValue.idCliente),
      nombreProyecto: formValue.nombreProyecto.trim(),
      descripcion: formValue.descripcion?.trim() || undefined,
      prioridad: formValue.prioridad,
      estado: this.estadoProyecto,
      fechaFin: formValue.fechaFin || undefined,
      idUsuarioEncargado: formValue.idUsuarioEncargado
        ? Number(formValue.idUsuarioEncargado)
        : undefined,
      prendas: this.permitirEdicionPrendas
        ? this.prendasProyecto.map((p, index) => ({
            idTipoPrenda: p.idTipoPrenda!,
            idTipoInsumoMaterial: p.idTipoInsumoMaterial!,
            idInsumo: p.idInsumo!,
            cantidadTotal: p.cantidadTotal,
            tieneBordado: p.tieneBordado,
            tieneEstampado: p.tieneEstampado,
            descripcionDiseño: p.descripcionDiseno?.trim() || undefined,
            orden: index,
            talles: p.tallesDistribuidos.map(t => ({
              idTalle: t.idTalle,
              cantidad: t.cantidad
            }))
          }))
        : [],
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

    this.proyectosService.actualizarProyecto(this.proyectoAEditar.idProyecto, dtoActualizacion).subscribe({
      next: () => {
        this.cerrar.emit();
      },
      error: (err) => {
        this.errorMensaje = this.extraerMensajeError(err);
        this.cargando = false;
      }
    });
    
    return; // Salir despuÃ©s de actualizar
  }

  // ========== MODO CREACIÃ“N (código original) ==========
  const dtoMuestra = {
    idCliente: Number(formValue.idCliente),
    nombreMuestra: formValue.nombreProyecto.trim(),
    descripcion: formValue.descripcion?.trim() || undefined,
    prioridad: formValue.prioridad,
    estado: 'Pendiente',
    fechaCreacion: formValue.fechaInicio,
    fechaEntrega: formValue.fechaFin || undefined,
    idUsuarioEncargado: formValue.idUsuarioEncargado
      ? Number(formValue.idUsuarioEncargado)
      : undefined,
    mockupUrl: this.referenciaVisual.mockup,
    bordadoRequerido: this.referenciaVisual.bordado.requerido,
    bordadoDescripcion: this.referenciaVisual.bordado.descripcion?.trim() || undefined,
    bordadoReferencia: this.referenciaVisual.bordado.imagen || undefined,
    estampadoRequerido: this.referenciaVisual.estampado.requerido,
    estampadoDescripcion: this.referenciaVisual.estampado.descripcion?.trim() || undefined,
    estampadoReferencia: this.referenciaVisual.estampado.imagen || undefined,
    otrosDetalle: this.referenciaVisual.otrosDetalle?.trim() || undefined,
    paletaRgb: this.paletaRgbTexto,
    prendas: this.prendasProyecto.map((p, index) => ({
      idTipoPrenda: p.idTipoPrenda!,
      idTipoInsumoMaterial: p.idTipoInsumoMaterial!,
      colorTela: p.colorTela || undefined,
      tieneBordado: p.tieneBordado,
      tieneEstampado: p.tieneEstampado,
      descripcionDiseno: p.descripcionDiseno?.trim() || undefined
    }))
  };

  this.muestrasService.crearMuestra(dtoMuestra).subscribe({
    next: () => {
      if (this.esModal) {
        this.cerrar.emit();
      } else {
        this.router.navigate(['/proyectos/muestras']);
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
    return err.message || 'Error al crear la muestra';
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
      this.router.navigate(['/proyectos/explorar']);
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
    return disenos.length > 0 ? disenos.join(' + ') : 'Sin diseÃ±o';
  }

  get clienteSeleccionado(): Cliente | undefined {
    const idCliente = this.formulario.get('idCliente')?.value;
    if (!idCliente) return undefined;
    return this.clientes.find(c => c.idCliente === Number(idCliente));
  }

  get paletaHex(): string {
    const toHex = (value: number) => Math.max(0, Math.min(255, value)).toString(16).padStart(2, '0');
    return `#${toHex(this.paletaRgb.r)}${toHex(this.paletaRgb.g)}${toHex(this.paletaRgb.b)}`.toUpperCase();
  }

  get paletaRgbTexto(): string {
    const r = Math.max(0, Math.min(255, this.paletaRgb.r));
    const g = Math.max(0, Math.min(255, this.paletaRgb.g));
    const b = Math.max(0, Math.min(255, this.paletaRgb.b));
    return `rgb(${r}, ${g}, ${b})`;
  }

  normalizarPaletaRgb(): void {
    this.paletaRgb = {
      r: Math.max(0, Math.min(255, Number(this.paletaRgb.r) || 0)),
      g: Math.max(0, Math.min(255, Number(this.paletaRgb.g) || 0)),
      b: Math.max(0, Math.min(255, Number(this.paletaRgb.b) || 0))
    };
  }

  onReferenciaImagenChange(event: Event, tipo: 'bordado' | 'estampado'): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      this.referenciaVisual[tipo].imagen = String(reader.result || '');
    };
    reader.readAsDataURL(file);
  }

  onMockupChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      this.referenciaVisual.mockup = String(reader.result || '');
    };
    reader.readAsDataURL(file);
  }

  private aplicarTalleDefecto(prenda: PrendaFormulario): void {
    prenda.cantidadTotal = 1;
    if (prenda.tallesDistribuidos && prenda.tallesDistribuidos.length > 0) return;
    if (!this.talles || this.talles.length === 0) return;

    const talleM = this.talles.find(t => (t.nombreTalle || '').trim().toLowerCase() === 'm')
      || this.talles.find(t => (t.nombreTalle || '').toLowerCase().includes('med'))
      || this.talles[0];

    if (talleM) {
      prenda.tallesDistribuidos = [{
        idTalle: talleM.idTalle,
        nombreTalle: talleM.nombreTalle,
        cantidad: 1
      }];
    }
  }

  /**
   * Configurar quÃ© campos se pueden editar segÃºn el estado
   */
  private configurarEdicionSegunEstado(): void {
    if (this.estadoProyecto === 'Finalizado' || this.estadoProyecto === 'Archivado') {
      this.errorMensaje = 'No se puede editar una muestra ' + this.estadoProyecto;
      this.cerrar.emit();
      return;
    }
    
    if (this.estadoProyecto === 'En Proceso' || this.estadoProyecto === 'Pausado') {
      this.permitirEdicionCompleta = false;
      this.permitirEdicionPrendas = true;
      this.mensajeRestriccion = 'âš ï¸ La muestra estÃ¡ en producción. Puedes editar: nombre, descripción, prioridad, fecha fin, encargado, cantidades de prendas y materiales manuales.';
      
      // Deshabilitar campos que no se pueden editar
      this.formulario.get('idCliente')?.disable();
      this.formulario.get('fechaInicio')?.disable();
    } else if (this.estadoProyecto === 'Pendiente') {
      this.permitirEdicionCompleta = true;
      this.permitirEdicionPrendas = true;
      this.mensajeRestriccion = 'â„¹ï¸ Puedes editar todos los campos mientras la muestra no haya iniciado.';
    }
  }

  /**
   * Precargar datos del proyecto a editar
   */
  private precargarDatos(): void {
    if (!this.proyectoAEditar) return;
    
    // Precargar datos bÃ¡sicos del formulario
    this.formulario.patchValue({
      idCliente: this.proyectoAEditar.idCliente,
      nombreProyecto: this.proyectoAEditar.nombreProyecto,
      descripcion: this.proyectoAEditar.descripcion,
      prioridad: this.proyectoAEditar.prioridad,
      fechaInicio: this.proyectoAEditar.fechaInicio,
      fechaFin: this.proyectoAEditar.fechaFin,
      idUsuarioEncargado: this.proyectoAEditar.idUsuarioEncargado
    });
    
    // Precargar prendas solo si permite edición completa
    if (this.permitirEdicionPrendas && this.proyectoAEditar.prendas) {
      this.prendasProyecto = this.proyectoAEditar.prendas.map((p: any) => ({
        id: generarIdTemporal(),
        idTipoPrenda: p.idTipoPrenda,
        nombrePrenda: p.nombrePrenda,
        idTipoInsumoMaterial: p.idTipoInsumoMaterial,
        nombreMaterial: p.nombreMaterial,
        idInsumo: p.idInsumo,
        cantidadTotal: p.cantidadTotal,
        tieneBordado: p.tieneBordado,
        tieneEstampado: p.tieneEstampado,
        descripcionDiseno: p.descripcionDiseño,
        tallesDistribuidos: p.talles?.map((t: any) => ({
          idTalle: t.idTalle,
          nombreTalle: t.nombreTalle,
          cantidad: t.cantidad
        })) || []
      }));
    }
    
    // Precargar materiales manuales
    if (this.proyectoAEditar.materiales) {
      const materialesManualesProyecto = this.proyectoAEditar.materiales.filter(
        (m: any) => m.tipoCalculo === 'Manual'
      );
      
      this.materialesManuales = materialesManualesProyecto.map((m: any) => ({
        id: generarIdTemporal(),
        idInsumo: m.idInsumo,
        nombreInsumo: m.nombreInsumo,
        categoria: m.tipoInsumo,
        cantidad: m.cantidadFinal,
        unidadMedida: m.unidadMedida,
        stockActual: m.stockActual
      }));
    }
  }
}

