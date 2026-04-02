import { Component, Input, Output, EventEmitter, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialProyecto, ObservacionProyecto, ProyectoVista, EstadoProyecto } from '../../models/proyecto.model';
import { ProyectosService } from '../../services/proyecto.service';
import { DespachoService } from '../../../despachos/services/despacho.service';
import { AlertasService } from '../../../../core/services/alertas';
import { PermissionService } from '../../../../core/services/permission.service';
import { ExportService, PlanillaConfeccionExport } from '../../../../core/services/export.service';
import { AuthService } from '../../../login/services/auth.service';
import { TalleresService } from '../../../talleres/services/talleres.service';
import { Taller } from '../../../talleres/models/taller.model';
import {
  AREAS_PRODUCCION,
  AreaProduccion,
  getAreaActual,
  getSiguienteArea,
  areaEstaCompleta,
  areaEnProgreso,
  areaPendiente
} from '../../constants/areas.constants';

@Component({
  selector: 'app-proyecto-detalle-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './proyecto-detalle-modal.component.html',
  styleUrls: ['./proyecto-detalle-modal.component.css']
})
export class ProyectoDetalleModalComponent implements OnInit {
  @Input() proyecto!: ProyectoVista;
  @Input() modoPantallaCompleta = false;
  @Output() cerrar = new EventEmitter<void>();
  @Output() actualizado = new EventEmitter<void>();

  // Tabs
  tabActiva: 'info' | 'areas' | 'materiales' | 'observaciones' = 'areas';

  // Áreas
  readonly AREAS = AREAS_PRODUCCION;
  areaSeleccionada: AreaProduccion | null = null;
  observacionArea: string = '';
  procesandoArea = false;

  // Calidad
  criteriosCalidad: CriterioCalidadUI[] = CRITERIOS_CALIDAD_INICIALES.map(c => ({ ...c }));
  inspeccionPorTalleActual: Record<string, number> = {};
  guardandoInspeccionCalidad = false;
  _historialInspeccionesCalidad: ObservacionProyecto[] = [];
  _seguimientoTalles: SeguimientoTalle[] = [];
  _acumuladoGuardadoPorTalle: Record<string, number> = {};

  // Corte
  guardandoPlanCorte = false;
  cortePlan: PlanCorteForm = this.crearPlanCorteVacio();
  _historialPlanesCorte: ObservacionProyecto[] = [];

  // Corte Real
  guardandoCorteReal = false;
  corteReal: CorteRealForm = this.crearCorteRealVacio();
  _historialCortesReales: ObservacionProyecto[] = [];

  // Confección
  confeccion: ConfeccionForm = this.crearConfeccionVacio();
  guardandoConfeccion = false;
  planillaConfeccionGuardada = false;
  _historialConfeccion: ObservacionProyecto[] = [];
  _historialRecepcionesConfeccion: ObservacionProyecto[] = [];
  _recepcionesConfeccion: RecepcionConfeccionRegistro[] = [];
  recepcionActual: RecepcionConfeccionForm = { fechaRecepcion: '', responsableRecepcion: '', recibidoPorTalle: {} };
  guardandoRecepcion = false;
  mostrarModalRecepcion = false;
  talleres: Taller[] = [];
  tallerSeleccionado: Taller | null = null;
  cargandoTalleres = false;

  // Observaciones generales
  nuevaObservacion: string = '';
  guardandoObservacion = false;

  // Archivar/Liberar proyecto
  procesandoArchivo = false;
  procesandoLiberacion = false;

  constructor(
    private proyectosService: ProyectosService,
    private despachoService: DespachoService,
    private alertas: AlertasService,
    private permissionService: PermissionService,
    private exportService: ExportService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private talleresService: TalleresService
  ) { }

  ngOnInit(): void {
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
    this.cargarTalleres();
  }

  // ==================== GETTERS (UI SYNC) ====================

  get esAreaCorte(): boolean { return this.areaSeleccionada?.id === 2; }
  get esAreaControlCalidad(): boolean { return this.areaSeleccionada?.id === 4; } // Ajustado según id de constantes
  get puedeGestionarAvance(): boolean { return this.proyecto.estado?.toLowerCase() === 'en proceso' || this.proyecto.estado?.toLowerCase() === 'activo'; }
  
  get areaActual(): AreaProduccion | undefined { return getAreaActual(this.proyecto); }
  get siguienteArea(): AreaProduccion | undefined { return this.areaActual ? getSiguienteArea(this.areaActual) : undefined; }
  get esUltimaArea(): boolean { return this.areaSeleccionada?.id === AREAS_PRODUCCION[AREAS_PRODUCCION.length - 1].id; }

  get areaAnteriorSeleccionada(): AreaProduccion | undefined {
    if (!this.areaSeleccionada) return undefined;
    const indice = AREAS_PRODUCCION.findIndex(a => a.id === this.areaSeleccionada!.id);
    return indice > 0 ? AREAS_PRODUCCION[indice - 1] : undefined;
  }

  estaCompleta(area: AreaProduccion): boolean { return areaEstaCompleta(this.proyecto, area); }
  enProgreso(area: AreaProduccion): boolean { return areaEnProgreso(this.proyecto, area); }
  pendiente(area: AreaProduccion): boolean { return areaPendiente(this.proyecto, area); }
  getAvanceArea(area: AreaProduccion): number { return (this.proyecto as any)[area.campo] ?? 0; }

  // Calidad KPIs
  get criteriosEvaluados(): number { return this.criteriosCalidad.filter(c => c.resultado !== 'pendiente').length; }
  get criteriosCumplen(): number { return this.criteriosCalidad.filter(c => c.resultado === 'cumple').length; }
  get criteriosNoCumplen(): number { return this.criteriosCalidad.filter(c => c.resultado === 'no_cumple').length; }
  get criteriosNoAplica(): number { return this.criteriosCalidad.filter(c => c.resultado === 'no_aplica').length; }
  get historialInspeccionesCalidad(): ObservacionProyecto[] { return this._historialInspeccionesCalidad; }
  get porcentajeCompletadoCalidad(): number { return Math.round(this.porcentajeCalidad); }
  
  get tieneExcesoEnTallesActuales(): boolean {
    return this.seguimientoTalles.some(t => t.actual > t.restante);
  }

  get tieneCambiosInspeccionPendientes(): boolean {
    return this.criteriosEvaluados > 0 || Object.values(this.inspeccionPorTalleActual).some(v => v > 0);
  }

  get puedeGuardarInspeccionCalidad(): boolean {
    const hayCantidades = Object.values(this.inspeccionPorTalleActual).some(v => v > 0);
    const criteriosListos = this.criteriosCalidad.every(c => c.resultado !== 'pendiente');
    return hayCantidades && criteriosListos && !this.tieneExcesoEnTallesActuales;
  }

  get puedeContinuarControlCalidad(): boolean {
    if (!this.esAreaControlCalidad) return true;
    return this._historialInspeccionesCalidad.length > 0 && !this.tieneCambiosInspeccionPendientes;
  }

  get puedeEditarFormularioCalidad(): boolean {
    if (!this.puedeGestionarAvance) return false;
    const ant = this.areaAnteriorSeleccionada;
    return !ant || this.estaCompleta(ant);
  }

  // Corte KPIs
  get totalDistribucionCorte(): number {
    return this.cortePlan.distribucionTalles.reduce((acc, t) => acc + (Number(t.cantidad) || 0), 0);
  }
  
  get historialCortesReales(): ObservacionProyecto[] { return this._historialCortesReales; }
  get balanceTelaCorteReal(): number { return Number((this.corteReal.telaUsadaKg - (this.corteReal.restoKg + this.corteReal.fallaKg + this.corteReal.utilizableKg)).toFixed(2)); }
  get kgPorPrendaCorteReal(): string | null { return this.corteReal.prendasCortadas > 0 ? (this.corteReal.pesoRealKg / this.corteReal.prendasCortadas).toFixed(3) : null; }
  get desvioConsumoCorteReal(): number | null { return this.corteReal.consumoTeoricoKg > 0 ? Number((this.corteReal.pesoRealKg - this.corteReal.consumoTeoricoKg).toFixed(2)) : null; }
  get puedeEditarFormularioCorte(): boolean { return this.puedeGestionarAvance; }
  get excedeTelaUsadaCorteReal(): boolean { return (this.corteReal.restoKg + this.corteReal.fallaKg + this.corteReal.utilizableKg) > this.corteReal.telaUsadaKg; }
  get puedeGuardarCorteReal(): boolean { return this.corteReal.prendasCortadas > 0 && this.corteReal.telaUsadaKg > 0 && !this.excedeTelaUsadaCorteReal; }

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
    this.refrescarHistorialConfeccion();
    this.refrescarHistorialRecepcionesConfeccion();
  }

  cerrarModal(): void { this.cerrar.emit(); }

  tienePermisoAreaSeleccionada(): boolean {
    if (!this.areaSeleccionada) return false;
    return this.permissionService.tienePermiso('Proyectos', 'CompletarArea') || 
           this.proyecto.idUsuarioEncargado === this.authService.obtenerUsuarioActual()?.idUsuario;
  }

  puedeContinuarAreaSeleccionada(): boolean {
    if (!this.areaSeleccionada || !this.puedeGestionarAvance) return false;
    if (!this.tienePermisoAreaSeleccionada()) return false;
    const ant = this.areaAnteriorSeleccionada;
    if (ant && !this.estaCompleta(ant)) return false;
    return true;
  }

  continuarSiguienteArea(): void {
    if (!this.areaSeleccionada || this.procesandoArea) return;
    this.procesandoArea = true;
    this.proyectosService.completarArea(this.proyecto.idProyecto!, this.areaSeleccionada.nombre, { observaciones: this.observacionArea }).subscribe({
      next: () => {
        (this.proyecto as any)[this.areaSeleccionada!.campo] = 100;
        this.procesandoArea = false;
        this.alertas.success('Área Completada', `Se avanzó correctamente desde ${this.areaSeleccionada!.nombre}.`);
        this.actualizado.emit();
        const next = this.siguienteArea;
        if (next) this.seleccionarArea(next); else this.cerrarModal();
      },
      error: () => { this.procesandoArea = false; this.alertas.error('Error', 'No se pudo completar el área.'); }
    });
  }

  puedeRetrocederArea(): boolean {
    if (!this.areaSeleccionada || this.procesandoArea || !this.puedeGestionarAvance) return false;
    return this.estaCompleta(this.areaSeleccionada) || (this.areaAnteriorSeleccionada !== undefined);
  }

  retrocederArea(): void {
    if (!this.proyecto.idProyecto || this.procesandoArea) return;
    this.alertas.confirmar('¿Deseas retroceder el estado del proyecto?', 'El avance actual se verá afectado.').then(confirm => {
      if (confirm) {
        this.procesandoArea = true;
        this.proyectosService.retrocederArea(this.proyecto.idProyecto!).subscribe({
          next: () => {
            this.procesandoArea = false;
            this.alertas.success('Estado Retrocedido', 'El proyecto ha vuelto al área anterior.');
            this.actualizado.emit();
            this.cerrarModal();
          },
          error: () => { this.procesandoArea = false; this.alertas.error('Error', 'No se pudo retroceder.'); }
        });
      }
    });
  }

  archivarProyecto(): void {
    if (!this.proyecto.idProyecto) return;
    this.alertas.confirmar('¿Estás seguro de que deseas archivar este proyecto?', 'El proyecto pasará a estado ARCHIVADO.').then(confirm => {
      if (confirm) {
        this.procesandoArchivo = true;
        this.proyectosService.eliminarProyecto(this.proyecto.idProyecto!).subscribe({
          next: () => {
            this.proyecto.estado = 'Archivado';
            this.procesandoArchivo = false;
            this.alertas.success('Proyecto archivado', 'El proyecto se ha archivado correctamente.');
            this.actualizado.emit();
          },
          error: () => { this.procesandoArchivo = false; this.alertas.error('Error', 'No se pudo archivar.'); }
        });
      }
    });
  }

  liberarProyecto(): void {
    if (!this.proyecto.idProyecto) return;
    this.alertas.confirmar('¿Deseas liberar este proyecto?', 'El proyecto volverá a estar ACTIVO.').then(confirm => {
      if (confirm) {
        this.procesandoLiberacion = true;
        this.proyectosService.cambiarEstado(this.proyecto.idProyecto!, 'En Proceso').subscribe({
          next: () => {
            this.proyecto.estado = 'En Proceso';
            this.procesandoLiberacion = false;
            this.alertas.success('Proyecto liberado', 'El proyecto vuelve a estar activo.');
            this.actualizado.emit();
          },
          error: () => { this.procesandoLiberacion = false; this.alertas.error('Error', 'No se pudo liberar.'); }
        });
      }
    });
  }

  mandarADespachoInterno(): void {
    if (!this.proyecto.idProyecto) return;
    this.alertas.confirmar('¿Enviar este proyecto a Despacho?', 'Se creará el registro de despacho y el proyecto se marcará como finalizado.').then(confirm => {
      if (confirm) {
        this.despachoService.crearDespacho({ idProyecto: this.proyecto.idProyecto!, observaciones: 'Despacho generado desde el seguimiento.' }).subscribe({
          next: () => {
            this.proyecto.estado = 'Finalizado';
            this.proyecto.areaActual = 'Finalizado';
            this.alertas.success('Enviado a Despacho', 'El proyecto ha sido movido correctamente.');
            this.actualizado.emit();
            this.cerrarModal();
          },
          error: () => { this.alertas.error('Error', 'No se pudo procesar el despacho.'); }
        });
      }
    });
  }

  agregarObservacion(): void {
    if (!this.proyecto.idProyecto || !this.nuevaObservacion.trim()) return;
    const idUsuario = this.obtenerIdUsuarioActual();
    if (!idUsuario) return;
    this.guardandoObservacion = true;
    this.proyectosService.agregarObservacion(this.proyecto.idProyecto, { idUsuario, descripcion: this.nuevaObservacion }).subscribe({
      next: () => {
        this.nuevaObservacion = '';
        this.guardandoObservacion = false;
        this.alertas.success('Observación añadida', 'Se guardó la nota correctamente.');
        this.actualizado.emit();
      },
      error: () => { this.guardandoObservacion = false; this.alertas.error('Error', 'No se pudo guardar la nota.'); }
    });
  }

  formatearFecha(fecha: any): string {
    if (!fecha) return '-';
    try { return new Date(fecha).toLocaleDateString(); } catch { return String(fecha); }
  }

  obtenerFechaHoy(): string { return new Date().toISOString().split('T')[0]; }

  // ==================== VISUAL HELPERS ====================

  getIconoEstadoArea(area: AreaProduccion): string {
    if (this.estaCompleta(area)) return 'fa-check-circle';
    if (this.enProgreso(area)) return 'fa-play-circle';
    return 'fa-circle';
  }

  getColorEstadoArea(area: AreaProduccion): string {
    if (this.estaCompleta(area)) return '#4caf50';
    if (this.enProgreso(area)) return '#2196f3';
    return '#9e9e9e';
  }

  trackByTalle(index: number, item: SeguimientoTalle): string { return item.talle; }
  trackByCriterio(index: number, item: CriterioCalidadUI): string { return item.id; }
  trackByDistribucionCorte(index: number, item: DistribucionTallePlan): string { return item.talle; }

  // ==================== LÓGICA DE FORMULARIOS ====================

  inicializarFormularioCorte(): void {
    this.cortePlan = this.crearPlanCorteVacio();
    this.cortePlan.cliente = this.proyecto.clienteNombre || '';
    this.cortePlan.prendas = this.obtenerPrendasProyecto();
    this.cortePlan.prenda = this.cortePlan.prendas[0] || '';
    this.cortePlan.pedidoTotalPrendas = this.proyecto.cantidadTotal || 0;
    this.cortePlan.distribucionTalles = this.obtenerObjetivoPorTalleArray();
    this.cortePlan.colores = this.obtenerColoresProyecto();
    this.cortePlan.telasAsignadas = this.obtenerTelasProyecto().map((t: any) => t.nombreInsumo);
    this.cortePlan.telaAsignada = this.cortePlan.telasAsignadas[0] || '';
    this.cortePlan.fechaNecesidadCorte = this.proyecto.fechaInicio ? String(this.proyecto.fechaInicio) : '';
    const ultimo = this.obtenerUltimoPlanCorte();
    if (ultimo) Object.assign(this.cortePlan, ultimo);
  }

  guardarPlanCorte(): void {
    if (!this.proyecto.idProyecto || !this.distribucionCorteValida) return;
    const idUsuario = this.obtenerIdUsuarioActual();
    if (!idUsuario) return;
    this.guardandoPlanCorte = true;
    this.proyectosService.agregarObservacion(this.proyecto.idProyecto, { idUsuario, descripcion: this.construirResumenPlanCorte() }).subscribe({
      next: () => { this.guardandoPlanCorte = false; this.refrescarHistorialPlanesCorte(); this.alertas.success('Éxito', 'Plan guardado.'); this.actualizado.emit(); },
      error: () => { this.guardandoPlanCorte = false; this.alertas.error('Error', 'No se pudo guardar.'); }
    });
  }

  inicializarFormularioCorteReal(): void {
    this.corteReal = this.crearCorteRealVacio();
    this.corteReal.corteNumero = this.generarCorteNumero();
    this.corteReal.fechaCorte = this.obtenerFechaHoy();
    this.corteReal.responsable = this.obtenerNombreUsuarioActual();
    this.corteReal.detalleTelas = this.obtenerTelasProyecto().map((t: any) => ({ ...t, telaUsadaKg: 0, prendasCortadas: 0, scrapKg: 0 }));
    const ultimo = this.obtenerUltimoCorteReal();
    if (ultimo) Object.assign(this.corteReal, ultimo);
  }

  guardarCorteReal(): void {
    if (!this.proyecto.idProyecto) return;
    const idUsuario = this.obtenerIdUsuarioActual();
    if (!idUsuario) return;
    this.guardandoCorteReal = true;
    this.proyectosService.agregarObservacion(this.proyecto.idProyecto, { idUsuario, descripcion: this.construirResumenCorteReal() }).subscribe({
      next: () => { this.guardandoCorteReal = false; this.refrescarHistorialCorteReal(); this.alertas.success('Éxito', 'Corte real guardado.'); this.actualizado.emit(); },
      error: () => { this.guardandoCorteReal = false; this.alertas.error('Error', 'No se pudo guardar.'); }
    });
  }

  inicializarFormularioConfeccion(): void {
    this.confeccion = this.crearConfeccionVacio();
    this.confeccion.tallesObjetivo = this.obtenerObjetivoPorTalleArray();
    const ultimo = this.obtenerUltimoConfeccion();
    if (ultimo) {
      Object.assign(this.confeccion, ultimo);
      this.planillaConfeccionGuardada = true;
    }
    this.sincronizarTallerSeleccionado();
  }

  guardarConfeccion(): void {
    if (!this.proyecto.idProyecto) return;
    const idUsuario = this.obtenerIdUsuarioActual();
    if (!idUsuario) return;
    this.guardandoConfeccion = true;
    this.proyectosService.agregarObservacion(this.proyecto.idProyecto, { idUsuario, descripcion: this.construirResumenConfeccion() }).subscribe({
      next: () => { this.guardandoConfeccion = false; this.refrescarHistorialConfeccion(); this.planillaConfeccionGuardada = true; this.alertas.success('Éxito', 'Confección guardada.'); this.actualizado.emit(); },
      error: () => { this.guardandoConfeccion = false; this.alertas.error('Error', 'No se pudo guardar.'); }
    });
  }

  guardarRecepcionConfeccion(): void {
    if (!this.proyecto.idProyecto || this.totalRecibidoActual() <= 0) return;
    const idUsuario = this.obtenerIdUsuarioActual();
    if (!idUsuario) return;
    this.guardandoRecepcion = true;
    this.proyectosService.agregarObservacion(this.proyecto.idProyecto, { idUsuario, descripcion: this.construirResumenRecepcionConfeccion() }).subscribe({
      next: () => { this.guardandoRecepcion = false; this.refrescarHistorialRecepcionesConfeccion(); this.recalcularRecepcionesConfeccion(); this.mostrarModalRecepcion = false; this.alertas.success('Éxito', 'Recepción guardada.'); this.actualizado.emit(); },
      error: () => { this.guardandoRecepcion = false; this.alertas.error('Error', 'No se pudo guardar.'); }
    });
  }

  inicializarFormularioCalidad(): void {
    this.criteriosCalidad = CRITERIOS_CALIDAD_INICIALES.map((c: any) => ({ ...c }));
    this.inspeccionPorTalleActual = {};
    this.obtenerObjetivoPorTalleArray().forEach((t: any) => this.inspeccionPorTalleActual[t.talle] = 0);
  }

  guardarInspeccionCalidad(): void {
    if (!this.proyecto.idProyecto) return;
    const idUsuario = this.obtenerIdUsuarioActual();
    if (!idUsuario) return;
    const cantidades = this.obtenerCantidadesActualesFiltradas();
    if (Object.keys(cantidades).length === 0) return;
    const desc = this.construirResumenControlCalidad(cantidades);
    this.guardandoInspeccionCalidad = true;
    this.proyectosService.agregarObservacion(this.proyecto.idProyecto, { idUsuario, descripcion: desc }).subscribe({
      next: () => { this.guardandoInspeccionCalidad = false; this.refrescarHistorialInspeccionesCalidad(); this.reiniciarFormularioCalidad(); this.alertas.success('Éxito', 'Control de calidad guardado.'); this.actualizado.emit(); },
      error: () => { this.guardandoInspeccionCalidad = false; this.alertas.error('Error', 'No se pudo guardar.'); }
    });
  }

  // ==================== SERIALIZACIÓN ====================

  private obtenerUltimoPlanCorte(): PlanCorteForm | null {
    if (!this._historialPlanesCorte.length) return null;
    return this.extraerPlanCorteDeObservacion(this._historialPlanesCorte[0].descripcion ?? '');
  }

  private extraerPlanCorteDeObservacion(texto: string): PlanCorteForm | null {
    if (!texto.includes('[CORTE_PLAN]')) return null;
    const map = this.parsearTokens(texto);
    return {
      cliente: this.decodificarToken(map.get('cli') ?? ''),
      prendas: this.decodificarToken(map.get('prd') ?? '').split(',').filter(Boolean),
      prenda: this.decodificarToken(map.get('pnd') ?? ''),
      articulo: this.decodificarToken(map.get('art') ?? ''),
      pedidoTotalPrendas: Number(map.get('ped') ?? 0),
      distribucionTalles: (map.get('dt') ?? '').split('|').filter(Boolean).map((s: string) => { const p = s.split(':'); return { talle: this.decodificarToken(p[0]), cantidad: Number(p[1]) }; }),
      colores: this.decodificarToken(map.get('cls') ?? '').split('|').filter(Boolean),
      telasAsignadas: this.decodificarToken(map.get('tls') ?? '').split('|').filter(Boolean),
      telaAsignada: this.decodificarToken(map.get('tla') ?? ''),
      articuloTela: this.decodificarToken(map.get('att') ?? ''),
      tallerDestino: this.decodificarToken(map.get('td') ?? ''),
      fechaNecesidadCorte: map.get('fec') ?? '',
      versionPlanificacion: this.decodificarToken(map.get('ver') ?? 'v1'),
      estadoPlanificacion: (map.get('est') as EstadoPlanCorte) || 'BORRADOR',
      observacionesPlan: this.decodificarToken(map.get('obs') ?? '')
    };
  }

  private construirResumenPlanCorte(): string {
    const dt = this.cortePlan.distribucionTalles.map((t: any) => `${this.codificarToken(t.talle)}:${t.cantidad}`).join('|');
    return ['[CORTE_PLAN]', `cli=${this.codificarToken(this.cortePlan.cliente)}`, `prd=${this.codificarToken(this.cortePlan.prendas.join(','))}`, `pnd=${this.codificarToken(this.cortePlan.prenda)}`, `art=${this.codificarToken(this.cortePlan.articulo)}`, `ped=${this.cortePlan.pedidoTotalPrendas}`, `dt=${dt}`, `cls=${this.codificarToken(this.cortePlan.colores.join('|'))}`, `tls=${this.codificarToken(this.cortePlan.telasAsignadas.join('|'))}`, `tla=${this.codificarToken(this.cortePlan.telaAsignada)}`, `att=${this.codificarToken(this.cortePlan.articuloTela)}`, `td=${this.codificarToken(this.cortePlan.tallerDestino)}`, `fec=${this.cortePlan.fechaNecesidadCorte}`, `ver=${this.codificarToken(this.cortePlan.versionPlanificacion)}`, `est=${this.cortePlan.estadoPlanificacion}`, `obs=${this.codificarToken(this.cortePlan.observacionesPlan)}`].join(' ');
  }

  private obtenerUltimoCorteReal(): CorteRealForm | null {
    if (!this._historialCortesReales.length) return null;
    return this.extraerCorteRealDeObservacion(this._historialCortesReales[0].descripcion ?? '');
  }

  private extraerCorteRealDeObservacion(texto: string): CorteRealForm | null {
    if (!texto.includes('[CORTE_REAL]')) return null;
    const map = this.parsearTokens(texto);
    return {
      corteNumero: this.decodificarToken(map.get('num') ?? ''),
      fechaCorte: map.get('fec') ?? '',
      responsable: this.decodificarToken(map.get('resp') ?? ''),
      partidaTela: this.decodificarToken(map.get('part') ?? ''),
      telaUsadaKg: Number(map.get('kg') ?? 0),
      pesoRealKg: Number(map.get('pr') ?? 0),
      pesoTizaKg: Number(map.get('ptz') ?? 0),
      capas: Number(map.get('cp') ?? 0),
      prendasCortadas: Number(map.get('pc') ?? 0),
      restoKg: Number(map.get('rt') ?? 0),
      fallaKg: Number(map.get('fl') ?? 0),
      utilizableKg: Number(map.get('ut') ?? 0),
      consumoTeoricoKg: Number(map.get('ct') ?? 0),
      capasTeoricas: Number(map.get('ctp') ?? 0),
      referenciaExterna: this.decodificarToken(map.get('re') ?? ''),
      observacionExterna: this.decodificarToken(map.get('oe') ?? ''),
      estadoEjecucion: (map.get('est') as EstadoCorteReal) || 'PENDIENTE',
      detalleTelas: this.deserializarDetalleTelas(map.get('det') ?? ''),
      observacionesCorte: this.decodificarToken(map.get('obs') ?? '')
    };
  }

  private construirResumenCorteReal(): string {
    return ['[CORTE_REAL]', `num=${this.codificarToken(this.corteReal.corteNumero)}`, `fec=${this.corteReal.fechaCorte}`, `resp=${this.codificarToken(this.corteReal.responsable)}`, `part=${this.codificarToken(this.corteReal.partidaTela)}`, `kg=${this.corteReal.telaUsadaKg}`, `pr=${this.corteReal.pesoRealKg}`, `ptz=${this.corteReal.pesoTizaKg}`, `cp=${this.corteReal.capas}`, `pc=${this.corteReal.prendasCortadas}`, `rt=${this.corteReal.restoKg}`, `fl=${this.corteReal.fallaKg}`, `ut=${this.corteReal.utilizableKg}`, `ct=${this.corteReal.consumoTeoricoKg}`, `ctp=${this.corteReal.capasTeoricas}`, `re=${this.codificarToken(this.corteReal.referenciaExterna)}`, `oe=${this.codificarToken(this.corteReal.observacionExterna)}`, `est=${this.corteReal.estadoEjecucion}`, `det=${this.serializarDetalleTelas(this.corteReal.detalleTelas)}`, `obs=${this.codificarToken(this.corteReal.observacionesCorte)}`].join(' ');
  }

  private obtenerUltimoConfeccion(): ConfeccionForm | null {
    if (!this._historialConfeccion.length) return null;
    return this.extraerConfeccionDeObservacion(this._historialConfeccion[0].descripcion ?? '');
  }

  private extraerConfeccionDeObservacion(texto: string): ConfeccionForm | null {
    if (!texto.includes('[CONFECCION]')) return null;
    const map = this.parsearTokens(texto);
    return { idTaller: map.get('id') !== '-' ? Number(map.get('id')) : null, nombreTaller: this.decodificarToken(map.get('nom') ?? ''), responsableTaller: '', telefonoTaller: '', emailTaller: '', direccionTaller: '', ciudadTaller: '', provinciaTaller: '', fechaInicio: map.get('fecI') ?? '', fechaLimite: map.get('fecL') ?? '', fechaRecepcion: '', responsableRecepcion: '', instrucciones: '', observaciones: this.decodificarToken(map.get('obs') ?? ''), tallesObjetivo: [], recibidoPorTalle: {} };
  }

  private construirResumenConfeccion(): string {
    return ['[CONFECCION]', `id=${this.confeccion.idTaller || '-'}`, `nom=${this.codificarToken(this.confeccion.nombreTaller)}`, `fecI=${this.confeccion.fechaInicio || '-'}`, `fecL=${this.confeccion.fechaLimite || '-'}`, `obs=${this.codificarToken(this.confeccion.observaciones)}`].join(' ');
  }

  private recalcularRecepcionesConfeccion(): void {
    const acc: Record<string, number> = {};
    const regs: RecepcionConfeccionRegistro[] = [];
    this._historialRecepcionesConfeccion.forEach((o: any) => { const r = this.extraerRecepcionConfeccionDeObservacion(o.descripcion ?? ''); if (r) { regs.push(r); Object.entries(r.recibidoPorTalle).forEach(([t, c]) => acc[t] = (acc[t] ?? 0) + c); } });
    this._recepcionesConfeccion = regs;
    this.confeccion.recibidoPorTalle = acc;
  }

  private extraerRecepcionConfeccionDeObservacion(texto: string): RecepcionConfeccionForm | null {
    if (!texto.includes('[RECEPCION_CONF]')) return null;
    const map = this.parsearTokens(texto);
    return { fechaRecepcion: map.get('fec') ?? '', responsableRecepcion: this.decodificarToken(map.get('resp') ?? ''), recibidoPorTalle: this.deserializarRecepcionTalles(map.get('talles') ?? '') };
  }

  private construirResumenRecepcionConfeccion(): string {
    return ['[RECEPCION_CONF]', `fec=${this.recepcionActual.fechaRecepcion}`, `resp=${this.codificarToken(this.recepcionActual.responsableRecepcion)}`, `talles=${this.serializarRecepcionTalles(this.recepcionActual.recibidoPorTalle)}`].join(' ');
  }

  private construirResumenControlCalidad(cant: Record<string, number>): string {
    return ['[CONTROL_CALIDAD]', `tj=${JSON.stringify(cant)}`].join(' ');
  }

  private parsearTokens(t: string): Map<string, string> {
    const m = new Map<string, string>();
    t.split(' ').slice(1).forEach((x: string) => { const i = x.indexOf('='); if (i > 0) m.set(x.substring(0, i), x.substring(i + 1)); });
    return m;
  }

  private codificarToken(v: any): string { const s = String(v || '').trim(); return s ? encodeURIComponent(s) : '-'; }
  private decodificarToken(v: string): string { if (!v || v === '-') return ''; try { return decodeURIComponent(v); } catch { return v; } }

  private serializarDetalleTelas(det: CorteRealTela[]): string { return det.map((d: any) => `${d.idInsumo}:${d.telaUsadaKg}:${d.prendasCortadas}:${d.scrapKg}`).join('|'); }
  private deserializarDetalleTelas(v: string): CorteRealTela[] {
    if (!v || v === '-') return [];
    const ts = this.obtenerTelasProyecto();
    return v.split('|').map((s: string) => { const p = s.split(':'); const id = Number(p[0]); const def = ts.find((x: any) => x.idInsumo === id); return { idInsumo: id, nombreInsumo: def?.nombreInsumo || '', codigoTela: def?.codigoTela || '', telaUsadaKg: Number(p[1]), prendasCortadas: Number(p[2]), scrapKg: Number(p[3]) }; });
  }

  private serializarRecepcionTalles(r: Record<string, number>): string { return Object.entries(r).map(([t, c]) => `${this.codificarToken(t)}:${c}`).join('|'); }
  private deserializarRecepcionTalles(v: string): Record<string, number> { const res: Record<string, number> = {}; if (!v || v === '-') return res; v.split('|').forEach((s: string) => { const p = s.split(':'); if (p.length === 2) res[this.decodificarToken(p[0])] = Number(p[1]); }); return res; }

  refrescarHistorialPlanesCorte(): void { this._historialPlanesCorte = (this.proyecto.observaciones ?? []).filter((o: any) => (o.descripcion ?? '').includes('[CORTE_PLAN]')); }
  refrescarHistorialCorteReal(): void { this._historialCortesReales = (this.proyecto.observaciones ?? []).filter((o: any) => (o.descripcion ?? '').includes('[CORTE_REAL]')); }
  refrescarHistorialConfeccion(): void { this._historialConfeccion = (this.proyecto.observaciones ?? []).filter((o: any) => (o.descripcion ?? '').includes('[CONFECCION]')); }
  refrescarHistorialRecepcionesConfeccion(): void { this._historialRecepcionesConfeccion = (this.proyecto.observaciones ?? []).filter((o: any) => (o.descripcion ?? '').includes('[RECEPCION_CONF]')); }
  refrescarHistorialInspeccionesCalidad(): void {
    this._historialInspeccionesCalidad = (this.proyecto.observaciones ?? []).filter((o: any) => (o.descripcion ?? '').includes('[CONTROL_CALIDAD]'));
    const acc: Record<string, number> = {};
    this._historialInspeccionesCalidad.forEach((o: any) => { const m = o.descripcion?.match(/tj=({.*?})/); if (m) { try { const j = JSON.parse(m[1]); Object.entries(j).forEach(([t, c]) => acc[t] = (acc[t] ?? 0) + (c as number)); } catch { } } });
    this._acumuladoGuardadoPorTalle = acc;
  }

  recalcularSeguimientoTalles(): void {
    const objs = this.obtenerObjetivoPorTalle();
    const acc = this._acumuladoGuardadoPorTalle;
    this._seguimientoTalles = Object.entries(objs).map(([t, o]) => ({ talle: t, objetivo: o, guardado: Math.min(o, acc[t] ?? 0), actual: Number(this.inspeccionPorTalleActual[t] || 0), restante: Math.max(0, o - (acc[t] ?? 0)) }));
  }

  private cargarTalleres(): void { this.talleresService.obtenerTalleres().subscribe({ next: (ts: any[]) => { this.talleres = ts; this.sincronizarTallerSeleccionado(); } }); }
  private sincronizarTallerSeleccionado(): void { if (this.confeccion.idTaller) this.tallerSeleccionado = this.talleres.find((t: any) => t.idTaller === this.confeccion.idTaller) || null; }
  seleccionarTallerConfeccion(id: any): void { const t = this.talleres.find((x: any) => x.idTaller === Number(id)) || null; this.confeccion.idTaller = t?.idTaller ?? null; this.confeccion.nombreTaller = t?.nombreTaller ?? ''; this.tallerSeleccionado = t; }

  reiniciarFormularioCalidad(): void { this.inicializarFormularioCalidad(); this.recalcularSeguimientoTalles(); }
  setResultadoCriterio(c: CriterioCalidadUI, r: ResultadoCriterio): void { c.resultado = r; }
  actualizarCantidadTalle(t: string, v: any): void { this.inspeccionPorTalleActual[t] = Math.max(0, Number(v) || 0); this.recalcularSeguimientoTalles(); }
  totalRecibidoActual(): number { return Object.values(this.recepcionActual.recibidoPorTalle).reduce((a, b) => a + b, 0); }

  private crearRecepcionVacia(): RecepcionConfeccionForm { return { fechaRecepcion: this.obtenerFechaHoy(), responsableRecepcion: this.obtenerNombreUsuarioActual(), recibidoPorTalle: {} }; }
  private crearPlanCorteVacio(): PlanCorteForm { return { cliente: '', prendas: [], prenda: '', articulo: '', pedidoTotalPrendas: 0, distribucionTalles: [], colores: [], telasAsignadas: [], telaAsignada: '', articuloTela: '', tallerDestino: '', fechaNecesidadCorte: '', versionPlanificacion: 'v1', estadoPlanificacion: 'BORRADOR', observacionesPlan: '' }; }
  private crearCorteRealVacio(): CorteRealForm { return { corteNumero: '', fechaCorte: '', responsable: '', partidaTela: '', telaUsadaKg: 0, pesoRealKg: 0, pesoTizaKg: 0, capas: 0, prendasCortadas: 0, restoKg: 0, fallaKg: 0, utilizableKg: 0, estadoEjecucion: 'PENDIENTE', detalleTelas: [], observacionesCorte: '', consumoTeoricoKg: 0, capasTeoricas: 0, referenciaExterna: '', observacionExterna: '' }; }
  private crearConfeccionVacio(): ConfeccionForm { return { idTaller: null, nombreTaller: '', responsableTaller: '', telefonoTaller: '', emailTaller: '', direccionTaller: '', ciudadTaller: '', provinciaTaller: '', fechaInicio: '', fechaLimite: '', fechaRecepcion: '', responsableRecepcion: '', instrucciones: '', observaciones: '', tallesObjetivo: [], recibidoPorTalle: {} }; }

  private obtenerNombreUsuarioActual(): string { return this.authService.obtenerUsuarioActual()?.nombreUsuario || 'Usuario'; }
  private obtenerIdUsuarioActual(): number | null { return this.authService.obtenerUsuarioActual()?.idUsuario || null; }
  private generarCorteNumero(): string { return `COR-${this.proyecto.codigoProyecto}-${Date.now().toString().slice(-4)}`; }
  private obtenerPrendasProyecto(): string[] { return this.proyecto.prendas?.map((p: any) => p.nombrePrenda) || []; }
  private obtenerColoresProyecto(): string[] { return [...new Set(this.proyecto.materiales?.map((m: any) => m.color).filter(Boolean) || [])]; }
  private obtenerTelasProyecto(): CorteTelaResumen[] { return (this.proyecto.materiales || []).filter((m: any) => (m.idTipoInsumo === 1 || (m.nombreTipoInsumo || '').toLowerCase().includes('tela')) && m.idInsumo).map((m: any) => ({ idInsumo: m.idInsumo!, nombreInsumo: m.nombreInsumo || 'Tela', codigoTela: m.codigoInsumo || '' })); }
  private obtenerObjetivoPorTalle(): Record<string, number> {
    const res: Record<string, number> = {};
    this.proyecto.prendas?.forEach((p: any) => Object.entries(p.detallesPorTalle || {}).forEach(([t, c]) => res[t] = (res[t] ?? 0) + Number(c)));
    if (Object.keys(res).length === 0) res['GENERAL'] = Number(this.proyecto.cantidadTotal || 0);
    return res;
  }
  private obtenerObjetivoPorTalleArray(): DistribucionTallePlan[] { return Object.entries(this.obtenerObjetivoPorTalle()).map(([t, c]) => ({ talle: t, cantidad: c })); }

  get totalObjetivoConfeccion(): number { return this.confeccion.tallesObjetivo.reduce((a, b) => a + (b.cantidad || 0), 0); }
  get totalRecibidoConfeccion(): number { return Object.values(this.confeccion.recibidoPorTalle).reduce((a, b) => a + (b || 0), 0); }
  get porcentajeConfeccion(): number { const t = this.totalObjetivoConfeccion; return t > 0 ? (this.totalRecibidoConfeccion / t) * 100 : 0; }
  get totalObjetivoCalidad(): number { return Object.values(this.obtenerObjetivoPorTalle()).reduce((a, b) => a + b, 0); }
  get totalGuardadoCalidad(): number { return Object.values(this._acumuladoGuardadoPorTalle).reduce((a, b) => a + b, 0); }
  get porcentajeCalidad(): number { const t = this.totalObjetivoCalidad; return t > 0 ? (this.totalGuardadoCalidad / t) * 100 : 0; }
  get seguimientoTalles(): SeguimientoTalle[] { return this._seguimientoTalles; }
  get diferenciaDistribucionCorte(): number { const s = this.cortePlan.distribucionTalles.reduce((a, b) => a + (Number(b.cantidad) || 0), 0); return this.cortePlan.pedidoTotalPrendas - s; }
  get distribucionCorteValida(): boolean { return this.diferenciaDistribucionCorte === 0; }

  actualizarEstadoArea(a: AreaProduccion, v: number): void {
    if (!this.proyecto.idProyecto) return;
    this.proyectosService.actualizarAvance(this.proyecto.idProyecto, { idArea: a.id, porcentaje: v }).subscribe({
      next: () => { (this.proyecto as any)[a.campo] = v; this.actualizado.emit(); },
      error: () => { this.alertas.error('Error', 'No se pudo actualizar.'); }
    });
  }

  obtenerCantidadesActualesFiltradas(): Record<string, number> {
    const res: Record<string, number> = {};
    Object.entries(this.inspeccionPorTalleActual).forEach(([t, c]) => { if (c > 0) res[t] = c; });
    return res;
  }
}

type ResultadoCriterio = 'pendiente' | 'cumple' | 'no_cumple' | 'no_aplica';
interface CriterioCalidadUI { id: string; nombre: string; descripcion: string; esCritico: boolean; resultado: ResultadoCriterio; observacion: string; }
interface SeguimientoTalle { talle: string; objetivo: number; guardado: number; actual: number; restante: number; }
type EstadoPlanCorte = 'BORRADOR' | 'CONFIRMADO' | 'ENVIADO_DISENIO';
interface DistribucionTallePlan { talle: string; cantidad: number; }
interface PlanCorteForm { cliente: string; prendas: string[]; prenda: string; articulo: string; pedidoTotalPrendas: number; distribucionTalles: DistribucionTallePlan[]; colores: string[]; telasAsignadas: string[]; telaAsignada: string; articuloTela: string; tallerDestino: string; fechaNecesidadCorte: string; versionPlanificacion: string; estadoPlanificacion: EstadoPlanCorte; observacionesPlan: string; }
interface CorteTelaResumen { idInsumo: number; nombreInsumo: string; codigoTela: string; }
type EstadoCorteReal = 'PENDIENTE' | 'EN_EJECUCION' | 'CERRADO';
type EstadoRecepcionConfeccion = 'PENDIENTE' | 'PARCIAL' | 'COMPLETA';
interface CorteRealForm { corteNumero: string; fechaCorte: string; responsable: string; partidaTela: string; telaUsadaKg: number; pesoRealKg: number; pesoTizaKg: number; capas: number; prendasCortadas: number; restoKg: number; fallaKg: number; utilizableKg: number; estadoEjecucion: EstadoCorteReal; detalleTelas: CorteRealTela[]; observacionesCorte: string; consumoTeoricoKg: number; capasTeoricas: number; referenciaExterna: string; observacionExterna: string; }
interface CorteRealTela { idInsumo: number; nombreInsumo: string; codigoTela: string; telaUsadaKg: number; prendasCortadas: number; scrapKg: number; }
interface ConfeccionForm { idTaller: number | null; nombreTaller: string; responsableTaller: string; telefonoTaller: string; emailTaller: string; direccionTaller: string; ciudadTaller: string; provinciaTaller: string; fechaInicio: string; fechaLimite: string; fechaRecepcion: string; responsableRecepcion: string; instrucciones: string; observaciones: string; tallesObjetivo: DistribucionTallePlan[]; recibidoPorTalle: Record<string, number>; }
interface RecepcionConfeccionForm { fechaRecepcion: string; responsableRecepcion: string; recibidoPorTalle: Record<string, number>; }
interface RecepcionConfeccionRegistro extends RecepcionConfeccionForm { }

const CRITERIOS_CALIDAD_INICIALES: CriterioCalidadUI[] = [
  { id: 'costura', nombre: 'Costuras firmes y sin saltos', descripcion: 'Verificar continuidad, resistencia y ausencia de puntadas sueltas.', esCritico: true, resultado: 'pendiente', observacion: '' },
  { id: 'medidas', nombre: 'Medidas dentro de tolerancia', descripcion: 'Comprobar que las medidas finales cumplan con la ficha técnica.', esCritico: true, resultado: 'pendiente', observacion: '' },
  { id: 'manchas', nombre: 'Sin manchas o contaminación', descripcion: 'Revisar que la prenda no tenga manchas, marcas o suciedad.', esCritico: true, resultado: 'pendiente', observacion: '' },
  { id: 'color', nombre: 'Color uniforme', descripcion: 'Confirmar tono uniforme y sin variaciones visibles.', esCritico: true, resultado: 'pendiente', observacion: '' },
  { id: 'simetria', nombre: 'Simetría y armado general', descripcion: 'Validar alineación de piezas y terminación estructural.', esCritico: false, resultado: 'pendiente', observacion: '' },
  { id: 'diseno', nombre: 'Bordado/estampado correcto', descripcion: 'Verificar posición, calidad visual y fijación del diseño.', esCritico: false, resultado: 'pendiente', observacion: '' },
  { id: 'etiqueta', nombre: 'Etiqueta y talle correctos', descripcion: 'Confirmar información de etiqueta y talle asignado.', esCritico: false, resultado: 'pendiente', observacion: '' },
  { id: 'acabado', nombre: 'Acabado final', descripcion: 'Revisar hilos sueltos, limpieza y planchado final.', esCritico: false, resultado: 'pendiente', observacion: '' }
];
