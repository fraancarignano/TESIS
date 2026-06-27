import { Component, Output, EventEmitter, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProyectosServiceNuevo } from '../../services/proyectos-nuevo.service';
import { MuestrasService } from '../../services/muestra.service';
import { MuestraDetalle } from '../../models/muestra.model';
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
import { AlertasService } from '../../../../core/services/alertas';
import { NotificacionesService } from '../../../../core/services/notificaciones.service';

@Component({
  selector: 'app-proyecto-form-nuevo',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './proyecto-form.component.html',
  styleUrls: ['./proyecto-form.component.css']
})
export class ProyectoFormNuevoComponent implements OnInit {
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
  // Buscador inteligente de material (ahora por material en edición)
  busquedaMaterialNombres: { [index: number]: string } = {};
  busquedaMaterialIds: { [index: number]: number | undefined } = {};
  mostrarSugerenciasMaterial = false;
  materialEnEdicionIndex = -1;

  get insumosTelasBusqueda(): InsumoFormulario[] {
    if (this.materialEnEdicionIndex === -1 || !this.prendaEditando?.materiales) return [];
    const idx = this.materialEnEdicionIndex;
    const mat = this.prendaEditando.materiales[idx];
    if (!mat?.idTipoInsumoMaterial) return [];
    
    const base = this.insumosTelas.filter(
      i => i.idTipoInsumo === Number(mat.idTipoInsumoMaterial)
    );
    const termNombre = (this.busquedaMaterialNombres[idx] || '').trim().toLowerCase();
    const termId = this.busquedaMaterialIds[idx];
    if (!termNombre && !termId) return base.slice(0, 8);
    return base.filter(i => {
      if (termId) return i.idInsumo === termId;
      return i.nombreInsumo.toLowerCase().includes(termNombre) ||
             (i.color || '').toLowerCase().includes(termNombre);
    }).slice(0, 10);
  }

  onBusquedaMaterialNombreChange(index: number): void {
    this.materialEnEdicionIndex = index;
    if (this.prendaEditando?.materiales) {
      this.prendaEditando.materiales[index].idInsumo = undefined;
    }
    this.mostrarSugerenciasMaterial = true;
  }

  onBusquedaMaterialIdChange(index: number): void {
    this.materialEnEdicionIndex = index;
    const termId = this.busquedaMaterialIds[index];
    if (termId) {
      const found = this.insumosTelas.find(i => i.idInsumo === termId);
      if (found) { this.seleccionarMaterial(found, index); return; }
    }
    if (this.prendaEditando?.materiales) {
      this.prendaEditando.materiales[index].idInsumo = undefined;
    }
  }

  seleccionarMaterial(insumo: InsumoFormulario, index?: number): void {
    const idx = index !== undefined ? index : this.materialEnEdicionIndex;
    if (idx === -1 || !this.prendaEditando?.materiales) return;
    const mat = this.prendaEditando.materiales[idx];
    mat.idInsumo = insumo.idInsumo;
    mat.colorTela = insumo.color || undefined;
    this.busquedaMaterialNombres[idx] = '';
    this.busquedaMaterialIds[idx] = undefined;
    this.mostrarSugerenciasMaterial = false;
    this.materialEnEdicionIndex = -1;
  }

  limpiarMaterialSeleccionado(index: number): void {
    if (!this.prendaEditando?.materiales) return;
    const mat = this.prendaEditando.materiales[index];
    mat.idInsumo = undefined;
    mat.colorTela = undefined;
    this.busquedaMaterialNombres[index] = '';
    this.busquedaMaterialIds[index] = undefined;
    this.materialEnEdicionIndex = -1;
  }

  ocultarSugerenciasMaterialDelay(): void {
    setTimeout(() => { this.mostrarSugerenciasMaterial = false; }, 200);
  }

  getMaterialSeleccionadoObj(index: number): InsumoFormulario | undefined {
    if (!this.prendaEditando?.materiales) return undefined;
    const mat = this.prendaEditando.materiales[index];
    if (!mat?.idInsumo) return undefined;
    return this.insumosTelas.find(i => i.idInsumo === Number(mat.idInsumo));
  }
  muestrasAprobadas: MuestraDetalle[] = [];

  private muestraQueryId?: number;
  private muestraQueryAplicada = false;
  private datosFormularioCargados = false;
  private muestrasCargadas = false;

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
  idTipoHiloSeleccionado?: number;
  idTipoAccesorioSeleccionado?: number;
  insumosHilosFiltrados: InsumoFormulario[] = [];
  insumosAccesoriosFiltrados: InsumoFormulario[] = [];
  materialesAdicionalesExpandido = false;

  private prendaTieneTelaAsignada(prenda: PrendaFormulario): boolean {
    if (prenda.materiales && prenda.materiales.length > 0) {
      return prenda.materiales.some(m => {
        const idInsumo = Number(m.idInsumo);
        const tieneInsumoEnStock = !!idInsumo && this.insumosTelas.some(i => i.idInsumo === idInsumo);
        const tieneColorSolicitado = !!(m.colorTela || '').trim();
        return tieneInsumoEnStock || tieneColorSolicitado;
      });
    }

    // Fallback retrocompatibilidad
    if (!prenda.idTipoInsumoMaterial) return false;
    const idInsumo = Number(prenda.idInsumo);
    const tieneInsumoEnStock = !!idInsumo && this.insumosTelas.some(i => i.idInsumo === idInsumo);
    const tieneColorSolicitado = !!(prenda.colorTela || '').trim();

    return tieneInsumoEnStock || tieneColorSolicitado;
  }

  private getNombrePrendaParaMensaje(prenda: PrendaFormulario, index: number): string {
    const nombre =
      (prenda.nombrePrenda || '').trim() ||
      this.tiposPrenda.find(t => t.idTipoPrenda === prenda.idTipoPrenda)?.nombrePrenda ||
      `Prenda ${index + 1}`;

    return nombre;
  }

  get prendasSinTelaResumen(): string {
    const faltantes = this.prendasProyecto
      .map((p, idx) => ({ p, idx }))
      .filter(x => !this.prendaTieneTelaAsignada(x.p))
      .map(x => this.getNombrePrendaParaMensaje(x.p, x.idx));

    if (faltantes.length === 0) return '';
    if (faltantes.length <= 4) return faltantes.join(', ');

    const primeros = faltantes.slice(0, 4).join(', ');
    return `${primeros} y ${faltantes.length - 4} más`;
  }

  get mensajeFaltaAsignarTelas(): string {
    const resumen = this.prendasSinTelaResumen;
    if (!resumen) return '';

    return `No se puede crear el proyecto: falta asignar la tela en ${resumen}. ` +
      `Seleccioná un insumo en stock o escribí el color solicitado.`;
  }

  get faltaAsignarTelas(): boolean {
    return this.prendasProyecto.some(p => !this.prendaTieneTelaAsignada(p));
  }

  get puedeGuardarProyecto(): boolean {
    // En edición no bloquear por telas (solo aplica a "iniciar/crear" proyecto)
    const faltanTelas = this.modoEdicion ? false : this.faltaAsignarTelas;
    return !this.cargando && this.formulario.valid && this.prendasProyecto.length > 0 && !faltanTelas;
  }

  // Preview de materiales calculados
  materialesCalculados?: CalculoMaterialesResponse;
  mostrarPreviewMateriales = false;

  constructor(
    private fb: FormBuilder,
    private proyectosService: ProyectosServiceNuevo,
    private muestrasService: MuestrasService,
    private route: ActivatedRoute,
    private router: Router,
    private alertas: AlertasService,
    private notificacionesService: NotificacionesService
  ) {
    this.crearFormulario();
  }

  ngOnInit(): void {
  this.cargarDatosFormulario();
  this.cargarMuestrasAprobadas();

  this.route.queryParamMap.subscribe(params => {
    const id = Number(params.get('muestra'));
    this.muestraQueryId = id > 0 ? id : undefined;
    this.aplicarMuestraDesdeQuerySiCorresponde();
  });
  
  // ========== NUEVO: Detectar modo edición ==========
  if (this.modoEdicion && this.proyectoAEditar) {
    this.estadoProyecto = this.proyectoAEditar.estado;
    // Esperamos a que se carguen los datos del formulario para precargar
  } else {
    this.setearFechaInicioPorDefecto();
  }
  
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
      idUsuarioEncargado: [''],
      idMuestraAprobada: ['']
    });
  }

  private cargarMuestrasAprobadas(): void {
    this.muestrasService.obtenerMuestras().subscribe({
      next: (data) => {
        this.muestrasAprobadas = (data || []).filter(m => (m.estado || '').toLowerCase() === 'aprobada');
        this.muestrasCargadas = true;
        this.aplicarMuestraDesdeQuerySiCorresponde();
      },
      error: () => {
        this.muestrasAprobadas = [];
        this.muestrasCargadas = true;
        this.aplicarMuestraDesdeQuerySiCorresponde();
      }
    });
  }

  async onMuestraSeleccionada(): Promise<void> {
    const id = Number(this.formulario.get('idMuestraAprobada')?.value);
    if (!id) return;

    if (this.prendasProyecto.length > 0) {
      const confirmar = await this.alertas.confirmar(
        '¿Continuar con la muestra?',
        'Esto reemplazará las prendas actuales por las de la muestra seleccionada.'
      );
      if (!confirmar) {
        this.formulario.patchValue({ idMuestraAprobada: '' });
        return;
      }
    }

    const muestraLocal = this.muestrasAprobadas.find(m => m.idMuestra === id);
    
    if (muestraLocal) {
      await this.preguntarUsarCliente(muestraLocal);
      
      if (muestraLocal.prendas?.length) {
        this.aplicarMuestraAFormulario(muestraLocal);
        return;
      }
    }

    this.muestrasService.obtenerMuestraPorId(id).subscribe({
      next: async (muestra) => {
        if (!muestraLocal) {
          await this.preguntarUsarCliente(muestra);
        }
        this.aplicarMuestraAFormulario(muestra);
      },
      error: () => {
        this.errorMensaje = 'No se pudo cargar la muestra seleccionada';
      }
    });
  }

  private async preguntarUsarCliente(muestra: MuestraDetalle): Promise<void> {
    if (muestra.idCliente) {
      const clienteActual = this.formulario.get('idCliente')?.value;
      if (clienteActual && Number(clienteActual) === muestra.idCliente) return;

      const confirmar = await this.alertas.confirmar(
        'Usar cliente de muestra',
        `¿Deseas asignar automáticamente a "${muestra.nombreCliente || 'el cliente de la muestra'}" como el cliente para este proyecto?`
      );
      
      if (confirmar) {
        this.formulario.patchValue({ idCliente: muestra.idCliente });
      }
    }
  }

  private aplicarMuestraAFormulario(muestra: MuestraDetalle): void {
    const prendas = (muestra.prendas || []).map(p => {
      const color = (p.colorTela || '').trim();
      const insumoMatch = this.insumos.find(i =>
        i.idTipoInsumo === p.idTipoInsumoMaterial &&
        (!!color ? (i.color || '').trim().toLowerCase() === color.toLowerCase() : true)
      );

      return {
        id: generarIdTemporal(),
        idTipoPrenda: p.idTipoPrenda,
        idTipoInsumoMaterial: p.idTipoInsumoMaterial,
        idInsumo: insumoMatch?.idInsumo,
        colorTela: color || insumoMatch?.color,
        cantidadTotal: 1,
        tieneBordado: p.tieneBordado,
        tieneEstampado: p.tieneEstampado,
        descripcionDiseno: p.descripcionDiseno || undefined,
        tallesDistribuidos: []
      } as PrendaFormulario;
    });

    this.prendasProyecto = prendas;
    this.materialesManuales = [];
    this.materialesCalculados = undefined;
    this.mostrarPreviewMateriales = false;
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

        this.onTipoHiloChange();
        this.onTipoAccesorioChange();

        this.cargando = false;
        this.datosFormularioCargados = true;
        this.aplicarMuestraDesdeQuerySiCorresponde();

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

  private aplicarMuestraDesdeQuerySiCorresponde(): void {
    if (this.muestraQueryAplicada) return;
    if (!this.muestraQueryId) return;
    if (!this.datosFormularioCargados || !this.muestrasCargadas) return;

    this.muestraQueryAplicada = true;
    this.formulario.patchValue({ idMuestraAprobada: this.muestraQueryId });
    void this.onMuestraSeleccionada();
  }

  // ========================================
  // FILTRO DE MATERIALES
  // ========================================

  onTipoMaterialChange(index: number): void {
    if (!this.prendaEditando?.materiales) return;
    const mat = this.prendaEditando.materiales[index];

    if (!mat.idTipoInsumoMaterial) {
      mat.idInsumo = undefined;
      mat.colorTela = undefined;
      this.busquedaMaterialNombres[index] = '';
      this.busquedaMaterialIds[index] = undefined;
      return;
    }

    mat.idInsumo = undefined;
    mat.colorTela = undefined;
    this.busquedaMaterialNombres[index] = '';
    this.busquedaMaterialIds[index] = undefined;
  }

  agregarMaterialAPrenda(): void {
    if (!this.prendaEditando) return;
    if (!this.prendaEditando.materiales) this.prendaEditando.materiales = [];
    this.prendaEditando.materiales.push({
      id: generarIdTemporal(),
      cantidad: 1 // Por defecto 1
    });
  }

  eliminarMaterialDePrenda(index: number): void {
    if (!this.prendaEditando?.materiales) return;
    this.prendaEditando.materiales.splice(index, 1);
    delete this.busquedaMaterialNombres[index];
    delete this.busquedaMaterialIds[index];
  }

  onInsumoColorChange(): void {
    if (!this.prendaEditando?.idInsumo) return;
    const insumo = this.insumosTelas.find(i => i.idInsumo === Number(this.prendaEditando!.idInsumo));
    if (insumo?.color) {
      this.prendaEditando!.colorTela = insumo.color;
    }
  }

  onTipoHiloChange(): void {
    if (!this.idTipoHiloSeleccionado) {
      this.insumosHilosFiltrados = this.insumosHilos;
      return;
    }

    this.insumosHilosFiltrados = this.insumosHilos.filter(
      i => i.idTipoInsumo === Number(this.idTipoHiloSeleccionado)
    );
  }

  onTipoAccesorioChange(): void {
    if (!this.idTipoAccesorioSeleccionado) {
      this.insumosAccesoriosFiltrados = this.insumosAccesorios;
      return;
    }

    this.insumosAccesoriosFiltrados = this.insumosAccesorios.filter(
      i => i.idTipoInsumo === Number(this.idTipoAccesorioSeleccionado)
    );
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
    this.prendaEditandoSnapshot = this.clonarPrenda(this.prendaEditando);
  }

  editarPrenda(prenda: PrendaFormulario, index: number): void {
    this.prendaEditando = this.clonarPrenda(prenda);
    this.indexPrendaEditando = index;
    this.prendaEditandoSnapshot = this.clonarPrenda(this.prendaEditando);
    
    // Si la prenda vieja no tenía materiales, inicializamos
    if (!this.prendaEditando!.materiales) {
      this.prendaEditando!.materiales = [];
      if (this.prendaEditando!.idTipoInsumoMaterial) {
        this.prendaEditando!.materiales.push({
          id: generarIdTemporal(),
          idTipoInsumoMaterial: this.prendaEditando!.idTipoInsumoMaterial,
          idInsumo: this.prendaEditando!.idInsumo,
          colorTela: this.prendaEditando!.colorTela,
          cantidad: 1
        });
      }
    }
  }

  guardarPrenda(prenda: PrendaFormulario): void {
    if (!prenda.idTipoPrenda || prenda.cantidadTotal <= 0) {
      this.errorMensaje = 'Completa todos los campos obligatorios de la prenda';
      return;
    }

    if (!prenda.materiales || prenda.materiales.length === 0) {
      this.errorMensaje = 'Debes agregar al menos un material a la prenda';
      return;
    }

    const materialesInvalidos = prenda.materiales.some(m => !m.idTipoInsumoMaterial);
    if (materialesInvalidos) {
      this.errorMensaje = 'Todos los materiales deben tener un tipo de material seleccionado';
      return;
    }

    // Compatibilidad hacia atrás: setear el primer material en los campos raíz
    const primerMaterial = prenda.materiales[0];
    prenda.idTipoInsumoMaterial = primerMaterial.idTipoInsumoMaterial;
    prenda.idInsumo = primerMaterial.idInsumo;
    prenda.colorTela = primerMaterial.colorTela;

    // Si no hay idInsumo (sin stock), usar el idTipoInsumoMaterial como referencia
    if (!prenda.idInsumo) {
      prenda.idInsumo = Number(prenda.idTipoInsumoMaterial);
      primerMaterial.idInsumo = prenda.idInsumo;
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
    // Solo sobreescribir colorTela si viene del insumo seleccionado (no borrar el ingresado manualmente)
    if (insumoTela?.color) {
      prenda.colorTela = insumoTela.color;
    }

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

  async confirmarCerrarModalPrenda(): Promise<void> {
    if (this.prendaEditando && this.tieneCambiosEnPrenda()) {
      const confirmar = await this.alertas.confirmar(
        'Cambios sin guardar',
        '¿Deseas cerrar la configuración de la prenda? Se perderán los cambios realizados.'
      );
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
      a.cantidadTotal !== b.cantidadTotal ||
      a.tieneBordado !== b.tieneBordado ||
      a.tieneEstampado !== b.tieneEstampado ||
      (a.descripcionDiseno || '').trim() !== (b.descripcionDiseno || '').trim()
    ) {
      return false;
    }

    const matA = a.materiales || [];
    const matB = b.materiales || [];
    if (matA.length !== matB.length) return false;
    for (let i = 0; i < matA.length; i++) {
      if (matA[i].idTipoInsumoMaterial !== matB[i].idTipoInsumoMaterial ||
          matA[i].idInsumo !== matB[i].idInsumo ||
          matA[i].colorTela !== matB[i].colorTela) {
        return false;
      }
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
      materiales: (prenda.materiales || []).map(m => ({ ...m })),
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

  agregarMaterialManualFlexible(
    idTipoInsumoStr: string | number | undefined | null,
    idInsumoStr: string | number | undefined | null,
    detalleStr: string,
    cantidadStr: string | number,
    categoria: 'Hilo' | 'Accesorio'
  ): void {
    const idTipoInsumo = Number(idTipoInsumoStr);
    const idInsumoSeleccionado = Number(idInsumoStr);
    const cantidad = Number(cantidadStr);
    const detalle = (detalleStr || '').trim();

    if (cantidad <= 0) {
      this.errorMensaje = 'Ingresa una cantidad > 0';
      setTimeout(() => (this.errorMensaje = ''), 3000);
      return;
    }

    // Si hay insumo seleccionado, asignar directo
    if (idInsumoSeleccionado) {
      const insumo = this.insumos.find(i => i.idInsumo === idInsumoSeleccionado);
      if (!insumo) return;

      const clave = `${insumo.idInsumo}|${detalle.toLowerCase()}`;
      const existe = this.materialesManuales.find(
        m => `${Number(m.idInsumo)}|${(m.observaciones || '').trim().toLowerCase()}` === clave
      );

      if (existe) {
        existe.cantidad += cantidad;
        return;
      }

      this.materialesManuales.push({
        id: generarIdTemporal(),
        idInsumo: insumo.idInsumo,
        nombreInsumo: insumo.nombreInsumo,
        categoria: categoria,
        cantidad,
        unidadMedida: insumo.unidadMedida,
        stockActual: insumo.stockActual,
        observaciones: detalle || undefined
      });

      return;
    }

    // Sin insumo seleccionado: permitir "tipear" y mandar a OC (fallback similar a telas)
    if (!idTipoInsumo || !detalle) {
      this.errorMensaje = 'Selecciona un tipo y escribe un detalle (nombre/color), y cantidad > 0';
      setTimeout(() => (this.errorMensaje = ''), 3000);
      return;
    }

    const tipo = (categoria === 'Hilo' ? this.tiposInsumoHilos : this.tiposInsumoAccesorios)
      .find(t => t.idTipoInsumo === idTipoInsumo);

    const nombre = tipo ? `${tipo.nombreTipo} — ${detalle}` : detalle;

    const clave = `${idTipoInsumo}|${detalle.toLowerCase()}`;
    const existe = this.materialesManuales.find(
      m => `${Number(m.idInsumo)}|${(m.observaciones || '').trim().toLowerCase()}` === clave
    );

    if (existe) {
      existe.cantidad += cantidad;
      return;
    }

    this.materialesManuales.push({
      id: generarIdTemporal(),
      // Igual que en telas: si no hay stock / insumo, usamos el id del tipo como referencia
      idInsumo: idTipoInsumo,
      nombreInsumo: nombre,
      categoria: categoria,
      cantidad,
      unidadMedida: 'Unidades',
      stockActual: 0,
      observaciones: detalle
    });
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

    const prendasParaCalculo = this.prendasProyecto.flatMap(p => {
      if (p.materiales && p.materiales.length > 0) {
        const principal = p.materiales[0];
        return [{
          idTipoPrenda: p.idTipoPrenda!,
          idTipoInsumoMaterial: principal.idTipoInsumoMaterial!,
          idInsumo: (principal.idInsumo && principal.idInsumo !== principal.idTipoInsumoMaterial) ? principal.idInsumo : undefined,
          cantidadTotal: p.cantidadTotal,
          colorSolicitado: principal.colorTela || p.colorTela || undefined
        }];
      }

      return [{
        idTipoPrenda: p.idTipoPrenda!,
        idTipoInsumoMaterial: p.idTipoInsumoMaterial!,
        idInsumo: (p.idInsumo && p.idInsumo !== p.idTipoInsumoMaterial) ? p.idInsumo : undefined,
        cantidadTotal: p.cantidadTotal,
        colorSolicitado: p.colorTela || undefined
      }];
    });

    const request = {
      prendas: prendasParaCalculo,
      materialesManuales: this.materialesManuales.map(m => ({
        idInsumo: m.idInsumo!,
        cantidad: m.cantidad
      })),
      noConsumirStock: true
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

  if (!this.modoEdicion && this.faltaAsignarTelas) {
    this.errorMensaje = this.mensajeFaltaAsignarTelas;
    return;
  }

  this.cargando = true;
  this.errorMensaje = '';

  const formValue = this.formulario.getRawValue(); // getRawValue incluye campos deshabilitados

  // ========== MODO EDICIÓN ==========
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
            idInsumo: p.idInsumo,
            cantidadTotal: p.cantidadTotal,
            tieneBordado: p.tieneBordado ?? false,
            tieneEstampado: p.tieneEstampado ?? false,
            descripcionDiseno: p.descripcionDiseno?.trim() || undefined,
            colorTela: p.colorTela?.trim() || undefined,
            orden: index,
            talles: p.tallesDistribuidos.map(t => ({
              idTalle: t.idTalle,
              cantidad: t.cantidad
            })),
            materiales: p.materiales && p.materiales.length > 0
              ? p.materiales.map(m => ({
                  idTipoInsumoMaterial: m.idTipoInsumoMaterial!,
                  idInsumo: m.idInsumo,
                  colorTela: m.colorTela?.trim() || undefined
                }))
              : undefined
          }))
        : [],
      materialesManualesActualizados:
        this.materialesManuales.length > 0
          ? this.materialesManuales.map(m => ({
              idInsumo: m.idInsumo!,
              cantidad: m.cantidad,
              unidadMedida: m.unidadMedida!,
              observaciones: m.observaciones?.trim() || undefined
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
    
    return; // Salir después de actualizar
  }

  // ========== MODO CREACIÓN (código original) ==========
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
    idMuestra: formValue.idMuestraAprobada
      ? Number(formValue.idMuestraAprobada)
      : undefined,
    noConsumirStock: true,
    prendas: this.prendasProyecto.map((p, index) => ({
      idTipoPrenda: p.idTipoPrenda!,
      idTipoInsumoMaterial: p.idTipoInsumoMaterial!,
      idInsumo: p.idInsumo,
      cantidadTotal: p.cantidadTotal,
      tieneBordado: p.tieneBordado,
      tieneEstampado: p.tieneEstampado,
      descripcionDiseno: p.descripcionDiseno?.trim() || undefined,
      colorTela: p.colorTela?.trim() || undefined,
      orden: index,
      talles: p.tallesDistribuidos.map(t => ({
        idTalle: t.idTalle,
        cantidad: t.cantidad
      })),
      materiales: p.materiales && p.materiales.length > 0
        ? p.materiales.map(m => ({
            idTipoInsumoMaterial: m.idTipoInsumoMaterial!,
            idInsumo: m.idInsumo,
            colorTela: m.colorTela?.trim() || undefined
          }))
        : undefined
    }))
  };

  this.proyectosService.crearProyecto(dto).subscribe({
    next: (proyectoCreado) => {
      const idMuestra = formValue.idMuestraAprobada ? Number(formValue.idMuestraAprobada) : 0;
      const finalizar = () => {
        this.alertas.toast('Proyecto creado correctamente');
        this.notificarInventarioPorTelas(proyectoCreado);
        if (this.esModal) {
          this.cerrar.emit();
        } else {
          this.router.navigate(['/proyectos/explorar']);
        }
      };

      if (idMuestra > 0 && proyectoCreado?.idProyecto) {
        this.muestrasService.asignarMuestraAProyecto(idMuestra, proyectoCreado.idProyecto).subscribe({
          next: () => finalizar(),
          error: () => finalizar()
        });
        return;
      }

      finalizar();
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
      this.router.navigate(['/proyectos/explorar']);
    }
  }

  // ========================================
  // HELPERS PARA EL TEMPLATE
  // ========================================

  private notificarInventarioPorTelas(proyectoCreado: any): void {
    if (!this.prendasProyecto.length) return;

    const materiales: any[] = [];
    const vistos = new Set<string>();

    this.prendasProyecto.forEach(p => {
      if (!p.idTipoInsumoMaterial) return;

      const tipoInsumo = this.tiposInsumo.find(t => t.idTipoInsumo === p.idTipoInsumoMaterial);
      const esTela = tipoInsumo && (
        (tipoInsumo.categoria || '').toLowerCase().includes('tela') ||
        (tipoInsumo.nombreTipo || '').toLowerCase().includes('tela') ||
        (tipoInsumo.nombreTipo || '').toLowerCase().includes('algod') ||
        (tipoInsumo.nombreTipo || '').toLowerCase().includes('poli')
      );
      if (!esTela) return;

      // Clave única por tipo + color para no duplicar
      const clave = `${p.idTipoInsumoMaterial}|${(p.colorTela || '').toLowerCase().trim()}`;
      if (vistos.has(clave)) return;
      vistos.add(clave);

      materiales.push({
        idTipoInsumo: p.idTipoInsumoMaterial,
        nombreTipoInsumo: tipoInsumo?.nombreTipo,
        colorSolicitado: p.colorTela?.trim() || undefined,
        cantidadEstimada: p.cantidadTotal,
        unidadMedida: undefined,
        mensaje: `Proyecto: ${proyectoCreado.nombreProyecto}` +
          (p.colorTela ? ` | Color: ${p.colorTela}` : '') +
          ` | Cantidad: ${p.cantidadTotal} prendas`
      });
    });

    if (materiales.length === 0) {
      // Si no hay telas identificadas, mandar igual con todos los materiales de prendas
      this.prendasProyecto.forEach(p => {
        if (!p.idTipoInsumoMaterial) return;
        const tipoInsumo = this.tiposInsumo.find(t => t.idTipoInsumo === p.idTipoInsumoMaterial);
        const clave = `${p.idTipoInsumoMaterial}|${(p.colorTela || '').toLowerCase().trim()}`;
        if (vistos.has(clave)) return;
        vistos.add(clave);
        materiales.push({
          idTipoInsumo: p.idTipoInsumoMaterial,
          nombreTipoInsumo: tipoInsumo?.nombreTipo,
          colorSolicitado: p.colorTela?.trim() || undefined,
          cantidadEstimada: p.cantidadTotal,
          unidadMedida: undefined,
          mensaje: `Proyecto: ${proyectoCreado.nombreProyecto}` +
            (p.colorTela ? ` | Color: ${p.colorTela}` : '') +
            ` | Cantidad: ${p.cantidadTotal} prendas`
        });
      });
    }

    if (materiales.length === 0) return;

    this.notificacionesService.crearSolicitudMaterial({
      idProyecto: proyectoCreado.idProyecto,
      nombreProyecto: proyectoCreado.nombreProyecto,
      materiales
    }).subscribe({
      next: () => this.alertas.toast('Solicitud de material enviada a Inventario'),
      error: (err) => console.error('Error al enviar solicitud de material:', err)
    });
  }

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

  /**
   * Configurar qué campos se pueden editar según el estado
   */
  private configurarEdicionSegunEstado(): void {
    if (this.estadoProyecto === 'Finalizado' || this.estadoProyecto === 'Archivado') {
      this.errorMensaje = 'No se puede editar un proyecto ' + this.estadoProyecto;
      this.cerrar.emit();
      return;
    }
    
    if (this.estadoProyecto === 'En Proceso' || this.estadoProyecto === 'Pausado') {
      this.permitirEdicionCompleta = false;
      this.permitirEdicionPrendas = true;
      this.mensajeRestriccion = '⚠️ El proyecto está en producción. Puedes editar: nombre, descripción, prioridad, fecha fin, encargado, cantidades de prendas y materiales manuales.';
      
      // Deshabilitar campos que no se pueden editar
      this.formulario.get('idCliente')?.disable();
      this.formulario.get('fechaInicio')?.disable();
    } else if (this.estadoProyecto === 'Pendiente') {
      this.permitirEdicionCompleta = true;
      this.permitirEdicionPrendas = true;
      this.mensajeRestriccion = 'ℹ️ Puedes editar todos los campos mientras el proyecto no haya iniciado.';
    }
  }

  /**
   * Precargar datos del proyecto a editar
   */
  private precargarDatos(): void {
    if (!this.proyectoAEditar) return;
    
    // Precargar datos básicos del formulario
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
        colorTela: p.colorTela,
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
