import { Component, Input, Output, EventEmitter, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MaterialProyecto, ObservacionProyecto, ProyectoVista } from '../../models/proyecto.model';
import { ProyectosService } from '../../services/proyecto.service';
import { DisenoService } from '../../services/diseno.service';
import { MuestrasService } from '../../services/muestra.service';
import { AlertasService } from '../../../../core/services/alertas';
import { PermissionService } from '../../../../core/services/permission.service';
import { ExportService, PlanillaConfeccionExport } from '../../../../core/services/export.service';
import { AuthService } from '../../../login/services/auth.service';
import { HasPermissionDirective } from '../../../../core/directives/has-permission.directive';
import { environment } from '../../../../../environments/environment';
import { TalleresService } from '../../../talleres/services/talleres.service';
import { Taller } from '../../../talleres/models/taller.model';
import {
  AREAS_PRODUCCION,
  AreaProduccion,
  getAreaActual,
  getSiguienteArea,
  calcularProgresoGeneralPorAreas,
  areaEstaCompleta,
  areaEnProgreso,
  areaPendiente
} from '../../constants/areas.constants';
import { ProyectoDisenoDetalle, ProyectoDisenoPayload } from '../../models/diseno.model';
import { DespachoService } from '../../../despachos/services/despacho.service';

@Component({
  selector: 'app-proyecto-detalle-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, HasPermissionDirective],
  templateUrl: './proyecto-detalle-modal.component.html',
  styleUrls: ['./proyecto-detalle-modal.component.css']
})
export class ProyectoDetalleModalComponent implements OnInit {
  @Input() proyecto!: ProyectoVista;
  @Input() modoPantallaCompleta = false;
  @Output() cerrar = new EventEmitter<void>();
  @Output() actualizado = new EventEmitter<void>();

  // Tabs
  tabActiva: 'info' | 'areas' | 'materiales' | 'auditoria' = 'areas';
  readonly mostrarTabsSecundarias = false;

  // Áreas
  readonly AREAS = AREAS_PRODUCCION;
  areaSeleccionada: AreaProduccion | null = null;
  observacionArea: string = '';
  procesandoArea = false;
  criteriosCalidad: CriterioCalidadUI[] = CRITERIOS_CALIDAD_INICIALES.map(c => ({ ...c }));
  inspeccionPorTalleActual: Record<string, number> = {};
  guardandoInspeccionCalidad = false;
  private _historialInspeccionesCalidad: ObservacionProyecto[] = [];
  private _seguimientoTalles: SeguimientoTalle[] = [];
  private _acumuladoGuardadoPorTalle: Record<string, number> = {};
  guardandoPlanCorte = false;
  cortePlan: PlanCorteForm = this.crearPlanCorteVacio();
  private _historialPlanesCorte: ObservacionProyecto[] = [];
  guardandoCorteReal = false;
  corteReal: CorteRealForm = this.crearCorteRealVacio();
  private _historialCortesReales: ObservacionProyecto[] = [];
  confeccion: ConfeccionForm = this.crearConfeccionVacio();
  guardandoConfeccion = false;
  planillaConfeccionGuardada = false;
  private _historialConfeccion: ObservacionProyecto[] = [];
  private _historialRecepcionesConfeccion: ObservacionProyecto[] = [];
  private _recepcionesConfeccion: RecepcionConfeccionRegistro[] = [];
  recepcionActual: RecepcionConfeccionForm = { fechaRecepcion: '', responsableRecepcion: '', recibidoPorTalle: {} };
  guardandoRecepcion = false;
  mostrarModalRecepcion = false;
  talleres: Taller[] = [];
  tallerSeleccionado: Taller | null = null;
  cargandoTalleres = false;
  guardandoDiseno = false;
  cargandoDiseno = false;
  disenoDetalle: ProyectoDisenoDetalle | null = null;
  disenoObservacionesGenerales = '';
  disenoPrendas: DisenoPrendaForm[] = [];
  disenoPrendasMap: Record<number, DisenoPrendaForm> = {};
  disenoResumenPrendas: DisenoResumenPrenda[] = [];
  loadingSync = false;

  // Observaciones generales
  nuevaObservacion: string = '';
  guardandoObservacion = false;

  // Archivar/Liberar proyecto
  procesandoArchivo = false;
  procesandoLiberacion = false;

  constructor(
    private proyectosService: ProyectosService,
    private disenoService: DisenoService,
    private alertas: AlertasService,
    private permissionService: PermissionService,
    private exportService: ExportService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private talleresService: TalleresService,
    private muestrasService: MuestrasService,
    private despachoService: DespachoService
  ) { }

  ngOnInit(): void {
    const estado = (this.proyecto?.estado || '').trim();
    if (!estado || estado === 'Pendiente') {
      this.tabActiva = 'info';
    }
    // Seleccionar área actual por defecto
    this.areaSeleccionada = getAreaActual(this.proyecto) || AREAS_PRODUCCION[0];
    this.refrescarHistorialInspeccionesCalidad();
    this.refrescarHistorialPlanesCorte();
    this.inicializarFormularioCorte();
    this.refrescarHistorialCorteReal();
    this.inicializarFormularioCorteReal();
    this.recalcularSeguimientoTalles();
    this.refrescarHistorialConfeccion();
    this.inicializarFormularioConfeccion();
    this.refrescarHistorialRecepcionesConfeccion();
    this.recalcularRecepcionesConfeccion();
    this.inicializarResumenDisenoPrendas();
    this.cargarTalleres();
    this.cargarDisenoArea();
  }

  // ==================== GETTERS ====================

  get areaActual(): AreaProduccion | undefined {
    return getAreaActual(this.proyecto);
  }

  get siguienteArea(): AreaProduccion | undefined {
    return this.areaActual ? getSiguienteArea(this.areaActual) : undefined;
  }

  get esUltimaArea(): boolean {
    return this.areaSeleccionada?.id === AREAS_PRODUCCION[AREAS_PRODUCCION.length - 1].id;
  }

  get areaAnterior(): AreaProduccion | undefined {
    if (!this.areaActual) return undefined;
    const indice = AREAS_PRODUCCION.findIndex(a => a.id === this.areaActual!.id);
    return indice > 0 ? AREAS_PRODUCCION[indice - 1] : undefined;
  }

  getAvanceArea(area: AreaProduccion): number {
    return (this.proyecto as any)[area.campo] ?? 0;
  }

  estaCompleta(area: AreaProduccion): boolean {
    return areaEstaCompleta(this.proyecto, area);
  }

  enProgreso(area: AreaProduccion): boolean {
    return areaEnProgreso(this.proyecto, area);
  }

  pendiente(area: AreaProduccion): boolean {
    return areaPendiente(this.proyecto, area);
  }

  // ==================== MÉTODOS DE ÁREAS ====================

  seleccionarArea(area: AreaProduccion): void {
    this.areaSeleccionada = area;
    this.observacionArea = '';
    this.reiniciarFormularioCalidad();
    this.refrescarHistorialInspeccionesCalidad();
    this.refrescarHistorialPlanesCorte();
    this.inicializarFormularioCorte();
    this.refrescarHistorialCorteReal();
    this.inicializarFormularioCorteReal();
    this.recalcularSeguimientoTalles();
    this.refrescarHistorialConfeccion();
    this.inicializarFormularioConfeccion();
    this.refrescarHistorialRecepcionesConfeccion();
    this.recalcularRecepcionesConfeccion();
    if (area.campo === 'avanceDiseno' && !this.disenoPrendas.length) {
      this.cargarDisenoArea();
    }
  }

  async sincronizarConMuestra(): Promise<void> {
    if (!this.proyecto.idMuestra || this.loadingSync) return;

    const confirmar = await this.alertas.confirmar(
      'Sincronizar Diseño',
      '¿Deseas importar los mockups y descripciones de la muestra asociada? Esto sobrescribirá los datos actuales de diseño.'
    );

    if (!confirmar) return;

    this.loadingSync = true;
    this.muestrasService.sincronizarDiseno(this.proyecto.idMuestra).subscribe({
      next: () => {
        this.alertas.toast('Diseño sincronizado correctamente');
        this.cargarDisenoArea(); // Recargar los datos para mostrar los nuevos mockups
        this.loadingSync = false;
      },
      error: (err: any) => {
        this.alertas.error('Error de sincronización', err?.message || 'No se pudo sincronizar el diseño.');
        this.loadingSync = false;
      }
    });
  }

  puedeRetrocederArea(): boolean {
    return this.getUltimaAreaCompleta() !== undefined;
  }

  get puedeGestionarAvance(): boolean {
    return this.proyecto?.estado === 'En Proceso';
  }

  get esAreaControlCalidad(): boolean {
    return this.areaSeleccionada?.campo === 'avanceCalidadPrenda';
  }

  get esAreaCorte(): boolean {
    return this.areaSeleccionada?.campo === 'avanceCorte';
  }

  get esAreaConfeccion(): boolean {
    return this.areaSeleccionada?.campo === 'avanceConfeccion';
  }

  get esAreaDiseno(): boolean {
    return this.areaSeleccionada?.campo === 'avanceDiseno';
  }

  get criteriosEvaluados(): number {
    return this.criteriosCalidad.filter(c => c.resultado !== 'pendiente').length;
  }

  get criteriosNoCumplen(): number {
    return this.criteriosCalidad.filter(c => c.resultado === 'no_cumple').length;
  }

  get criteriosNoAplica(): number {
    return this.criteriosCalidad.filter(c => c.resultado === 'no_aplica').length;
  }

  get criteriosCumplen(): number {
    return this.criteriosCalidad.filter(c => c.resultado === 'cumple').length;
  }

  get historialInspeccionesCalidad(): ObservacionProyecto[] {
    return this._historialInspeccionesCalidad;
  }

  get historialPlanesCorte(): ObservacionProyecto[] {
    return this._historialPlanesCorte;
  }

  get historialCortesReales(): ObservacionProyecto[] {
    return this._historialCortesReales;
  }

  get puedeEditarFormularioCalidad(): boolean {
    if (!this.esAreaControlCalidad) return false;
    if (!this.puedeGestionarAvance) return false;
    if (this.areaSeleccionada && this.estaCompleta(this.areaSeleccionada)) return false;
    const anterior = this.areaAnteriorSeleccionada;
    if (anterior && !this.estaCompleta(anterior)) return false;
    return true;
  }

  get totalDistribucionCorte(): number {
    return this.cortePlan.distribucionTalles.reduce(
      (acc: number, item: DistribucionTallePlan) => acc + (Number(item.cantidad) || 0),
      0
    );
  }

  get diferenciaDistribucionCorte(): number {
    const pedido = Math.max(0, Number(this.cortePlan.pedidoTotalPrendas) || 0);
    return pedido - this.totalDistribucionCorte;
  }

  get distribucionCorteValida(): boolean {
    return this.diferenciaDistribucionCorte === 0;
  }

  get puedeEditarFormularioCorte(): boolean {
    if (!this.esAreaCorte) return false;
    if (!this.puedeGestionarAvance) return false;
    return true;
  }

  get puedeEditarFormularioConfeccion(): boolean {
    if (!this.esAreaConfeccion) return false;
    if (!this.puedeGestionarAvance) return false;
    if (this.areaSeleccionada && this.estaCompleta(this.areaSeleccionada)) return false;
    return true;
  }

  get puedeEditarFormularioDiseno(): boolean {
    if (!this.esAreaDiseno) return false;
    if (this.areaSeleccionada && this.estaCompleta(this.areaSeleccionada)) return false;
    const estado = (this.proyecto?.estado || '').trim();
    if (estado !== 'Pendiente' && estado !== 'En Proceso') return false;
    return true;
  }

  private construirResumenDisenoPrendas(): DisenoResumenPrenda[] {
    const prendas = (this.proyecto as any)?.prendas;
    if (Array.isArray(prendas) && prendas.length > 0) {
      return prendas.map((prenda: any, index: number) => {
        const idProyectoPrenda = Number(prenda?.idProyectoPrenda ?? prenda?.idPrenda ?? index + 1);
        const talles = Array.isArray(prenda?.talles)
          ? prenda.talles.map((t: any) => ({
              nombreTalle: String(t?.nombreTalle ?? t?.idTalle ?? 'General').trim() || 'General',
              cantidad: Math.max(0, Number(t?.cantidad ?? 0))
            }))
          : [];

        return {
          idProyectoPrenda,
          nombrePrenda: String(prenda?.nombrePrenda ?? prenda?.nombreTipoPrenda ?? prenda?.nombreTipo ?? `Prenda ${index + 1}`),
          materialBase: String(prenda?.nombreMaterial ?? prenda?.colorTela ?? prenda?.materialBase ?? '').trim(),
          cantidadTotal: Math.max(0, Number(prenda?.cantidadTotal ?? 0)),
          tieneBordado: !!prenda?.tieneBordado,
          tieneEstampado: !!prenda?.tieneEstampado,
          descripcionDiseno: String(
            prenda?.descripcionDiseno ?? prenda?.['descripcionDise\u00f1o'] ?? ''
          ).trim(),
          talles
        };
      });
    }

    return [{
      idProyectoPrenda: Number(this.proyecto.idProyecto ?? 1),
      nombrePrenda: this.proyecto.tipoPrenda || 'Prenda',
      materialBase: '',
      cantidadTotal: Math.max(0, Number(this.proyecto.cantidadTotal ?? 0)),
      tieneBordado: false,
      tieneEstampado: false,
      descripcionDiseno: (this.proyecto.descripcion ?? '').trim(),
      talles: []
    }];
  }

  get historialConfeccion(): ObservacionProyecto[] {
    return this._historialConfeccion;
  }

  get planillaConfeccionLista(): boolean {
    return this.planillaConfeccionGuardada || this._historialConfeccion.length > 0;
  }

  get recepcionesConfeccion(): RecepcionConfeccionRegistro[] {
    return this._recepcionesConfeccion;
  }

  get totalRecibidoConfeccion(): number {
    return this.redondearNumero(
      Object.values(this.confeccion.recibidoPorTalle).reduce((acc, val) => acc + (Number(val) || 0), 0)
    );
  }

  get totalObjetivoConfeccion(): number {
    return this.confeccion.tallesObjetivo.reduce((acc, t) => acc + (Number(t.cantidad) || 0), 0);
  }

  get pendienteConfeccion(): number {
    return Math.max(0, this.totalObjetivoConfeccion - this.totalRecibidoConfeccion);
  }

  get estadoRecepcionConfeccion(): EstadoRecepcionConfeccion {
    if (this.totalRecibidoConfeccion <= 0) return 'PENDIENTE';
    if (this.totalRecibidoConfeccion >= this.totalObjetivoConfeccion) return 'COMPLETA';
    return 'PARCIAL';
  }

  get puedeGuardarConfeccion(): boolean {
    if (!this.esAreaConfeccion || !this.puedeEditarFormularioConfeccion) return false;
    if (!this.confeccion.idTaller) return false;
    if (!this.confeccion.fechaInicio.trim()) return false;
    if (!this.confeccion.fechaLimite.trim()) return false;
    if (!this.esRangoFechaConfeccionValido()) return false;
    return true;
  }

  get resumenCortePorTela(): { etiqueta: string; prendas: number }[] {
    const mapa = new Map<string, number>();
    (this.corteReal.detalleTelas || []).forEach(t => {
      const nombre = (t.nombreInsumo || 'Tela').trim();
      const codigo = (t.codigoTela || '').trim();
      const etiqueta = codigo ? `${nombre} (${codigo})` : nombre;
      const actual = mapa.get(etiqueta) ?? 0;
      mapa.set(etiqueta, actual + (Number(t.prendasCortadas) || 0));
    });
    return Array.from(mapa.entries()).map(([etiqueta, prendas]) => ({ etiqueta, prendas }));
  }

  get materialesTotales(): number {
    return (this.proyecto.materiales ?? []).length;
  }

  get totalMaterialAsignado(): number {
    return (this.proyecto.materiales ?? []).reduce((acc, m) => acc + (Number(m.cantidadAsignada) || 0), 0);
  }

  get totalMaterialUtilizado(): number {
    return (this.proyecto.materiales ?? []).reduce((acc, m) => acc + (Number(m.cantidadUtilizada) || 0), 0);
  }

  get totalMaterialDesperdicio(): number {
    return (this.proyecto.materiales ?? []).reduce((acc, m) => acc + (Number(m.desperdicioEstimado) || 0), 0);
  }

  get porcentajeUsoMateriales(): number | null {
    if (this.totalMaterialAsignado <= 0) return null;
    return this.redondearNumero((this.totalMaterialUtilizado / this.totalMaterialAsignado) * 100, 1);
  }

  getUsoMaterial(material: MaterialProyecto): number {
    const asignado = Number(material.cantidadAsignada) || 0;
    const usado = Number(material.cantidadUtilizada) || 0;
    if (asignado <= 0) return 0;
    return this.redondearNumero((usado / asignado) * 100, 1);
  }

  getRestanteMaterial(material: MaterialProyecto): number {
    const asignado = Number(material.cantidadAsignada) || 0;
    const usado = Number(material.cantidadUtilizada) || 0;
    return Math.max(0, this.redondearNumero(asignado - usado, 2));
  }

  get auditoriaItems(): AuditoriaItem[] {
    const observaciones = [...(this.proyecto.observaciones ?? [])];
    observaciones.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
    return observaciones.map(obs => this.construirItemAuditoria(obs));
  }

  abrirModalRecepcion(): void {
    if (!this.puedeEditarFormularioConfeccion) return;
    if (!this.planillaConfeccionLista) {
      this.alertas.warning('Planilla pendiente', 'Primero guardá la planilla de confección.');
      return;
    }
    this.recepcionActual = this.crearRecepcionVacia();
    this.mostrarModalRecepcion = true;
  }

  imprimirPlanillaConfeccion(): void {
    if (!this.planillaConfeccionLista) return;

    const telas = this.obtenerTelasProyecto()
      .map(t => t.codigoTela ? `${t.nombreInsumo} (${t.codigoTela})` : t.nombreInsumo)
      .filter(t => (t || '').trim().length > 0);

    const materiales = (this.proyecto.materiales ?? []).map(m => ({
      nombre: (m.nombreInsumo || 'Material').trim(),
      cantidad: Number(m.cantidadAsignada) || 0,
      unidad: (m.unidadMedida || '').trim()
    }));

    const datos: PlanillaConfeccionExport = {
      titulo: `Planilla Confeccion - ${this.proyecto.nombreProyecto || 'Proyecto'}`,
      proyecto: {
        codigo: (this.proyecto.codigoProyecto ?? this.proyecto.idProyecto ?? '').toString(),
        nombre: this.proyecto.nombreProyecto || '',
        cliente: this.cortePlan.cliente || (this.proyecto as any)?.clienteNombre || 'Sin definir',
        pedidoTotal: Number(this.cortePlan.pedidoTotalPrendas || this.proyecto.cantidadTotal || 0),
        prendas: this.obtenerPrendasProyecto(),
        colores: this.obtenerColoresProyecto(),
        telas
      },
      taller: {
        nombre: this.confeccion.nombreTaller || this.tallerSeleccionado?.nombreTaller || '',
        responsable: this.confeccion.responsableTaller || this.tallerSeleccionado?.responsable || '',
        telefono: this.confeccion.telefonoTaller || this.tallerSeleccionado?.telefono || '',
        email: this.confeccion.emailTaller || this.tallerSeleccionado?.email || '',
        direccion: this.confeccion.direccionTaller || this.tallerSeleccionado?.direccion || '',
        ciudad: this.confeccion.ciudadTaller || this.tallerSeleccionado?.nombreCiudad || '',
        provincia: this.confeccion.provinciaTaller || this.tallerSeleccionado?.nombreProvincia || ''
      },
      fechas: {
        inicio: this.confeccion.fechaInicio || '',
        limite: this.confeccion.fechaLimite || ''
      },
      corteResumen: this.resumenCortePorTela,
      materiales,
      instrucciones: this.confeccion.instrucciones || '',
      observaciones: this.confeccion.observaciones || '',
      disenoNotas: 'Archivos de diseno: pendiente de integracion'
    };

    try {
      this.exportService.exportarPlanillaConfeccionPDF(datos);
      this.alertas.success('Planilla exportada', 'Se genero el PDF de la planilla.');
    } catch (error) {
      console.error('Error al exportar planilla:', error);
      this.alertas.error('Error', 'No se pudo generar el PDF de la planilla.');
    }
  }

  cerrarModalRecepcion(): void {
    this.mostrarModalRecepcion = false;
  }

  get puedeGuardarPlanCorte(): boolean {
    if (!this.esAreaCorte || !this.puedeEditarFormularioCorte) return false;
    if (!this.distribucionCorteValida) return false;
    if (!this.cortePlan.fechaNecesidadCorte.trim()) return false;
    if (!this.cortePlan.versionPlanificacion.trim()) return false;
    return true;
  }

  get estadoPlanCorteLabel(): string {
    const estado = this.cortePlan.estadoPlanificacion;
    if (estado === 'BORRADOR') return 'Borrador';
    if (estado === 'CONFIRMADO') return 'Confirmado';
    return 'Enviado a diseno';
  }

  get totalTelaUsadaCorteReal(): number {
    return this.redondearNumero(
      this.corteReal.detalleTelas.reduce((acc, t) => acc + (Number(t.telaUsadaKg) || 0), 0)
    );
  }

  get balanceTelaCorteReal(): number {
    const telaUsada = this.totalTelaUsadaCorteReal;
    if (telaUsada <= 0) return 0;
    return this.redondearNumero(telaUsada - this.totalScrapCorteReal);
  }

  get desvioConsumoCorteReal(): number | null {
    const consumoTeorico = Number(this.corteReal.consumoTeoricoKg) || 0;
    const telaUsada = this.totalTelaUsadaCorteReal;
    if (consumoTeorico <= 0 || telaUsada <= 0) return null;
    return this.redondearNumero(telaUsada - consumoTeorico);
  }

  get excedeTelaUsadaCorteReal(): boolean {
    const telaUsada = this.totalTelaUsadaCorteReal;
    if (telaUsada <= 0) return false;
    return this.totalScrapCorteReal > telaUsada;
  }

  get totalScrapCorteReal(): number {
    return this.redondearNumero(
      this.corteReal.detalleTelas.reduce((acc, t) => acc + (Number(t.scrapKg) || 0), 0)
    );
  }

  get totalPrendasCorteReal(): number {
    return this.corteReal.detalleTelas.reduce((acc, t) => acc + (Number(t.prendasCortadas) || 0), 0);
  }

  get kgPorPrendaCorteReal(): number | null {
    const prendas = this.totalPrendasCorteReal;
    const telaUsada = this.totalTelaUsadaCorteReal;
    if (prendas <= 0 || telaUsada <= 0) return null;
    return this.redondearNumero(telaUsada / prendas, 3);
  }

  get puedeGuardarCorteReal(): boolean {
    if (!this.esAreaCorte || !this.puedeEditarFormularioCorte) return false;
    if (!this.corteReal.corteNumero.trim()) return false;
    if (!this.corteReal.fechaCorte.trim()) return false;
    if (!this.corteReal.responsable.trim()) return false;
    return true;
  }

  get seguimientoTalles(): SeguimientoTalle[] {
    return this._seguimientoTalles;
  }

  get totalObjetivoCalidad(): number {
    return this.seguimientoTalles.reduce((acc, t) => acc + t.objetivo, 0);
  }

  get totalGuardadoCalidad(): number {
    return this.seguimientoTalles.reduce((acc, t) => acc + t.guardado, 0);
  }

  get totalActualCalidad(): number {
    return this.seguimientoTalles.reduce((acc, t) => acc + t.actual, 0);
  }

  get totalRestanteCalidad(): number {
    return this.seguimientoTalles.reduce((acc, t) => acc + t.restante, 0);
  }

  get porcentajeCompletadoCalidad(): number {
    if (this.totalObjetivoCalidad <= 0) return 0;
    return Math.round((this.totalGuardadoCalidad / this.totalObjetivoCalidad) * 100);
  }

  get puedeGuardarInspeccionCalidad(): boolean {
    if (!this.esAreaControlCalidad) return false;
    if (!this.puedeEditarFormularioCalidad) return false;
    if (this.totalActualCalidad <= 0) return false;
    if (this.tieneExcesoEnTallesActuales) return false;
    return this.criteriosCalidad.every(c => c.resultado !== 'pendiente');
  }

  get tieneExcesoEnTallesActuales(): boolean {
    return this.seguimientoTalles.some(t => t.actual > t.restante);
  }

  get tieneCambiosInspeccionPendientes(): boolean {
    if (!this.esAreaControlCalidad) return false;
    if (this.totalActualCalidad > 0) return true;
    return this.criteriosCalidad.some(c => c.resultado !== 'pendiente' || c.observacion.trim().length > 0);
  }

  get puedeContinuarControlCalidad(): boolean {
    if (!this.esAreaControlCalidad) return true;
    if (!this.puedeEditarFormularioCalidad && this.areaSeleccionada && !this.estaCompleta(this.areaSeleccionada)) return false;
    if (this.historialInspeccionesCalidad.length === 0) return false;
    if (this.totalRestanteCalidad > 0) return false;
    if (this.tieneCambiosInspeccionPendientes) return false;
    return true;
  }

  get areaAnteriorSeleccionada(): AreaProduccion | undefined {
    if (!this.areaSeleccionada) return undefined;
    const indice = AREAS_PRODUCCION.findIndex(a => a.id === this.areaSeleccionada!.id);
    return indice > 0 ? AREAS_PRODUCCION[indice - 1] : undefined;
  }

  puedeContinuarAreaSeleccionada(): boolean {
    if (!this.areaSeleccionada || !this.puedeGestionarAvance) return false;
    if (!this.tienePermisoAreaSeleccionada()) return false;
    if (this.estaCompleta(this.areaSeleccionada)) return false;

    const anterior = this.areaAnteriorSeleccionada;
    if (!anterior) return true;

    if (!this.estaCompleta(anterior)) return false;
    if (this.esAreaDiseno) {
      return !this.validarFormularioDiseno();
    }
    if (this.esAreaConfeccion) {
      return this.totalRecibidoConfeccion >= this.totalObjetivoConfeccion;
    }
    return true;
  }

  tienePermisoAreaSeleccionada(): boolean {
    if (!this.areaSeleccionada) return false;
    if (!this.permissionService.tienePermiso('Proyectos', 'CompletarArea')) return false;

    const areasAsignadas = this.permissionService.obtenerAreasAsignadas();
    if (!areasAsignadas.length) return true;

    const areaActual = this.normalizarTexto(this.areaSeleccionada.nombre);
    return areasAsignadas.some((area) => {
      const asignada = this.normalizarTexto(area);
      return areaActual.includes(asignada) || asignada.includes(areaActual);
    });
  }

  getDisenoForm(idProyectoPrenda: number): DisenoPrendaForm {
    return this.disenoPrendasMap[idProyectoPrenda] ?? {
      idProyectoPrenda,
      imagenLogo: '',
      descripcionLogo: '',
      imagenMockup: '',
      descripcionMockup: ''
    };
  }

  getTallesDisenoTexto(prenda: DisenoResumenPrenda): string {
    if (!prenda.talles.length) return 'Sin distribución';
    return prenda.talles.map(t => `${t.nombreTalle} (${t.cantidad})`).join(', ');
  }

  necesitaLogoDiseno(prenda: DisenoResumenPrenda): boolean {
    return prenda.tieneBordado || prenda.tieneEstampado;
  }

  trackByDisenoPrenda(_: number, item: DisenoResumenPrenda): number {
    return item.idProyectoPrenda;
  }

  async onArchivoDisenoSeleccionado(event: Event, prenda: DisenoResumenPrenda, tipo: 'logo' | 'mockup'): Promise<void> {
    if (!this.puedeEditarFormularioDiseno) return;

    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const formatos = ['image/png', 'image/jpeg', 'image/jpg'];
    const maxBytes = 5 * 1024 * 1024;

    if (!formatos.includes(file.type)) {
      this.alertas.warning('Formato no válido', 'Solo se permiten imágenes JPG, JPEG o PNG.');
      input.value = '';
      return;
    }

    if (file.size > maxBytes) {
      this.alertas.warning('Archivo demasiado grande', 'La imagen no puede superar los 5 MB.');
      input.value = '';
      return;
    }

    const base64 = await this.archivoABase64(file);
    const form = this.getDisenoForm(prenda.idProyectoPrenda);

    if (tipo === 'logo') {
      form.imagenLogo = base64;
    } else {
      form.imagenMockup = base64;
    }

    input.value = '';
  }

  limpiarImagenDiseno(idProyectoPrenda: number, tipo: 'logo' | 'mockup'): void {
    if (!this.puedeEditarFormularioDiseno) return;
    const form = this.getDisenoForm(idProyectoPrenda);
    if (tipo === 'logo') {
      form.imagenLogo = '';
      form.descripcionLogo = '';
      return;
    }

    form.imagenMockup = '';
    form.descripcionMockup = '';
  }

  guardarDiseno(): Promise<boolean> {
    return new Promise((resolve) => {
      const idProyecto = Number(this.proyecto?.idProyecto);
      if (!idProyecto || Number.isNaN(idProyecto)) {
        this.alertas.error('Error', 'No se encontró el proyecto solicitado.');
        resolve(false);
        return;
      }

      const error = this.validarFormularioDiseno();
      if (error) {
        this.alertas.warning('Diseño incompleto', error);
        resolve(false);
        return;
      }

      const payload: ProyectoDisenoPayload = {
        observacionesGenerales: this.observacionArea?.trim() || this.disenoObservacionesGenerales?.trim() || undefined,
        prendas: this.disenoResumenPrendas.map(prenda => {
          const form = this.getDisenoForm(prenda.idProyectoPrenda);
          return {
            idPrenda: prenda.idProyectoPrenda,
            imagenLogo: form.imagenLogo?.trim() || undefined,
            descripcionLogo: form.descripcionLogo?.trim() || undefined,
            imagenMockup: form.imagenMockup.trim(),
            descripcionMockup: form.descripcionMockup?.trim() || undefined
          };
        })
      };

      this.guardandoDiseno = true;
      this.disenoService.guardarDiseno(idProyecto, payload).subscribe({
        next: (detalle) => {
          this.guardandoDiseno = false;
          this.disenoDetalle = detalle;
          this.disenoObservacionesGenerales = detalle.observacionesGenerales ?? this.disenoObservacionesGenerales;
          this.alertas.success('Diseño guardado', 'Se registraron las imágenes y descripciones del área.');
          resolve(true);
        },
        error: (err) => {
          this.guardandoDiseno = false;
          this.alertas.error('Error', err?.message || 'No se pudo guardar el diseño.');
          resolve(false);
        }
      });
    });
  }

  private cargarDisenoArea(): void {
    const idProyecto = Number(this.proyecto?.idProyecto);
    if (!idProyecto || Number.isNaN(idProyecto)) return;

    this.cargandoDiseno = true;

    this.disenoService.obtenerResumenProyecto(idProyecto).subscribe({
      next: (resumen) => {
        this.disenoResumenPrendas = resumen.prendas.map(prenda => ({
          idProyectoPrenda: Number(prenda.idProyectoPrenda),
          nombrePrenda: String(prenda.tipoPrenda || '').trim() || 'Prenda',
          materialBase: String(prenda.materialBase ?? '').trim(),
          cantidadTotal: Math.max(0, Number(prenda.cantidadTotal ?? 0)),
          tieneBordado: !!prenda.tieneBordado,
          tieneEstampado: !!prenda.tieneEstampado,
          descripcionDiseno: String(prenda.descripcionDiseno ?? '').trim(),
          talles: (prenda.talles || []).map(t => ({
            nombreTalle: String(t.nombreTalle ?? '').trim() || 'General',
            cantidad: Math.max(0, Number(t.cantidad ?? 0))
          }))
        }));

        this.disenoPrendas = this.disenoResumenPrendas.map(prenda => ({
          idProyectoPrenda: prenda.idProyectoPrenda,
          imagenLogo: '',
          descripcionLogo: '',
          imagenMockup: '',
          descripcionMockup: ''
        }));
        this.disenoPrendasMap = this.disenoPrendas.reduce((acc, item) => {
          acc[item.idProyectoPrenda] = item;
          return acc;
        }, {} as Record<number, DisenoPrendaForm>);

        this.disenoService.obtenerDiseno(idProyecto).subscribe({
          next: (detalle) => {
            this.disenoDetalle = detalle;
            this.disenoObservacionesGenerales = detalle.observacionesGenerales ?? '';
            detalle.prendas.forEach(item => {
              const form = this.getDisenoForm(item.idPrenda);
              form.imagenLogo = item.imagenLogo ?? '';
              form.descripcionLogo = item.descripcionLogo ?? '';
              form.imagenMockup = item.imagenMockup ?? '';
              form.descripcionMockup = item.descripcionMockup ?? '';
            });
            this.cargandoDiseno = false;
          },
          error: (err) => {
            if (err?.status !== 404) {
              console.error('Error al cargar diseño:', err);
            }
            this.disenoDetalle = null;
            this.cargandoDiseno = false;
          }
        });
      },
      error: (err) => {
        console.error('Error al cargar resumen de diseño:', err);
        this.disenoResumenPrendas = this.construirResumenDisenoPrendas();

        this.disenoPrendas = this.disenoResumenPrendas.map(prenda => ({
          idProyectoPrenda: prenda.idProyectoPrenda,
          imagenLogo: '',
          descripcionLogo: '',
          imagenMockup: '',
          descripcionMockup: ''
        }));
        this.disenoPrendasMap = this.disenoPrendas.reduce((acc, item) => {
          acc[item.idProyectoPrenda] = item;
          return acc;
        }, {} as Record<number, DisenoPrendaForm>);

        this.disenoService.obtenerDiseno(idProyecto).subscribe({
          next: (detalle) => {
            this.disenoDetalle = detalle;
            this.disenoObservacionesGenerales = detalle.observacionesGenerales ?? '';
            detalle.prendas.forEach(item => {
              const form = this.getDisenoForm(item.idPrenda);
              form.imagenLogo = item.imagenLogo ?? '';
              form.descripcionLogo = item.descripcionLogo ?? '';
              form.imagenMockup = item.imagenMockup ?? '';
              form.descripcionMockup = item.descripcionMockup ?? '';
            });
            this.cargandoDiseno = false;
          },
          error: (err2) => {
            if (err2?.status !== 404) {
              console.error('Error al cargar diseño:', err2);
            }
            this.disenoDetalle = null;
            this.cargandoDiseno = false;
          }
        });
      }
    });
  }

  private validarFormularioDiseno(): string | null {
    for (const prenda of this.disenoResumenPrendas) {
      const form = this.getDisenoForm(prenda.idProyectoPrenda);
      if (!form.imagenMockup?.trim()) {
        return `La prenda "${prenda.nombrePrenda}" necesita un mockup.`;
      }

      if (this.necesitaLogoDiseno(prenda) && !form.imagenLogo?.trim()) {
        return `La prenda "${prenda.nombrePrenda}" necesita imagen de logo porque tiene bordado o estampado.`;
      }
    }

    return null;
  }

  private archivoABase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  private inicializarResumenDisenoPrendas(): void {
    this.disenoResumenPrendas = this.construirResumenDisenoPrendas();
  }

  async continuarSiguienteArea(): Promise<void> {
    if (!this.areaSeleccionada || !this.proyecto.idProyecto) {
      console.warn('?? No se puede continuar: área o proyecto no seleccionado');
      return;
    }
    if (!this.puedeContinuarAreaSeleccionada()) {
      return;
    }

    if (!this.puedeContinuarControlCalidad) {
      this.alertas.error(
        'Control de calidad pendiente',
        'Para avanzar, completá el 100% de cantidades por talle, guardá las inspecciones y no dejes cambios pendientes.'
      );
      return;
    }

    if (this.esAreaDiseno) {
      const guardadoOk = await this.guardarDiseno();
      if (!guardadoOk) {
        return;
      }
    }

    const mensaje = this.esUltimaArea
      ? '¿Estás seguro de finalizar este proyecto?'
      : `¿Estás seguro de avanzar a ${this.siguienteArea?.nombre}?`;

    const confirmado = await this.alertas.confirmar(
      'Confirmar avance',
      mensaje,
      'Sí, continuar'
    );

    if (!confirmado) {
      console.log('? Usuario canceló la operación');
      return;
    }

    this.procesandoArea = true;
    const areaCompletada = this.areaSeleccionada;
    const siguienteDeCompletada = getSiguienteArea(areaCompletada);

    // Construir el DTO de actualización
    // ? IMPORTANTE: Enviamos IdArea (int) no Area (string)
    const dto: any = {
      idArea: areaCompletada.idArea,
      porcentaje: 100
    };

    // Agregar observaciones si existen
    if (this.observacionArea && this.observacionArea.trim()) {
      dto.observaciones = this.observacionArea.trim();
    }

    console.log('?? Enviando actualización de área:', {
      idProyecto: this.proyecto.idProyecto,
      areaSeleccionada: {
        id: areaCompletada.id,
        idArea: areaCompletada.idArea,  // ? Este es el que va al backend
        nombre: areaCompletada.nombre,
        campo: areaCompletada.campo
      },
      dto: dto,
      endpoint: `${environment.apiUrl}/Proyecto/${this.proyecto.idProyecto}/avance`
    });

    this.proyectosService.actualizarAvance(this.proyecto.idProyecto, dto).subscribe({
      next: (response) => {
        console.log('? Área actualizada correctamente:', response);

        // Actualizar el proyecto localmente
        (this.proyecto as any)[areaCompletada.campo] = 100;
        this.actualizarProgresoVisual();

        this.procesandoArea = false;
        this.observacionArea = '';
        this.actualizado.emit();
        this.registrarAuditoria(`[AVANCE_AREA] ar=${this.codificarToken(areaCompletada.nombre)} pct=100`);
        this.cdr.detectChanges();

        // Mostrar mensaje de éxito
        const mensajeExito = this.esUltimaArea
          ? '¡Área completada! Finalizando proyecto...'
          : `? ${areaCompletada.nombre} completada`;

        console.log(mensajeExito);

        // Si es la última área, marcar finalizado en UI (el backend lo persiste)
        if (this.esUltimaArea) {
          this.proyecto.estado = 'Finalizado';
          // Crear despacho automáticamente
          this.despachoService.crearDespacho({
            idProyecto: this.proyecto.idProyecto!,
            observaciones: this.observacionArea?.trim() || undefined
          }).subscribe({
            next: () => {
              this.alertas.success('Proyecto finalizado', '¡El proyecto se finalizó y fue enviado a Despacho!');
            },
            error: () => {
              this.alertas.success('Proyecto finalizado', '¡El proyecto se finalizó exitosamente!');
            }
          });
          this.cerrarModal();
        } else if (siguienteDeCompletada) {
          // Pasar a la siguiente área
          this.seleccionarArea(siguienteDeCompletada);
        }

        if (this.esAreaControlCalidad) {
          this.reiniciarFormularioCalidad();
        }
      },
      error: (err) => {
        console.error('? Error al avanzar área:', err);
        console.error('?? Detalles completos del error:', {
          status: err.status,
          statusText: err.statusText,
          error: err.error,
          message: err.message,
          url: err.url
        });

        // Intentar extraer el mensaje de error del backend
        let mensajeError = 'Error desconocido al avanzar de área';

        if (err.error) {
          if (typeof err.error === 'string') {
            mensajeError = err.error;
          } else if (err.error.message) {
            mensajeError = err.error.message;
          } else if (err.error.title) {
            mensajeError = err.error.title;
          } else if (err.error.errors) {
            // Errores de validación de ModelState
            const validationErrors = Object.values(err.error.errors).flat();
            mensajeError = validationErrors.join('\n');
          }
        } else if (err.message) {
          mensajeError = err.message;
        }

        // Agregar información adicional según el código de estado
        if (err.status === 400) {
          console.error('?? Posibles causas del error 400:');
          console.error('- El IdArea no existe en la tabla AreaProduccion');
          console.error('- El porcentaje está fuera de rango (0-100)');
          console.error('- Falta información requerida en el DTO');
          console.error('\n?? DTO enviado:', dto);
          console.error('?? IdArea enviado:', this.areaSeleccionada?.idArea);
        } else if (err.status === 404) {
          mensajeError = 'No se encontró el proyecto o el área especificada';
        } else if (err.status === 500) {
          mensajeError = 'Error interno del servidor. Por favor, contacta al administrador.';
        }

        this.alertas.error('Error al actualizar área', mensajeError);
        this.procesandoArea = false;
      }
    });
  }

  finalizarProyecto(): void {
    if (!this.proyecto.idProyecto) return;

    const dto = { estado: 'Finalizado' };

    this.proyectosService.cambiarEstado(this.proyecto.idProyecto, 'Finalizado').subscribe({
      next: () => {
        this.proyecto.estado = 'Finalizado';
        this.actualizado.emit();
        this.alertas.success('Proyecto finalizado', '¡El proyecto se finalizó exitosamente!');
        this.cerrarModal();
      },
      error: (err) => {
        console.error('Error al finalizar proyecto:', err);
        this.alertas.error('Error', 'No se pudo finalizar el proyecto');
      }
    });
  }

  async retrocederArea(): Promise<void> {
    if (!this.proyecto.idProyecto || !this.puedeRetrocederArea()) return;

    const confirmado = await this.alertas.confirmar(
      'Confirmar retroceso',
      '¿Estás seguro de volver al área anterior? Esta acción deshará el último avance completado.',
      'Sí, retroceder'
    );

    if (!confirmado) return;

    this.procesandoArea = true;

    this.proyectosService.retrocederArea(this.proyecto.idProyecto).subscribe({
      next: () => {
        const ultimaCompleta = this.getUltimaAreaCompleta();
        if (ultimaCompleta) {
          (this.proyecto as any)[ultimaCompleta.campo] = 0;
          this.seleccionarArea(ultimaCompleta);
        }

        this.proyecto.estado = this.proyecto.estado === 'Finalizado' ? 'En Proceso' : this.proyecto.estado;
        this.actualizarProgresoVisual();
        this.procesandoArea = false;
        this.actualizado.emit();
        this.registrarAuditoria(`[RETROCESO_AREA] ar=${this.codificarToken(ultimaCompleta?.nombre || 'Area')}`);
        this.cdr.detectChanges();
        this.alertas.success('Área retrocedida', 'Se volvió al área anterior correctamente');
      },
      error: (err) => {
        console.error('? Error al retroceder área:', err);
        this.procesandoArea = false;
        this.alertas.error('Error', 'No se pudo retroceder el área');
      }
    });
  }

  async archivarProyecto(): Promise<void> {
    if (!this.proyecto.idProyecto) return;

    const motivo = await this.alertas.pedirTexto(
      '¿Archivar proyecto?',
      'Escribí el motivo del archivado (se guardará en auditoría).',
      'Archivar'
    );

    if (!motivo) return;

    this.procesandoArchivo = true;

    this.proyectosService.cambiarEstado(this.proyecto.idProyecto, 'Archivado').subscribe({
      next: () => {
        console.log('? Proyecto archivado exitosamente');
        this.proyecto.estado = 'Archivado';
        this.procesandoArchivo = false;
        this.actualizado.emit();
        this.registrarAuditoria(`[ARCHIVADO] mot=${this.codificarToken(motivo)}`);
        this.alertas.success('Proyecto archivado', 'El proyecto se archivó correctamente');
        this.cerrarModal();
      },
      error: (err) => {
        console.error('? Error al archivar proyecto:', err);
        this.alertas.error('Error', 'No se pudo archivar el proyecto');
        this.procesandoArchivo = false;
      }
    });
  }

  async liberarProyecto(): Promise<void> {
    if (!this.proyecto.idProyecto) return;

    const confirmado = await this.alertas.confirmar(
      '¿Liberar proyecto?',
      `El proyecto "${this.proyecto.nombreProyecto}" volverá al estado "Pendiente" y aparecerá nuevamente en el tablero Kanban.`,
      'Sí, liberar'
    );

    if (!confirmado) return;

    this.procesandoLiberacion = true;

    this.proyectosService.cambiarEstado(this.proyecto.idProyecto, 'Pendiente').subscribe({
      next: () => {
        console.log('? Proyecto liberado exitosamente');
        this.proyecto.estado = 'Pendiente';
        this.procesandoLiberacion = false;
        this.actualizado.emit();
        this.registrarAuditoria('[LIBERADO]');
        this.alertas.success('Proyecto liberado', 'El proyecto volvió al tablero Kanban');
        this.cerrarModal();
      },
      error: (err) => {
        console.error('? Error al liberar proyecto:', err);
        this.alertas.error('Error', 'No se pudo liberar el proyecto');
        this.procesandoLiberacion = false;
      }
    });
  }

  // ==================== MÉTODOS DE OBSERVACIONES ====================

  agregarObservacion(): void {
    if (!this.nuevaObservacion.trim() || !this.proyecto.idProyecto) return;
    const idUsuario = this.obtenerIdUsuarioActual();
    if (!idUsuario) {
      this.alertas.error('Usuario requerido', 'No se pudo identificar el usuario actual.');
      return;
    }

    this.guardandoObservacion = true;

    const dto = {
      idUsuario,
      descripcion: this.nuevaObservacion.trim()
    };

    this.proyectosService.agregarObservacion(this.proyecto.idProyecto, dto).subscribe({
      next: () => {
        if (!this.proyecto.observaciones) this.proyecto.observaciones = [];
        this.proyecto.observaciones.unshift({
          idObservacion: Date.now(),
          idUsuario,
          nombreUsuario: this.obtenerNombreUsuarioActual() || 'Usuario',
          fecha: new Date().toISOString(),
          descripcion: this.nuevaObservacion.trim()
        });
        this.nuevaObservacion = '';
        this.guardandoObservacion = false;
        this.actualizado.emit();
      },
      error: (err) => {
        console.error('Error al agregar observación:', err);
        this.alertas.error('Error', 'No se pudo agregar la observación');
        this.guardandoObservacion = false;
      }
    });
  }

  // ==================== MÉTODOS AUXILIARES ====================

  getIconoEstadoArea(area: AreaProduccion): string {
    if (this.estaCompleta(area)) return 'fa-check-circle';
    if (this.enProgreso(area)) return 'fa-play-circle';
    return 'fa-circle';
  }

  getColorEstadoArea(area: AreaProduccion): string {
    if (this.estaCompleta(area)) return '#4caf50';
    if (this.enProgreso(area)) return '#ff9800';
    return '#e0e0e0';
  }

  formatearFecha(fecha?: string | null): string {
    if (!fecha) return 'Sin fecha';
    return new Date(fecha).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  async iniciarProyecto(): Promise<void> {
    if (!this.proyecto.idProyecto) return;
    if (this.proyecto.estado !== 'Pendiente') return;

    const confirmado = await this.alertas.confirmar(
      '¿Iniciar proyecto?',
      'El proyecto pasará a estado "En Proceso" y se habilitarán los avances.',
      'Sí, iniciar'
    );

    if (!confirmado) return;

    this.proyectosService.cambiarEstado(this.proyecto.idProyecto, 'En Proceso').subscribe({
      next: () => {
        this.proyecto.estado = 'En Proceso';
        this.actualizado.emit();
        this.registrarAuditoria('[INICIO_PROYECTO]');
        this.alertas.success('Proyecto iniciado', 'El proyecto quedó En Proceso.');
      },
      error: (err) => {
        console.error('Error al iniciar proyecto:', err);
        this.alertas.error('Error', 'No se pudo iniciar el proyecto');
      }
    });
  }

  cerrarModal(): void {
    this.cerrar.emit();
  }

  private getUltimaAreaCompleta(): AreaProduccion | undefined {
    for (let i = AREAS_PRODUCCION.length - 1; i >= 0; i--) {
      const area = AREAS_PRODUCCION[i];
      if (this.getAvanceArea(area) >= 100) {
        return area;
      }
    }
    return undefined;
  }

  private actualizarProgresoVisual(): void {
    (this.proyecto as any).progresoGeneral = calcularProgresoGeneralPorAreas(this.proyecto);
    this.cdr.detectChanges();
  }

  private registrarAuditoria(descripcion: string): void {
    if (!this.proyecto.idProyecto) return;
    const idUsuario = this.obtenerIdUsuarioActual();
    if (!idUsuario) return;

    const dto = { idUsuario, descripcion };
    this.proyectosService.agregarObservacion(this.proyecto.idProyecto, dto).subscribe({
      next: () => {
        if (!this.proyecto.observaciones) this.proyecto.observaciones = [];
        this.proyecto.observaciones.unshift({
          idObservacion: Date.now(),
          idUsuario,
          nombreUsuario: this.obtenerNombreUsuarioActual() || 'Sistema',
          fecha: new Date().toISOString(),
          descripcion
        });
      },
      error: (err) => {
        console.error('Error al registrar auditoria:', err);
      }
    });
  }

  private construirItemAuditoria(obs: ObservacionProyecto): AuditoriaItem {
    const descripcion = obs.descripcion ?? '';
    const tag = this.detectarTagAuditoria(descripcion);
    const tokens = this.extraerTokensAuditoria(descripcion);

    if (tag === '[CONTROL_CALIDAD]') {
      return {
        id: obs.idObservacion,
        tipo: 'Control de calidad',
        area: 'Calidad',
        detalle: `Resultado ${tokens.get('res') || 'Pendiente'} | Lote ${tokens.get('lot') || '-'} | Avance ${tokens.get('av') || '-'}`,
        usuario: obs.nombreUsuario || 'Inspector',
        fecha: obs.fecha
      };
    }

    if (tag === '[CORTE_PLAN]') {
      return {
        id: obs.idObservacion,
        tipo: 'Plan de corte',
        area: 'Corte',
        detalle: `Estado ${tokens.get('est') || 'BORRADOR'} | Pedido ${tokens.get('ped') || '-'} | Version ${tokens.get('ver') || '-'}`,
        usuario: obs.nombreUsuario || 'Corte',
        fecha: obs.fecha
      };
    }

    if (tag === '[CORTE_REAL]') {
      return {
        id: obs.idObservacion,
        tipo: 'Corte real',
        area: 'Corte',
        detalle: `Corte ${tokens.get('cn') || '-'} | Prendas ${tokens.get('pc') || '-'} | Tela ${tokens.get('tu') || '-'} kg`,
        usuario: obs.nombreUsuario || 'Corte',
        fecha: obs.fecha
      };
    }

    if (tag === '[CONFECCION]') {
      return {
        id: obs.idObservacion,
        tipo: 'Planilla confeccion',
        area: 'Confeccion',
        detalle: `Taller ${tokens.get('tn') || '-'} | Fechas ${tokens.get('fi') || '-'} - ${tokens.get('fl') || '-'}`,
        usuario: obs.nombreUsuario || 'Confeccion',
        fecha: obs.fecha
      };
    }

    if (tag === '[CONFECCION_REC]') {
      return {
        id: obs.idObservacion,
        tipo: 'Recepcion confeccion',
        area: 'Confeccion',
        detalle: `Responsable ${tokens.get('rr') || '-'} | Total ${tokens.get('rt') || '-'}`,
        usuario: obs.nombreUsuario || 'Confeccion',
        fecha: obs.fecha
      };
    }

    if (tag === '[ARCHIVADO]') {
      return {
        id: obs.idObservacion,
        tipo: 'Archivado',
        area: 'Proyecto',
        detalle: tokens.get('mot') ? `Motivo: ${tokens.get('mot')}` : 'Proyecto archivado',
        usuario: obs.nombreUsuario || 'Sistema',
        fecha: obs.fecha
      };
    }

    if (tag === '[LIBERADO]') {
      return {
        id: obs.idObservacion,
        tipo: 'Liberado',
        area: 'Proyecto',
        detalle: 'Proyecto liberado y vuelto a Pendiente.',
        usuario: obs.nombreUsuario || 'Sistema',
        fecha: obs.fecha
      };
    }

    if (tag === '[INICIO_PROYECTO]') {
      return {
        id: obs.idObservacion,
        tipo: 'Inicio',
        area: 'Proyecto',
        detalle: 'Proyecto iniciado (En Proceso).',
        usuario: obs.nombreUsuario || 'Sistema',
        fecha: obs.fecha
      };
    }

    if (tag === '[AVANCE_AREA]') {
      return {
        id: obs.idObservacion,
        tipo: 'Avance de area',
        area: tokens.get('ar') || 'Produccion',
        detalle: `Area completada al ${tokens.get('pct') || '100'}%`,
        usuario: obs.nombreUsuario || 'Sistema',
        fecha: obs.fecha
      };
    }

    if (tag === '[RETROCESO_AREA]') {
      return {
        id: obs.idObservacion,
        tipo: 'Retroceso de area',
        area: tokens.get('ar') || 'Produccion',
        detalle: 'Se retrocedio el avance de area.',
        usuario: obs.nombreUsuario || 'Sistema',
        fecha: obs.fecha
      };
    }

    return {
      id: obs.idObservacion,
      tipo: 'Observacion',
      area: 'General',
      detalle: descripcion || 'Sin detalle',
      usuario: obs.nombreUsuario || 'Usuario',
      fecha: obs.fecha
    };
  }

  private detectarTagAuditoria(descripcion: string): string | null {
    const tags = [
      '[CONTROL_CALIDAD]',
      '[CORTE_PLAN]',
      '[CORTE_REAL]',
      '[CONFECCION]',
      '[CONFECCION_REC]',
      '[ARCHIVADO]',
      '[LIBERADO]',
      '[INICIO_PROYECTO]',
      '[AVANCE_AREA]',
      '[RETROCESO_AREA]'
    ];
    return tags.find(tag => descripcion.includes(tag)) ?? null;
  }

  private extraerTokensAuditoria(descripcion: string): Map<string, string> {
    const resultado = new Map<string, string>();
    const tag = this.detectarTagAuditoria(descripcion);
    if (!tag) return resultado;
    const tokens = descripcion.split(' ').slice(1);
    tokens.forEach(token => {
      const idx = token.indexOf('=');
      if (idx <= 0) return;
      const key = token.substring(0, idx);
      const value = token.substring(idx + 1);
      resultado.set(key, this.decodificarToken(value));
    });
    return resultado;
  }

  setResultadoCriterio(criterio: CriterioCalidadUI, resultado: ResultadoCriterio): void {
    criterio.resultado = resultado;
  }

  actualizarCantidadTalle(talle: string, value: number | string): void {
    const parsed = typeof value === 'number' ? value : Number(value);
    this.inspeccionPorTalleActual[talle] = Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0;
    this.recalcularSeguimientoTalles();
  }

  trackByTalle(_: number, item: SeguimientoTalle): string {
    return item.talle;
  }

  trackByCriterio(_: number, item: CriterioCalidadUI): string {
    return item.id;
  }

  trackByDistribucionCorte(index: number, _: DistribucionTallePlan): number {
    return index;
  }

  trackByDetalleTela(index: number, item: CorteRealTela): number {
    return item.idInsumo || index;
  }

  actualizarCantidadDistribucionCorte(index: number, value: number | string): void {
    const parsed = typeof value === 'number' ? value : Number(value);
    this.cortePlan.distribucionTalles[index].cantidad = Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0;
  }

  actualizarTalleDistribucionCorte(index: number, value: string): void {
    this.cortePlan.distribucionTalles[index].talle = (value || '').trim().toUpperCase();
  }

  agregarFilaDistribucionCorte(): void {
    this.cortePlan.distribucionTalles.push({ talle: '', cantidad: 0 });
  }

  eliminarFilaDistribucionCorte(index: number): void {
    if (this.cortePlan.distribucionTalles.length <= 1) return;
    this.cortePlan.distribucionTalles.splice(index, 1);
  }

  guardarPlanCorte(): void {
    if (!this.proyecto.idProyecto || !this.puedeGuardarPlanCorte) return;
    const idUsuario = this.obtenerIdUsuarioActual();
    if (!idUsuario) {
      this.alertas.error('Usuario requerido', 'No se pudo identificar el usuario actual.');
      return;
    }

    if (!this.distribucionCorteValida) {
      this.alertas.error(
        'Distribucion invalida',
        `La suma de talles debe coincidir con el pedido total. Diferencia actual: ${this.diferenciaDistribucionCorte}.`
      );
      return;
    }

    const descripcion = this.construirResumenPlanCorte();
    const dto = {
      idUsuario,
      descripcion
    };

    this.guardandoPlanCorte = true;
    this.proyectosService.agregarObservacion(this.proyecto.idProyecto, dto).subscribe({
      next: () => {
        if (!this.proyecto.observaciones) this.proyecto.observaciones = [];
        this.proyecto.observaciones.unshift({
          idObservacion: Date.now(),
          idUsuario,
          nombreUsuario: this.obtenerNombreUsuarioActual() || 'Usuario',
          fecha: new Date().toISOString(),
          descripcion: this.nuevaObservacion.trim()
        });
        if (!this.proyecto.observaciones) this.proyecto.observaciones = [];
        this.proyecto.observaciones.unshift({
          idObservacion: Date.now(),
          idUsuario,
          nombreUsuario: this.obtenerNombreUsuarioActual() || 'Corte',
          fecha: new Date().toISOString(),
          descripcion
        });
        this.guardandoPlanCorte = false;
        this.refrescarHistorialPlanesCorte();
        this.alertas.success('Plan guardado', 'Se registró el requerimiento de corte.');
      },
      error: (err) => {
        console.error('Error al guardar plan de corte:', err);
        this.guardandoPlanCorte = false;
        this.alertas.error('Error', 'No se pudo guardar el requerimiento de corte');
      }
    });
  }

  guardarCorteReal(): void {
    if (!this.proyecto.idProyecto || !this.puedeGuardarCorteReal) return;
    const idUsuario = this.obtenerIdUsuarioActual();
    if (!idUsuario) {
      this.alertas.error('Usuario requerido', 'No se pudo identificar el usuario actual.');
      return;
    }

    const descripcion = this.construirResumenCorteReal();
    const dto = {
      idUsuario,
      descripcion
    };

    this.guardandoCorteReal = true;
    this.proyectosService.agregarObservacion(this.proyecto.idProyecto, dto).subscribe({
      next: () => {
        if (!this.proyecto.observaciones) this.proyecto.observaciones = [];
        this.proyecto.observaciones.unshift({
          idObservacion: Date.now(),
          idUsuario,
          nombreUsuario: this.obtenerNombreUsuarioActual() || 'Usuario',
          fecha: new Date().toISOString(),
          descripcion: this.nuevaObservacion.trim()
        });
        if (!this.proyecto.observaciones) this.proyecto.observaciones = [];
        this.proyecto.observaciones.unshift({
          idObservacion: Date.now(),
          idUsuario,
          nombreUsuario: this.obtenerNombreUsuarioActual() || 'Corte',
          fecha: new Date().toISOString(),
          descripcion
        });
        this.guardandoCorteReal = false;
        this.refrescarHistorialCorteReal();
        this.alertas.success('Corte registrado', 'Se guardó el parte de corte real.');

        // Registrar scrap en la tabla Scrap por cada tela con scrap > 0
        const telasConScrap = this.corteReal.detalleTelas.filter(t => Number(t.scrapKg) > 0 && t.idInsumo > 0);
        for (const tela of telasConScrap) {
          this.proyectosService.registrarScrap(this.proyecto.idProyecto!, {
            idInsumo: tela.idInsumo,
            cantidadScrap: Number(tela.scrapKg),
            motivo: 'Corte',
            areaOcurrencia: 'Corte'
          }).subscribe();
        }
      },
      error: (err) => {
        console.error('Error al guardar corte real:', err);
        this.guardandoCorteReal = false;
        this.alertas.error('Error', 'No se pudo guardar el parte de corte real');
      }
    });
  }

  guardarConfeccion(): void {
    if (!this.proyecto.idProyecto || !this.puedeGuardarConfeccion) return;
    const idUsuario = this.obtenerIdUsuarioActual();
    if (!idUsuario) {
      this.alertas.error('Usuario requerido', 'No se pudo identificar el usuario actual.');
      return;
    }

    const descripcion = this.construirResumenConfeccion();
    const dto = {
      idUsuario,
      descripcion
    };

    this.guardandoConfeccion = true;
    this.proyectosService.agregarObservacion(this.proyecto.idProyecto, dto).subscribe({
      next: () => {
        if (!this.proyecto.observaciones) this.proyecto.observaciones = [];
        this.proyecto.observaciones.unshift({
          idObservacion: Date.now(),
          idUsuario,
          nombreUsuario: this.obtenerNombreUsuarioActual() || 'Usuario',
          fecha: new Date().toISOString(),
          descripcion: this.nuevaObservacion.trim()
        });
        if (!this.proyecto.observaciones) this.proyecto.observaciones = [];
        this.proyecto.observaciones.unshift({
          idObservacion: Date.now(),
          idUsuario,
          nombreUsuario: this.obtenerNombreUsuarioActual() || 'Confeccion',
          fecha: new Date().toISOString(),
          descripcion
        });
        this.guardandoConfeccion = false;
        this.refrescarHistorialConfeccion();
        this.planillaConfeccionGuardada = true;
        this.alertas.success('Confeccion guardada', 'Se registraron los datos del taller y la recepcion.');
      },
      error: (err) => {
        console.error('Error al guardar confeccion:', err);
        this.guardandoConfeccion = false;
        this.alertas.error('Error', 'No se pudo guardar la confeccion.');
      }
    });
  }

  marcarRecepcionCompleta(): void {
    if (!this.puedeEditarFormularioConfeccion) return;
    this.confeccion.tallesObjetivo.forEach(t => {
      this.recepcionActual.recibidoPorTalle[t.talle] = Math.max(0, Number(t.cantidad) || 0);
    });
    if (!this.recepcionActual.fechaRecepcion) {
      this.recepcionActual.fechaRecepcion = this.obtenerFechaHoy();
    }
  }

  limpiarRecepcion(): void {
    if (!this.puedeEditarFormularioConfeccion) return;
    Object.keys(this.recepcionActual.recibidoPorTalle).forEach(key => {
      this.recepcionActual.recibidoPorTalle[key] = 0;
    });
    this.recepcionActual.fechaRecepcion = '';
  }

  actualizarRecibidoTalle(talle: string, value: number | string): void {
    if (!this.puedeEditarFormularioConfeccion) return;
    const parsed = typeof value === 'number' ? value : Number(value);
    this.recepcionActual.recibidoPorTalle[talle] = Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0;
    if (this.totalRecibidoActual() > 0 && !this.recepcionActual.fechaRecepcion) {
      this.recepcionActual.fechaRecepcion = this.obtenerFechaHoy();
    }
  }

  guardarRecepcionConfeccion(): void {
    if (!this.proyecto.idProyecto || !this.puedeEditarFormularioConfeccion) return;
    const idUsuario = this.obtenerIdUsuarioActual();
    if (!idUsuario) {
      this.alertas.error('Usuario requerido', 'No se pudo identificar el usuario actual.');
      return;
    }

    const totalActual = this.totalRecibidoActual();
    if (totalActual <= 0) {
      this.alertas.error('Recepción vacía', 'Ingresá al menos una prenda recibida.');
      return;
    }
    if (!this.recepcionActual.fechaRecepcion.trim()) {
      this.alertas.error('Fecha requerida', 'Indicá la fecha de recepción.');
      return;
    }

    const descripcion = this.construirResumenRecepcionConfeccion();
    const dto = { idUsuario, descripcion };

    this.guardandoRecepcion = true;
    this.proyectosService.agregarObservacion(this.proyecto.idProyecto, dto).subscribe({
      next: () => {
        if (!this.proyecto.observaciones) this.proyecto.observaciones = [];
        this.proyecto.observaciones.unshift({
          idObservacion: Date.now(),
          idUsuario,
          nombreUsuario: this.obtenerNombreUsuarioActual() || 'Usuario',
          fecha: new Date().toISOString(),
          descripcion: this.nuevaObservacion.trim()
        });
        if (!this.proyecto.observaciones) this.proyecto.observaciones = [];
        this.proyecto.observaciones.unshift({
          idObservacion: Date.now(),
          idUsuario,
          nombreUsuario: this.obtenerNombreUsuarioActual() || 'Recepcion',
          fecha: new Date().toISOString(),
          descripcion
        });
        this.guardandoRecepcion = false;
        this.refrescarHistorialRecepcionesConfeccion();
        this.recalcularRecepcionesConfeccion();
        this.mostrarModalRecepcion = false;

        if (this.totalRecibidoConfeccion >= this.totalObjetivoConfeccion && this.puedeContinuarAreaSeleccionada()) {
          this.continuarSiguienteArea();
        }
      },
      error: (err) => {
        console.error('Error al guardar recepcion:', err);
        this.guardandoRecepcion = false;
        this.alertas.error('Error', 'No se pudo guardar la recepción.');
      }
    });
  }

  guardarInspeccionCalidad(): void {
    if (!this.proyecto.idProyecto || !this.puedeGuardarInspeccionCalidad) return;
    const idUsuario = this.obtenerIdUsuarioActual();
    if (!idUsuario) {
      this.alertas.error('Usuario requerido', 'No se pudo identificar el usuario actual.');
      return;
    }

    const cantidadesTalle = this.obtenerCantidadesActualesFiltradas();
    if (Object.keys(cantidadesTalle).length === 0) {
      this.alertas.error('Inspección incompleta', 'Ingresá una cantidad inspeccionada en al menos un talle.');
      return;
    }

    const descripcion = this.construirResumenControlCalidad(cantidadesTalle);
    const dto = {
      idUsuario,
      descripcion
    };

    this.guardandoInspeccionCalidad = true;
    this.proyectosService.agregarObservacion(this.proyecto.idProyecto, dto).subscribe({
      next: () => {
        if (!this.proyecto.observaciones) this.proyecto.observaciones = [];
        this.proyecto.observaciones.unshift({
          idObservacion: Date.now(),
          idUsuario,
          nombreUsuario: this.obtenerNombreUsuarioActual() || 'Usuario',
          fecha: new Date().toISOString(),
          descripcion: this.nuevaObservacion.trim()
        });
        if (!this.proyecto.observaciones) this.proyecto.observaciones = [];
        this.proyecto.observaciones.unshift({
          idObservacion: Date.now(),
          idUsuario,
          nombreUsuario: this.obtenerNombreUsuarioActual() || 'Inspector',
          fecha: new Date().toISOString(),
          descripcion
        });

        this.guardandoInspeccionCalidad = false;
        this.refrescarHistorialInspeccionesCalidad();
        this.reiniciarFormularioCalidad();
        this.recalcularSeguimientoTalles();
        this.alertas.success('Inspección guardada', 'La inspección de calidad se guardó correctamente.');
      },
      error: (err) => {
        console.error('Error al guardar inspección de calidad:', err);
        this.guardandoInspeccionCalidad = false;
        this.alertas.error('Error', 'No se pudo guardar la inspección de calidad');
      }
    });
  }

  reiniciarFormularioCalidad(): void {
    this.criteriosCalidad = CRITERIOS_CALIDAD_INICIALES.map(c => ({ ...c }));
    this.inspeccionPorTalleActual = {};
    this.recalcularSeguimientoTalles();
  }

  private construirResumenControlCalidad(cantidadesTalle: Record<string, number>): string {
    const noCumplen = this.criteriosCalidad.filter(c => c.resultado === 'no_cumple');
    const noAplica = this.criteriosCalidad.filter(c => c.resultado === 'no_aplica');
    const cumplen = this.criteriosCalidad.filter(c => c.resultado === 'cumple');
    const totalLote = Object.values(cantidadesTalle).reduce((acc, val) => acc + val, 0);
    const totalAcumulado = this.totalGuardadoCalidad + totalLote;
    const estadoFinal = noCumplen.some(c => c.esCritico)
      ? 'RECHAZADA'
      : (noCumplen.length > 0 ? 'OBSERVADA' : 'APROBADA');
    const tallesJson = JSON.stringify(cantidadesTalle);
    const fallas = noCumplen.map(c => c.id).join('|');
    const resumenBase = [
      '[CONTROL_CALIDAD]',
      `res=${estadoFinal}`,
      `lot=${totalLote}`,
      `av=${totalAcumulado}/${this.totalObjetivoCalidad}`,
      `c=${cumplen.length}`,
      `nc=${noCumplen.length}`,
      `na=${noAplica.length}`,
      `f=${fallas || '-'}`,
      `tj=${tallesJson}`
    ].join(' ');

    return this.limitarLongitudObservacion(resumenBase, 200);
  }

  private crearPlanCorteVacio(): PlanCorteForm {
    return {
      cliente: '',
      prenda: '',
      articulo: '',
      prendas: [],
      pedidoTotalPrendas: 0,
      distribucionTalles: [{ talle: 'GENERAL', cantidad: 0 }],
      colores: [],
      telasAsignadas: [],
      telaAsignada: '',
      articuloTela: '',
      tallerDestino: '',
      fechaNecesidadCorte: '',
      versionPlanificacion: 'v1',
      estadoPlanificacion: 'BORRADOR',
      observacionesPlan: ''
    };
  }

  private inicializarFormularioCorte(): void {
    const base = this.crearPlanCorteVacio();
    base.cliente = this.proyecto.clienteNombre ?? (this.proyecto as any)?.nombreCliente ?? '';
    base.prendas = this.obtenerPrendasProyecto();
    base.prenda = base.prendas.join(', ');
    base.pedidoTotalPrendas = Math.max(0, Number(this.proyecto.cantidadTotal ?? 0));
    base.distribucionTalles = this.obtenerObjetivoPorTalleArray();
    base.colores = this.obtenerColoresProyecto();
    base.telasAsignadas = this.obtenerTelasProyecto().map(t => t.nombreInsumo).filter(Boolean);
    base.telaAsignada = base.telasAsignadas.join(', ');
    base.fechaNecesidadCorte = (this.proyecto.fechaInicio ?? '').toString();

    const ultimoPlan = this.obtenerUltimoPlanCorte();
    if (!ultimoPlan) {
      this.cortePlan = base;
      return;
    }

    this.cortePlan = {
      ...base,
      ...ultimoPlan,
      colores: ultimoPlan.colores.length ? ultimoPlan.colores : base.colores,
      telasAsignadas: ultimoPlan.telasAsignadas.length ? ultimoPlan.telasAsignadas : base.telasAsignadas,
      distribucionTalles: ultimoPlan.distribucionTalles.length > 0
        ? ultimoPlan.distribucionTalles
        : base.distribucionTalles
    };
  }

  private construirResumenPlanCorte(): string {
    const distribucion = this.cortePlan.distribucionTalles
      .filter(t => t.talle.trim().length > 0 && t.cantidad > 0)
      .map(t => `${this.codificarToken(t.talle)}:${t.cantidad}`)
      .join('|');

    const resumen = [
      '[CORTE_PLAN]',
      `est=${this.cortePlan.estadoPlanificacion}`,
      `ver=${this.codificarToken(this.cortePlan.versionPlanificacion)}`,
      `fec=${this.cortePlan.fechaNecesidadCorte || '-'}`,
      `ped=${Math.max(0, Number(this.cortePlan.pedidoTotalPrendas) || 0)}`,
      `cli=${this.codificarToken(this.cortePlan.cliente)}`,
      `prd=${this.codificarToken(this.cortePlan.prendas.join(', ') || '-')}`,
      `col=${this.codificarToken(this.cortePlan.colores.join(', ') || '-')}`,
      `tel=${this.codificarToken(this.cortePlan.telasAsignadas.join(', ') || '-')}`,
      `cls=${this.codificarToken(this.cortePlan.colores.join('|') || '-')}`,
      `tls=${this.codificarToken(this.cortePlan.telasAsignadas.join('|') || '-')}`,
      `dt=${distribucion || '-'}`,
      `obs=${this.codificarToken(this.cortePlan.observacionesPlan || '-')}`
    ].join(' ');

    return this.limitarLongitudObservacion(resumen, 200);
  }

  private refrescarHistorialPlanesCorte(): void {
    this._historialPlanesCorte = (this.proyecto.observaciones ?? []).filter(
      o => (o.descripcion ?? '').includes('[CORTE_PLAN]')
    );
  }

  private obtenerUltimoPlanCorte(): PlanCorteForm | null {
    if (!this._historialPlanesCorte.length) return null;
    return this.extraerPlanCorteDeObservacion(this._historialPlanesCorte[0].descripcion ?? '');
  }

  private extraerPlanCorteDeObservacion(texto: string): PlanCorteForm | null {
    if (!texto.includes('[CORTE_PLAN]')) return null;

    const tokens = texto.split(' ').slice(1);
    const map = new Map<string, string>();
    tokens.forEach(token => {
      const idx = token.indexOf('=');
      if (idx <= 0) return;
      map.set(token.substring(0, idx), token.substring(idx + 1));
    });

    const estadoRaw = map.get('est') ?? 'BORRADOR';
    const estado: EstadoPlanCorte =
      estadoRaw === 'CONFIRMADO' || estadoRaw === 'ENVIADO_DISENIO' ? estadoRaw : 'BORRADOR';

    const dtRaw = map.get('dt') ?? '-';
    const distribucionTalles: DistribucionTallePlan[] = dtRaw === '-'
      ? []
      : dtRaw
        .split('|')
        .map(pair => pair.split(':'))
        .filter(parts => parts.length === 2)
        .map(parts => ({
          talle: this.decodificarToken(parts[0]),
          cantidad: Math.max(0, Number(parts[1]) || 0)
        }))
        .filter(item => item.talle.length > 0);

    const coloresRaw = this.decodificarToken(map.get('cls') ?? map.get('col') ?? '');
    const telasRaw = this.decodificarToken(map.get('tls') ?? map.get('tel') ?? '');
    const colores = coloresRaw
      ? coloresRaw.split('|').map(c => c.trim()).filter(Boolean)
      : [];
    const telasAsignadas = telasRaw
      ? telasRaw.split('|').map(t => t.trim()).filter(Boolean)
      : [];

    const prendas = this.decodificarToken(map.get('prd') ?? '')
      .split(',')
      .map(p => p.trim())
      .filter(Boolean);

    return {
      cliente: this.decodificarToken(map.get('cli') ?? ''),
      prenda: prendas.join(', '),
      articulo: '',
      prendas,
      pedidoTotalPrendas: Math.max(0, Number(map.get('ped') ?? 0)),
      distribucionTalles,
      colores,
      telasAsignadas,
      telaAsignada: telasAsignadas.join(', '),
      articuloTela: '',
      tallerDestino: '',
      fechaNecesidadCorte: (map.get('fec') ?? '-') === '-' ? '' : (map.get('fec') ?? ''),
      versionPlanificacion: this.decodificarToken(map.get('ver') ?? 'v1'),
      estadoPlanificacion: estado,
      observacionesPlan: this.decodificarToken(map.get('obs') ?? '')
    };
  }

  private crearCorteRealVacio(): CorteRealForm {
    return {
      corteNumero: '',
      fechaCorte: '',
      partidaTela: '',
      responsable: '',
      telaUsadaKg: 0,
      pesoRealKg: 0,
      pesoTizaKg: 0,
      capas: 0,
      prendasCortadas: 0,
      restoKg: 0,
      fallaKg: 0,
      utilizableKg: 0,
      consumoTeoricoKg: 0,
      capasTeoricas: 0,
      referenciaExterna: '',
      observacionExterna: '',
      estadoEjecucion: 'PENDIENTE',
      detalleTelas: [],
      observacionesCorte: ''
    };
  }

  private inicializarFormularioCorteReal(): void {
    const base = this.crearCorteRealVacio();
    base.detalleTelas = this.obtenerTelasProyecto().map(t => ({
      idInsumo: t.idInsumo,
      nombreInsumo: t.nombreInsumo,
      codigoTela: t.codigoTela || String(t.idInsumo),
      telaUsadaKg: 0,
      prendasCortadas: 0,
      scrapKg: 0
    }));
    base.fechaCorte = this.obtenerFechaHoy();
    base.corteNumero = this.generarCorteNumero();
    base.responsable = this.obtenerNombreUsuarioActual();

    const ultimo = this.obtenerUltimoCorteReal();
    if (ultimo) {
      const detalle = ultimo.detalleTelas.length > 0 ? ultimo.detalleTelas : base.detalleTelas;
      this.corteReal = { ...base, ...ultimo, detalleTelas: detalle };
      if (!this.corteReal.corteNumero.trim()) {
        this.corteReal.corteNumero = this.generarCorteNumero();
      }
      if (!this.corteReal.fechaCorte.trim()) {
        this.corteReal.fechaCorte = this.obtenerFechaHoy();
      }
      if (!this.corteReal.responsable.trim()) {
        this.corteReal.responsable = this.obtenerNombreUsuarioActual();
      }
      return;
    }

    this.corteReal = base;
  }

  private crearConfeccionVacio(): ConfeccionForm {
    return {
      idTaller: null,
      nombreTaller: '',
      responsableTaller: '',
      telefonoTaller: '',
      emailTaller: '',
      direccionTaller: '',
      ciudadTaller: '',
      provinciaTaller: '',
      fechaInicio: '',
      fechaLimite: '',
      fechaRecepcion: '',
      responsableRecepcion: '',
      instrucciones: '',
      observaciones: '',
      tallesObjetivo: [],
      recibidoPorTalle: {}
    };
  }

  private inicializarFormularioConfeccion(): void {
    const base = this.crearConfeccionVacio();
    base.tallesObjetivo = this.obtenerObjetivoPorTalleArray();
    base.tallesObjetivo.forEach(t => {
      base.recibidoPorTalle[t.talle] = 0;
    });
    base.fechaInicio = this.obtenerFechaHoy();
    base.responsableRecepcion = this.obtenerNombreUsuarioActual();

    const ultimo = this.obtenerUltimoConfeccion();
    if (ultimo) {
      const recibido = { ...base.recibidoPorTalle, ...ultimo.recibidoPorTalle };
      this.confeccion = {
        ...base,
        ...ultimo,
        tallesObjetivo: base.tallesObjetivo,
        recibidoPorTalle: recibido
      };
      if (!this.confeccion.responsableRecepcion.trim()) {
        this.confeccion.responsableRecepcion = this.obtenerNombreUsuarioActual();
      }
    } else {
      this.confeccion = base;
    }

    this.planillaConfeccionGuardada = this._historialConfeccion.length > 0;
    this.sincronizarTallerSeleccionado();
  }

  private crearRecepcionVacia(): RecepcionConfeccionForm {
    const recibidoPorTalle: Record<string, number> = {};
    this.obtenerObjetivoPorTalleArray().forEach(t => {
      recibidoPorTalle[t.talle] = 0;
    });
    return {
      fechaRecepcion: this.obtenerFechaHoy(),
      responsableRecepcion: this.obtenerNombreUsuarioActual(),
      recibidoPorTalle
    };
  }

  private sincronizarTallerSeleccionado(): void {
    if (!this.confeccion.idTaller) {
      this.tallerSeleccionado = null;
      return;
    }
    const encontrado = this.talleres.find(t => t.idTaller === this.confeccion.idTaller);
    if (encontrado) {
      this.tallerSeleccionado = encontrado;
      this.cargarDatosTallerEnConfeccion(encontrado);
    }
  }

  seleccionarTallerConfeccion(idTaller: number | null): void {
    if (!idTaller) {
      this.confeccion.idTaller = null;
      this.tallerSeleccionado = null;
      this.cargarDatosTallerEnConfeccion(null);
      return;
    }

    const taller = this.talleres.find(t => t.idTaller === Number(idTaller)) || null;
    this.confeccion.idTaller = taller?.idTaller ?? null;
    this.tallerSeleccionado = taller;
    this.cargarDatosTallerEnConfeccion(taller);
  }

  private cargarDatosTallerEnConfeccion(taller: Taller | null): void {
    if (!taller) {
      this.confeccion.nombreTaller = '';
      this.confeccion.responsableTaller = '';
      this.confeccion.telefonoTaller = '';
      this.confeccion.emailTaller = '';
      this.confeccion.direccionTaller = '';
      this.confeccion.ciudadTaller = '';
      this.confeccion.provinciaTaller = '';
      return;
    }

    this.confeccion.nombreTaller = taller.nombreTaller ?? '';
    this.confeccion.responsableTaller = taller.responsable ?? '';
    this.confeccion.telefonoTaller = taller.telefono ?? '';
    this.confeccion.emailTaller = taller.email ?? '';
    this.confeccion.direccionTaller = taller.direccion ?? '';
    this.confeccion.ciudadTaller = taller.nombreCiudad ?? '';
    this.confeccion.provinciaTaller = taller.nombreProvincia ?? '';
  }

  private construirResumenConfeccion(): string {
    const resumen = [
      '[CONFECCION]',
      `ti=${this.confeccion.idTaller ?? '-'}`,
      `tn=${this.codificarToken(this.confeccion.nombreTaller)}`,
      `tr=${this.codificarToken(this.confeccion.responsableTaller)}`,
      `te=${this.codificarToken(this.confeccion.telefonoTaller)}`,
      `em=${this.codificarToken(this.confeccion.emailTaller)}`,
      `di=${this.codificarToken(this.confeccion.direccionTaller)}`,
      `ci=${this.codificarToken(this.confeccion.ciudadTaller)}`,
      `pr=${this.codificarToken(this.confeccion.provinciaTaller)}`,
      `fi=${this.confeccion.fechaInicio || '-'}`,
      `fl=${this.confeccion.fechaLimite || '-'}`,
      `ins=${this.codificarToken(this.confeccion.instrucciones || '-')}`,
      `obs=${this.codificarToken(this.confeccion.observaciones || '-')}`
    ].join(' ');

    return this.limitarLongitudObservacion(resumen, 200);
  }

  private refrescarHistorialConfeccion(): void {
    this._historialConfeccion = (this.proyecto.observaciones ?? []).filter(
      o => (o.descripcion ?? '').includes('[CONFECCION]')
    );
  }

  private refrescarHistorialRecepcionesConfeccion(): void {
    this._historialRecepcionesConfeccion = (this.proyecto.observaciones ?? []).filter(
      o => (o.descripcion ?? '').includes('[CONFECCION_REC]')
    );
  }

  private recalcularRecepcionesConfeccion(): void {
    const recepciones = this._historialRecepcionesConfeccion
      .map(o => this.extraerRecepcionConfeccionDeObservacion(o.descripcion ?? ''))
      .filter((r): r is RecepcionConfeccionRegistro => !!r);

    const acumulado: Record<string, number> = {};
    recepciones.forEach(r => {
      Object.entries(r.recibidoPorTalle).forEach(([talle, cantidad]) => {
        if (!acumulado[talle]) acumulado[talle] = 0;
        acumulado[talle] += Math.max(0, Number(cantidad) || 0);
      });
    });

    this._recepcionesConfeccion = recepciones;
    this.confeccion.recibidoPorTalle = acumulado;
  }

  private obtenerUltimoConfeccion(): ConfeccionForm | null {
    if (!this._historialConfeccion.length) return null;
    return this.extraerConfeccionDeObservacion(this._historialConfeccion[0].descripcion ?? '');
  }

  private extraerConfeccionDeObservacion(texto: string): ConfeccionForm | null {
    if (!texto.includes('[CONFECCION]')) return null;
    const tokens = texto.split(' ').slice(1);
    const map = new Map<string, string>();
    tokens.forEach(token => {
      const idx = token.indexOf('=');
      if (idx <= 0) return;
      map.set(token.substring(0, idx), token.substring(idx + 1));
    });

    return {
      idTaller: map.get('ti') ? Number(map.get('ti')) : null,
      nombreTaller: this.decodificarToken(map.get('tn') ?? ''),
      responsableTaller: this.decodificarToken(map.get('tr') ?? ''),
      telefonoTaller: this.decodificarToken(map.get('te') ?? ''),
      emailTaller: this.decodificarToken(map.get('em') ?? ''),
      direccionTaller: this.decodificarToken(map.get('di') ?? ''),
      ciudadTaller: this.decodificarToken(map.get('ci') ?? ''),
      provinciaTaller: this.decodificarToken(map.get('pr') ?? ''),
      fechaInicio: (map.get('fi') ?? '-') === '-' ? '' : (map.get('fi') ?? ''),
      fechaLimite: (map.get('fl') ?? '-') === '-' ? '' : (map.get('fl') ?? ''),
      fechaRecepcion: '',
      responsableRecepcion: '',
      instrucciones: this.decodificarToken(map.get('ins') ?? ''),
      observaciones: this.decodificarToken(map.get('obs') ?? ''),
      tallesObjetivo: [],
      recibidoPorTalle: {}
    };
  }

  private construirResumenRecepcionConfeccion(): string {
    const recepcionTalles = this.serializarRecepcionTalles(this.recepcionActual.recibidoPorTalle);
    const resumen = [
      '[CONFECCION_REC]',
      `fr=${this.recepcionActual.fechaRecepcion || '-'}`,
      `rr=${this.codificarToken(this.recepcionActual.responsableRecepcion || '-')}`,
      `rt=${this.totalRecibidoActual()}`,
      `rcp=${this.codificarToken(recepcionTalles || '-')}`
    ].join(' ');

    return this.limitarLongitudObservacion(resumen, 200);
  }

  private serializarRecepcionTalles(source: Record<string, number>): string {
    const entries = Object.entries(source)
      .filter(([talle, cantidad]) => talle.trim().length > 0 && Number(cantidad) > 0)
      .map(([talle, cantidad]) => `${this.codificarToken(talle)}:${Math.max(0, Number(cantidad) || 0)}`);
    return entries.join('|');
  }

  private deserializarRecepcionTalles(raw: string): Record<string, number> {
    const resultado: Record<string, number> = {};
    if (!raw) return resultado;
    raw.split('|').forEach(item => {
      const [talleRaw, cantidadRaw] = item.split(':');
      if (!talleRaw) return;
      const talle = this.decodificarToken(talleRaw);
      const cantidad = Math.max(0, Number(cantidadRaw) || 0);
      if (talle.trim()) {
        resultado[talle.trim()] = cantidad;
      }
    });
    return resultado;
  }

  private extraerRecepcionConfeccionDeObservacion(texto: string): RecepcionConfeccionRegistro | null {
    if (!texto.includes('[CONFECCION_REC]')) return null;
    const tokens = texto.split(' ').slice(1);
    const map = new Map<string, string>();
    tokens.forEach(token => {
      const idx = token.indexOf('=');
      if (idx <= 0) return;
      map.set(token.substring(0, idx), token.substring(idx + 1));
    });

    const recibidoRaw = this.decodificarToken(map.get('rcp') ?? '');
    return {
      fechaRecepcion: (map.get('fr') ?? '-') === '-' ? '' : (map.get('fr') ?? ''),
      responsableRecepcion: this.decodificarToken(map.get('rr') ?? ''),
      recibidoPorTalle: this.deserializarRecepcionTalles(recibidoRaw)
    };
  }

  private totalRecibidoActual(): number {
    return Object.values(this.recepcionActual.recibidoPorTalle).reduce((acc, val) => acc + (Number(val) || 0), 0);
  }

  private esRangoFechaConfeccionValido(): boolean {
    if (!this.confeccion.fechaInicio || !this.confeccion.fechaLimite) return true;
    return this.confeccion.fechaInicio <= this.confeccion.fechaLimite;
  }

  private cargarTalleres(): void {
    if (this.cargandoTalleres) return;
    this.cargandoTalleres = true;
    this.talleresService.obtenerTalleres().subscribe({
      next: (data) => {
        this.talleres = data || [];
        this.cargandoTalleres = false;
        this.sincronizarTallerSeleccionado();
      },
      error: (err) => {
        console.error('Error al cargar talleres:', err);
        this.cargandoTalleres = false;
        this.alertas.error('Error', 'No se pudieron cargar los talleres.');
      }
    });
  }

  private construirResumenCorteReal(): string {
    const detalleTelas = this.serializarDetalleTelas();
    const totalTela = this.totalTelaUsadaCorteReal;
    const totalScrap = this.totalScrapCorteReal;
    const totalPrendas = this.totalPrendasCorteReal;

    const resumen = [
      '[CORTE_REAL]',
      `cn=${this.codificarToken(this.corteReal.corteNumero)}`,
      `fc=${this.corteReal.fechaCorte || '-'}`,
      `tu=${totalTela}`,
      `sc=${totalScrap}`,
      `pc=${totalPrendas}`,
      `rs=${this.codificarToken(this.corteReal.responsable)}`,
      `es=${this.corteReal.estadoEjecucion}`,
      `tl=${this.codificarToken(detalleTelas || '-')}`,
      `ob=${this.codificarToken(this.corteReal.observacionesCorte || '-')}`
    ].join(' ');

    return this.limitarLongitudObservacion(resumen, 200);
  }

  private refrescarHistorialCorteReal(): void {
    this._historialCortesReales = (this.proyecto.observaciones ?? []).filter(
      o => (o.descripcion ?? '').includes('[CORTE_REAL]')
    );
  }

  private obtenerUltimoCorteReal(): CorteRealForm | null {
    if (!this._historialCortesReales.length) return null;
    return this.extraerCorteRealDeObservacion(this._historialCortesReales[0].descripcion ?? '');
  }

  private extraerCorteRealDeObservacion(texto: string): CorteRealForm | null {
    if (!texto.includes('[CORTE_REAL]')) return null;

    const tokens = texto.split(' ').slice(1);
    const map = new Map<string, string>();
    tokens.forEach(token => {
      const idx = token.indexOf('=');
      if (idx <= 0) return;
      map.set(token.substring(0, idx), token.substring(idx + 1));
    });

    const estadoRaw = map.get('es') ?? 'PENDIENTE';
    const estado: EstadoCorteReal =
      estadoRaw === 'EN_EJECUCION' || estadoRaw === 'CERRADO' ? estadoRaw : 'PENDIENTE';

    const detalleRaw = this.decodificarToken(map.get('tl') ?? '');
    const detalleTelas = this.deserializarDetalleTelas(detalleRaw);

    return {
      corteNumero: this.decodificarToken(map.get('cn') ?? ''),
      fechaCorte: (map.get('fc') ?? '-') === '-' ? '' : (map.get('fc') ?? ''),
      partidaTela: '',
      responsable: this.decodificarToken(map.get('rs') ?? ''),
      telaUsadaKg: 0,
      pesoRealKg: 0,
      pesoTizaKg: 0,
      capas: 0,
      prendasCortadas: 0,
      restoKg: 0,
      fallaKg: 0,
      utilizableKg: 0,
      consumoTeoricoKg: 0,
      capasTeoricas: 0,
      referenciaExterna: '',
      observacionExterna: '',
      estadoEjecucion: estado,
      detalleTelas,
      observacionesCorte: this.decodificarToken(map.get('ob') ?? '')
    };
  }

  private codificarToken(value: string): string {
    const clean = (value || '').trim();
    if (!clean) return '-';
    return encodeURIComponent(clean);
  }

  private decodificarToken(value: string): string {
    if (!value || value === '-') return '';
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  }

  private obtenerTextoResultadoCriterio(resultado: ResultadoCriterio): string {
    if (resultado === 'cumple') return 'Cumple';
    if (resultado === 'no_cumple') return 'No cumple';
    if (resultado === 'no_aplica') return 'No aplica';
    return 'Pendiente';
  }

  private obtenerObjetivoPorTalle(): Record<string, number> {
    if (!this.proyecto) {
      return { General: 0 };
    }
    const map: Record<string, number> = {};
    const prendas = (this.proyecto as any).prendas as any[] | undefined;

    if (Array.isArray(prendas) && prendas.length > 0) {
      prendas.forEach(prenda => {
        const talles = prenda?.talles;
        if (Array.isArray(talles)) {
          talles.forEach((t: any) => {
            const nombre = String(t?.nombreTalle ?? t?.idTalle ?? 'General').trim() || 'General';
            const cantidad = Math.max(0, Number(t?.cantidad ?? 0));
            map[nombre] = (map[nombre] ?? 0) + cantidad;
          });
        }
      });
    }

    if (Object.keys(map).length === 0) {
      map['General'] = Math.max(0, Number(this.proyecto.cantidadTotal ?? 0));
    }

    return map;
  }

  private obtenerObjetivoPorTalleArray(): DistribucionTallePlan[] {
    const mapa = this.obtenerObjetivoPorTalle();
    return Object.entries(mapa)
      .map(([talle, cantidad]) => ({
        talle: (talle || '').trim().toUpperCase(),
        cantidad: Math.max(0, Number(cantidad) || 0)
      }))
      .sort((a, b) => a.talle.localeCompare(b.talle));
  }

  private obtenerInspeccionadoGuardadoPorTalle(): Record<string, number> {
    return { ...this._acumuladoGuardadoPorTalle };
  }

  private obtenerPrendasProyecto(): string[] {
    const prendas = (this.proyecto as any)?.prendas;
    if (Array.isArray(prendas)) {
      const nombres = prendas
        .map((p: any) => (p?.nombrePrenda ?? p?.nombreTipoPrenda ?? p?.nombreTipo ?? '').trim())
        .filter((p: string) => p.length > 0);
      if (nombres.length > 0) {
        return Array.from(new Set(nombres));
      }
    }

    const fallback = (this.proyecto.tipoPrenda ?? '').trim();
    return fallback ? [fallback] : [];
  }

  private obtenerColoresProyecto(): string[] {
    const colores = new Set<string>();
    const prendas = (this.proyecto as any)?.prendas;
    if (Array.isArray(prendas)) {
      prendas.forEach((p: any) => {
        const color = (p?.colorTela ?? p?.color ?? p?.nombreMaterial ?? p?.nombreInsumo ?? '').toString().trim();
        if (color) colores.add(color);
      });
    }

    if (colores.size === 0) {
      const materiales = this.obtenerTelasProyecto();
      materiales.forEach(m => {
        const nombre = (m.nombreInsumo ?? '').trim();
        const color = (m as any)?.color ? String((m as any).color).trim() : '';
        if (color) colores.add(color);
        else if (nombre) colores.add(nombre);
      });
    }

    return Array.from(colores);
  }

  private obtenerTelasProyecto(): CorteTelaResumen[] {
    const materiales = this.proyecto.materiales ?? [];
    let telas = materiales.filter(m => (m.nombreInsumo ?? '').toLowerCase().includes('tela'));
    if (telas.length === 0) {
      telas = materiales;
    }

    const map = new Map<number, CorteTelaResumen>();
    telas.forEach((m: MaterialProyecto) => {
      if (!m?.idInsumo) return;
      if (map.has(m.idInsumo)) return;
      const nombre = (m.nombreInsumo ?? `Tela ${m.idInsumo}`).trim();
      map.set(m.idInsumo, {
        idInsumo: m.idInsumo,
        nombreInsumo: nombre,
        codigoTela: String(m.idInsumo)
      });
    });

    return Array.from(map.values());
  }

  private extraerCantidadesTalleDeObservacion(texto: string): Record<string, number> {
    const matchNuevo = texto.match(/tj=(\{.*\})/);
    const matchLegacy = texto.match(/TALLES_JSON:\s*(\{.*\})/);
    const payload = matchNuevo?.[1] ?? matchLegacy?.[1];
    if (!payload) {
      const loteLegacy = texto.match(/Lote inspeccionado:\s*(\d+)/);
      if (loteLegacy) {
        const cantidad = Math.max(0, Number(loteLegacy[1] ?? 0));
        return cantidad > 0 ? { General: cantidad } : {};
      }
      return {};
    }
    try {
      const parsed = JSON.parse(payload) as Record<string, unknown>;
      const clean: Record<string, number> = {};
      Object.entries(parsed).forEach(([key, value]) => {
        const cantidad = Math.max(0, Number(value ?? 0));
        if (cantidad > 0) clean[key] = cantidad;
      });
      return clean;
    } catch {
      return {};
    }
  }

  private obtenerCantidadesActualesFiltradas(): Record<string, number> {
    const cantidades: Record<string, number> = {};
    this.seguimientoTalles.forEach(t => {
      const cantidad = Math.max(0, Math.floor(this.inspeccionPorTalleActual[t.talle] ?? 0));
      if (cantidad > 0) {
        cantidades[t.talle] = Math.min(cantidad, t.restante);
      }
    });
    return cantidades;
  }

  private formatearCantidadesTalle(cantidades: Record<string, number>): string {
    return Object.entries(cantidades)
      .map(([talle, cantidad]) => `${talle}=${cantidad}`)
      .join(', ');
  }

  private limitarLongitudObservacion(texto: string, maxLength: number): string {
    if (texto.length <= maxLength) return texto;
    return texto.substring(0, Math.max(0, maxLength - 3)) + '...';
  }

  private obtenerFechaHoy(): string {
    const fecha = new Date();
    const y = fecha.getFullYear();
    const m = String(fecha.getMonth() + 1).padStart(2, '0');
    const d = String(fecha.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  private generarCorteNumero(): string {
    const codigo = (this.proyecto.codigoProyecto ?? this.proyecto.idProyecto ?? 'PROY').toString();
    const fecha = this.obtenerFechaHoy().replaceAll('-', '');
    const secuencia = this._historialCortesReales.length + 1;
    return `COR-${codigo}-${fecha}-${secuencia}`;
  }

  private obtenerNombreUsuarioActual(): string {
    const usuario = this.authService.obtenerUsuarioActual();
    if (!usuario) return '';
    const nombre = usuario.nombreUsuario ?? '';
    const apellido = usuario.apellidoUsuario ?? '';
    return `${nombre} ${apellido}`.trim();
  }

  private obtenerIdUsuarioActual(): number | null {
    const usuario = this.authService.obtenerUsuarioActual();
    return usuario?.idUsuario ?? null;
  }

  private serializarDetalleTelas(): string {
    if (!this.corteReal.detalleTelas.length) return '';
    return this.corteReal.detalleTelas
      .map(t => {
        const id = Number(t.idInsumo) || 0;
        const codigo = this.codificarToken(t.codigoTela || '');
        const nombre = this.codificarToken(t.nombreInsumo || '');
        const kg = Number(t.telaUsadaKg) || 0;
        const prendas = Number(t.prendasCortadas) || 0;
        const scrap = Number(t.scrapKg) || 0;
        return `${id},${codigo},${nombre},${kg},${prendas},${scrap}`;
      })
      .join('|');
  }

  private deserializarDetalleTelas(raw: string): CorteRealTela[] {
    if (!raw) return [];
    return raw
      .split('|')
      .map(item => item.split(','))
      .filter(parts => parts.length >= 6)
      .map(parts => ({
        idInsumo: Number(parts[0]) || 0,
        codigoTela: this.decodificarToken(parts[1] ?? ''),
        nombreInsumo: this.decodificarToken(parts[2] ?? ''),
        telaUsadaKg: Number(parts[3]) || 0,
        prendasCortadas: Number(parts[4]) || 0,
        scrapKg: Number(parts[5]) || 0
      }))
      .filter(t => t.idInsumo > 0 || t.nombreInsumo.length > 0);
  }

  private redondearNumero(value: number, precision = 2): number {
    const factor = Math.pow(10, precision);
    return Math.round((value + Number.EPSILON) * factor) / factor;
  }

  private normalizarTexto(valor: string): string {
    return (valor || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase();
  }

  private refrescarHistorialInspeccionesCalidad(): void {
    this._historialInspeccionesCalidad = (this.proyecto.observaciones ?? []).filter(
      o => (o.descripcion ?? '').includes('[CONTROL_CALIDAD]')
    );
    const acumulado: Record<string, number> = {};
    this._historialInspeccionesCalidad.forEach(obs => {
      const talles = this.extraerCantidadesTalleDeObservacion(obs.descripcion ?? '');
      Object.entries(talles).forEach(([talle, cantidad]) => {
        acumulado[talle] = (acumulado[talle] ?? 0) + cantidad;
      });
    });
    this._acumuladoGuardadoPorTalle = acumulado;
  }

  private recalcularSeguimientoTalles(): void {
    const objetivos = this.obtenerObjetivoPorTalle();
    const acumulado = this.obtenerInspeccionadoGuardadoPorTalle();
    const resultado: SeguimientoTalle[] = [];

    Object.keys(objetivos).forEach(talle => {
      const objetivo = objetivos[talle] ?? 0;
      const guardado = Math.min(objetivo, acumulado[talle] ?? 0);
      const actual = Math.max(0, this.inspeccionPorTalleActual[talle] ?? 0);
      const restante = Math.max(0, objetivo - guardado);
      resultado.push({ talle, objetivo, guardado, actual, restante });
    });

    this._seguimientoTalles = resultado.sort((a, b) => a.talle.localeCompare(b.talle));
  }
}

type ResultadoCriterio = 'pendiente' | 'cumple' | 'no_cumple' | 'no_aplica';

interface CriterioCalidadUI {
  id: string;
  nombre: string;
  descripcion: string;
  esCritico: boolean;
  resultado: ResultadoCriterio;
  observacion: string;
}

interface SeguimientoTalle {
  talle: string;
  objetivo: number;
  guardado: number;
  actual: number;
  restante: number;
}

type EstadoPlanCorte = 'BORRADOR' | 'CONFIRMADO' | 'ENVIADO_DISENIO';

interface DistribucionTallePlan {
  talle: string;
  cantidad: number;
}

interface PlanCorteForm {
  cliente: string;
  prenda: string;
  articulo: string;
  prendas: string[];
  pedidoTotalPrendas: number;
  distribucionTalles: DistribucionTallePlan[];
  colores: string[];
  telasAsignadas: string[];
  telaAsignada: string;
  articuloTela: string;
  tallerDestino: string;
  fechaNecesidadCorte: string;
  versionPlanificacion: string;
  estadoPlanificacion: EstadoPlanCorte;
  observacionesPlan: string;
}

interface CorteTelaResumen {
  idInsumo: number;
  nombreInsumo: string;
  codigoTela: string;
}

type EstadoCorteReal = 'PENDIENTE' | 'EN_EJECUCION' | 'CERRADO';
type EstadoRecepcionConfeccion = 'PENDIENTE' | 'PARCIAL' | 'COMPLETA';

interface CorteRealForm {
  corteNumero: string;
  fechaCorte: string;
  partidaTela: string;
  responsable: string;
  telaUsadaKg: number;
  pesoRealKg: number;
  pesoTizaKg: number;
  capas: number;
  prendasCortadas: number;
  restoKg: number;
  fallaKg: number;
  utilizableKg: number;
  consumoTeoricoKg: number;
  capasTeoricas: number;
  referenciaExterna: string;
  observacionExterna: string;
  estadoEjecucion: EstadoCorteReal;
  detalleTelas: CorteRealTela[];
  observacionesCorte: string;
}

interface CorteRealTela {
  idInsumo: number;
  nombreInsumo: string;
  codigoTela: string;
  telaUsadaKg: number;
  prendasCortadas: number;
  scrapKg: number;
}

interface ConfeccionForm {
  idTaller: number | null;
  nombreTaller: string;
  responsableTaller: string;
  telefonoTaller: string;
  emailTaller: string;
  direccionTaller: string;
  ciudadTaller: string;
  provinciaTaller: string;
  fechaInicio: string;
  fechaLimite: string;
  fechaRecepcion: string;
  responsableRecepcion: string;
  instrucciones: string;
  observaciones: string;
  tallesObjetivo: DistribucionTallePlan[];
  recibidoPorTalle: Record<string, number>;
}

interface RecepcionConfeccionForm {
  fechaRecepcion: string;
  responsableRecepcion: string;
  recibidoPorTalle: Record<string, number>;
}

interface RecepcionConfeccionRegistro extends RecepcionConfeccionForm {}

interface AuditoriaItem {
  id: number;
  tipo: string;
  area: string;
  detalle: string;
  usuario: string;
  fecha: string;
}

interface DisenoTalleResumen {
  nombreTalle: string;
  cantidad: number;
}

interface DisenoResumenPrenda {
  idProyectoPrenda: number;
  nombrePrenda: string;
  materialBase: string;
  cantidadTotal: number;
  tieneBordado: boolean;
  tieneEstampado: boolean;
  descripcionDiseno: string;
  talles: DisenoTalleResumen[];
}

interface DisenoPrendaForm {
  idProyectoPrenda: number;
  imagenLogo: string;
  descripcionLogo: string;
  imagenMockup: string;
  descripcionMockup: string;
}

const CRITERIOS_CALIDAD_INICIALES: CriterioCalidadUI[] = [
  {
    id: 'costura',
    nombre: 'Costuras firmes y sin saltos',
    descripcion: 'Verificar continuidad, resistencia y ausencia de puntadas sueltas.',
    esCritico: true,
    resultado: 'pendiente',
    observacion: ''
  },
  {
    id: 'medidas',
    nombre: 'Medidas dentro de tolerancia',
    descripcion: 'Comprobar que las medidas finales cumplan con la ficha técnica.',
    esCritico: true,
    resultado: 'pendiente',
    observacion: ''
  },
  {
    id: 'manchas',
    nombre: 'Sin manchas o contaminación',
    descripcion: 'Revisar que la prenda no tenga manchas, marcas o suciedad.',
    esCritico: true,
    resultado: 'pendiente',
    observacion: ''
  },
  {
    id: 'color',
    nombre: 'Color uniforme',
    descripcion: 'Confirmar tono uniforme y sin variaciones visibles.',
    esCritico: true,
    resultado: 'pendiente',
    observacion: ''
  },
  {
    id: 'simetria',
    nombre: 'Simetría y armado general',
    descripcion: 'Validar alineación de piezas y terminación estructural.',
    esCritico: false,
    resultado: 'pendiente',
    observacion: ''
  },
  {
    id: 'diseno',
    nombre: 'Bordado/estampado correcto',
    descripcion: 'Verificar posición, calidad visual y fijación del diseño.',
    esCritico: false,
    resultado: 'pendiente',
    observacion: ''
  },
  {
    id: 'etiqueta',
    nombre: 'Etiqueta y talle correctos',
    descripcion: 'Confirmar información de etiqueta y talle asignado.',
    esCritico: false,
    resultado: 'pendiente',
    observacion: ''
  },
  {
    id: 'acabado',
    nombre: 'Acabado final',
    descripcion: 'Revisar hilos sueltos, limpieza y planchado final.',
    esCritico: false,
    resultado: 'pendiente',
    observacion: ''
  }
];
























