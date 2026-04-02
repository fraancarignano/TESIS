import { Component, Input, Output, EventEmitter, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ObservacionProyecto, ProyectoVista } from '../../models/proyecto.model';
import { ProyectosService } from '../../services/proyecto.service';
import { DespachoService } from '../../../despachos/services/despacho.service';
import { AlertasService } from '../../../../core/services/alertas';
import { PermissionService } from '../../../../core/services/permission.service';
import { environment } from '../../../../../environments/environment';
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
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    // Seleccionar área actual por defecto
    this.areaSeleccionada = getAreaActual(this.proyecto) || AREAS_PRODUCCION[0];
    this.refrescarHistorialInspeccionesCalidad();
    this.refrescarHistorialPlanesCorte();
    this.inicializarFormularioCorte();
    this.refrescarHistorialCorteReal();
    this.inicializarFormularioCorteReal();
    this.recalcularSeguimientoTalles();
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
    return this.cortePlan.distribucionTalles.reduce((acc, item) => acc + (Number(item.cantidad) || 0), 0);
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
    if (this.areaSeleccionada && this.estaCompleta(this.areaSeleccionada)) return false;
    return true;
  }

  get puedeGuardarPlanCorte(): boolean {
    if (!this.esAreaCorte || !this.puedeEditarFormularioCorte) return false;
    if (!this.distribucionCorteValida) return false;
    if (!this.cortePlan.articulo.trim()) return false;
    if (!this.cortePlan.colores.trim()) return false;
    if (!this.cortePlan.telaAsignada.trim()) return false;
    if (!this.cortePlan.articuloTela.trim()) return false;
    if (!this.cortePlan.tallerDestino.trim()) return false;
    if (!this.cortePlan.fechaNecesidadCorte.trim()) return false;
    if (!this.cortePlan.versionPlanificacion.trim()) return false;
    return true;
  }

  get estadoPlanCorteLabel(): string {
    const estado = this.cortePlan.estadoPlanificacion;
    if (estado === 'BORRADOR') return 'Borrador';
    if (estado === 'CONFIRMADO') return 'Confirmado';
    return 'Enviado a diseÃ±o';
  }

  get sumaMermaCorteReal(): number {
    return (Number(this.corteReal.restoKg) || 0)
      + (Number(this.corteReal.fallaKg) || 0)
      + (Number(this.corteReal.utilizableKg) || 0);
  }

  get excedeTelaUsadaCorteReal(): boolean {
    const telaUsada = Number(this.corteReal.telaUsadaKg) || 0;
    return this.sumaMermaCorteReal > (telaUsada + 0.01);
  }

  get balanceTelaCorteReal(): number {
    const telaUsada = Number(this.corteReal.telaUsadaKg) || 0;
    return Math.round((telaUsada - this.sumaMermaCorteReal) * 100) / 100;
  }

  get desvioConsumoCorteReal(): number | null {
    const teorico = Number(this.corteReal.consumoTeoricoKg);
    const real = Number(this.corteReal.telaUsadaKg);
    if (!Number.isFinite(teorico) || teorico <= 0 || !Number.isFinite(real)) return null;
    return Math.round((real - teorico) * 100) / 100;
  }

  get kgPorPrendaCorteReal(): number | null {
    const prendas = Number(this.corteReal.prendasCortadas) || 0;
    const telaUsada = Number(this.corteReal.telaUsadaKg) || 0;
    if (prendas <= 0 || telaUsada <= 0) return null;
    return Math.round((telaUsada / prendas) * 1000) / 1000;
  }

  get puedeGuardarCorteReal(): boolean {
    if (!this.esAreaCorte || !this.puedeEditarFormularioCorte) return false;
    if (!this.corteReal.corteNumero.trim()) return false;
    if (!this.corteReal.fechaCorte.trim()) return false;
    if (!this.corteReal.partidaTela.trim()) return false;
    if (!this.corteReal.responsable.trim()) return false;
    if ((Number(this.corteReal.telaUsadaKg) || 0) <= 0) return false;
    if ((Number(this.corteReal.pesoRealKg) || 0) <= 0) return false;
    if ((Number(this.corteReal.capas) || 0) <= 0) return false;
    if ((Number(this.corteReal.prendasCortadas) || 0) <= 0) return false;
    if (this.excedeTelaUsadaCorteReal) return false;
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

    return this.estaCompleta(anterior);
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

  async continuarSiguienteArea(): Promise<void> {
    if (!this.areaSeleccionada || !this.proyecto.idProyecto) {
      console.warn('⚠️ No se puede continuar: área o proyecto no seleccionado');
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

    const mensaje = this.esUltimaArea
      ? '¿Estás seguro de finalizar este proyecto?'
      : `¿Estás seguro de avanzar a ${this.siguienteArea?.nombre}?`;

    const confirmado = await this.alertas.confirmar(
      'Confirmar avance',
      mensaje,
      'Sí, continuar'
    );

    if (!confirmado) {
      console.log('❌ Usuario canceló la operación');
      return;
    }

    this.procesandoArea = true;
    const areaCompletada = this.areaSeleccionada;
    const siguienteDeCompletada = getSiguienteArea(areaCompletada);

    // Construir el DTO de actualización
    // ⭐ IMPORTANTE: Enviamos IdArea (int) no Area (string)
    const dto: any = {
      idArea: areaCompletada.idArea,
      porcentaje: 100
    };

    // Agregar observaciones si existen
    if (this.observacionArea && this.observacionArea.trim()) {
      dto.observaciones = this.observacionArea.trim();
    }

    console.log('📤 Enviando actualización de área:', {
      idProyecto: this.proyecto.idProyecto,
      areaSeleccionada: {
        id: areaCompletada.id,
        idArea: areaCompletada.idArea,  // ⭐ Este es el que va al backend
        nombre: areaCompletada.nombre,
        campo: areaCompletada.campo
      },
      dto: dto,
      endpoint: `${environment.apiUrl}/Proyecto/${this.proyecto.idProyecto}/avance`
    });

    this.proyectosService.actualizarAvance(this.proyecto.idProyecto, dto).subscribe({
      next: (response) => {
        console.log('✅ Área actualizada correctamente:', response);

        // Actualizar el proyecto localmente
        (this.proyecto as any)[areaCompletada.campo] = 100;
        this.actualizarProgresoVisual();

        this.procesandoArea = false;
        this.observacionArea = '';
        this.actualizado.emit();
        this.cdr.detectChanges();

        // Mostrar mensaje de éxito
        const mensajeExito = this.esUltimaArea
          ? '¡Área completada! Finalizando proyecto...'
          : `✅ ${areaCompletada.nombre} completada`;

        console.log(mensajeExito);

        // Si es la última área, marcar finalizado en UI y enviar a despacho
        if (this.esUltimaArea) {
          this.proyecto.estado = 'Finalizado';
          this.mandarADespachoInterno();
        } else if (siguienteDeCompletada) {
          // Pasar a la siguiente área
          this.seleccionarArea(siguienteDeCompletada);
        }

        if (this.esAreaControlCalidad) {
          this.reiniciarFormularioCalidad();
        }
      },
      error: (err) => {
        console.error('❌ Error al avanzar área:', err);
        console.error('📋 Detalles completos del error:', {
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
          console.error('💡 Posibles causas del error 400:');
          console.error('- El IdArea no existe en la tabla AreaProduccion');
          console.error('- El porcentaje está fuera de rango (0-100)');
          console.error('- Falta información requerida en el DTO');
          console.error('\n🔍 DTO enviado:', dto);
          console.error('🔍 IdArea enviado:', this.areaSeleccionada?.idArea);
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

    this.proyectosService.cambiarEstado(this.proyecto.idProyecto, 'Finalizado').subscribe({
      next: () => {
        this.proyecto.estado = 'Finalizado';
        this.actualizado.emit();
        this.alertas.success('Proyecto finalizado', '¡El proyecto se finalizó exitosamente!');
        this.mandarADespachoInterno();
      },
      error: (err) => {
        console.error('Error al finalizar proyecto:', err);
        this.alertas.error('Error', 'No se pudo finalizar el proyecto');
      }
    });
  }

  mandarADespachoInterno(): void {
    if (!this.proyecto.idProyecto) return;
    
    this.despachoService.crearDespacho({
      idProyecto: this.proyecto.idProyecto,
      observaciones: this.observacionArea?.trim() || undefined
    }).subscribe({
      next: () => {
        this.alertas.success('¡Enviado a Despacho!', 'El proyecto ya está disponible en el módulo de despacho.');
        this.cerrarModal();
      },
      error: (err) => {
        this.alertas.error('Error al despachar', err?.message || 'El proyecto se finalizó pero no se pudo generar el despacho.');
        this.cerrarModal();
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
        this.cdr.detectChanges();
        this.alertas.success('Área retrocedida', 'Se volvió al área anterior correctamente');
      },
      error: (err) => {
        console.error('❌ Error al retroceder área:', err);
        this.procesandoArea = false;
        this.alertas.error('Error', 'No se pudo retroceder el área');
      }
    });
  }

  async archivarProyecto(): Promise<void> {
    if (!this.proyecto.idProyecto) return;

    const confirmado = await this.alertas.confirmar(
      '¿Archivar proyecto?',
      `El proyecto "${this.proyecto.nombreProyecto}" ya no aparecerá en el tablero Kanban, pero podrá consultarlo en la lista de proyectos.`,
      'Sí, archivar'
    );

    if (!confirmado) return;

    this.procesandoArchivo = true;

    this.proyectosService.cambiarEstado(this.proyecto.idProyecto, 'Archivado').subscribe({
      next: () => {
        console.log('✅ Proyecto archivado exitosamente');
        this.proyecto.estado = 'Archivado';
        this.procesandoArchivo = false;
        this.actualizado.emit();
        this.alertas.success('Proyecto archivado', 'El proyecto se archivó correctamente');
        this.cerrarModal();
      },
      error: (err) => {
        console.error('❌ Error al archivar proyecto:', err);
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
        console.log('✅ Proyecto liberado exitosamente');
        this.proyecto.estado = 'Pendiente';
        this.procesandoLiberacion = false;
        this.actualizado.emit();
        this.alertas.success('Proyecto liberado', 'El proyecto volvió al tablero Kanban');
        this.cerrarModal();
      },
      error: (err) => {
        console.error('❌ Error al liberar proyecto:', err);
        this.alertas.error('Error', 'No se pudo liberar el proyecto');
        this.procesandoLiberacion = false;
      }
    });
  }

  // ==================== MÉTODOS DE OBSERVACIONES ====================

  agregarObservacion(): void {
    if (!this.nuevaObservacion.trim() || !this.proyecto.idProyecto) return;

    this.guardandoObservacion = true;

    const dto = {
      idUsuario: 3, // TODO: Obtener del servicio de auth
      descripcion: this.nuevaObservacion.trim()
    };

    this.proyectosService.agregarObservacion(this.proyecto.idProyecto, dto).subscribe({
      next: () => {
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

    if (!this.distribucionCorteValida) {
      this.alertas.error(
        'DistribuciÃ³n invÃ¡lida',
        `La suma de talles debe coincidir con el pedido total. Diferencia actual: ${this.diferenciaDistribucionCorte}.`
      );
      return;
    }

    const descripcion = this.construirResumenPlanCorte();
    const dto = {
      idUsuario: 3,
      descripcion
    };

    this.guardandoPlanCorte = true;
    this.proyectosService.agregarObservacion(this.proyecto.idProyecto, dto).subscribe({
      next: () => {
        if (!this.proyecto.observaciones) this.proyecto.observaciones = [];
        this.proyecto.observaciones.unshift({
          idObservacion: Date.now(),
          idUsuario: 3,
          nombreUsuario: 'Corte',
          fecha: new Date().toISOString(),
          descripcion
        });
        this.guardandoPlanCorte = false;
        this.refrescarHistorialPlanesCorte();
        this.alertas.success('Plan guardado', 'Se registrÃ³ el requerimiento de corte.');
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

    if (this.excedeTelaUsadaCorteReal) {
      this.alertas.error(
        'Datos inconsistentes',
        'La suma de resto + falla + utilizable supera la tela usada.'
      );
      return;
    }

    const descripcion = this.construirResumenCorteReal();
    const dto = {
      idUsuario: 3,
      descripcion
    };

    this.guardandoCorteReal = true;
    this.proyectosService.agregarObservacion(this.proyecto.idProyecto, dto).subscribe({
      next: () => {
        if (!this.proyecto.observaciones) this.proyecto.observaciones = [];
        this.proyecto.observaciones.unshift({
          idObservacion: Date.now(),
          idUsuario: 3,
          nombreUsuario: 'Corte',
          fecha: new Date().toISOString(),
          descripcion
        });
        this.guardandoCorteReal = false;
        this.refrescarHistorialCorteReal();
        this.alertas.success('Corte registrado', 'Se guardÃ³ el parte de corte real.');
      },
      error: (err) => {
        console.error('Error al guardar corte real:', err);
        this.guardandoCorteReal = false;
        this.alertas.error('Error', 'No se pudo guardar el parte de corte real');
      }
    });
  }

  guardarInspeccionCalidad(): void {
    if (!this.proyecto.idProyecto || !this.puedeGuardarInspeccionCalidad) return;

    const cantidadesTalle = this.obtenerCantidadesActualesFiltradas();
    if (Object.keys(cantidadesTalle).length === 0) {
      this.alertas.error('Inspección incompleta', 'Ingresá una cantidad inspeccionada en al menos un talle.');
      return;
    }

    const descripcion = this.construirResumenControlCalidad(cantidadesTalle);
    const dto = {
      idUsuario: 3,
      descripcion
    };

    this.guardandoInspeccionCalidad = true;
    this.proyectosService.agregarObservacion(this.proyecto.idProyecto, dto).subscribe({
      next: () => {
        if (!this.proyecto.observaciones) this.proyecto.observaciones = [];
        this.proyecto.observaciones.unshift({
          idObservacion: Date.now(),
          idUsuario: 3,
          nombreUsuario: 'Inspector',
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
      pedidoTotalPrendas: 0,
      distribucionTalles: [{ talle: 'GENERAL', cantidad: 0 }],
      colores: '',
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
    base.cliente = this.proyecto.clienteNombre ?? '';
    base.prenda = this.proyecto.tipoPrenda ?? '';
    base.pedidoTotalPrendas = Math.max(0, Number(this.proyecto.cantidadTotal ?? 0));
    base.distribucionTalles = this.obtenerObjetivoPorTalleArray();

    const ultimoPlan = this.obtenerUltimoPlanCorte();
    if (!ultimoPlan) {
      this.cortePlan = base;
      return;
    }

    this.cortePlan = {
      ...base,
      ...ultimoPlan,
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
      `prd=${this.codificarToken(this.cortePlan.prenda)}`,
      `art=${this.codificarToken(this.cortePlan.articulo)}`,
      `col=${this.codificarToken(this.cortePlan.colores)}`,
      `tel=${this.codificarToken(this.cortePlan.telaAsignada)}`,
      `atl=${this.codificarToken(this.cortePlan.articuloTela)}`,
      `tal=${this.codificarToken(this.cortePlan.tallerDestino)}`,
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

    return {
      cliente: this.decodificarToken(map.get('cli') ?? ''),
      prenda: this.decodificarToken(map.get('prd') ?? ''),
      articulo: this.decodificarToken(map.get('art') ?? ''),
      pedidoTotalPrendas: Math.max(0, Number(map.get('ped') ?? 0)),
      distribucionTalles,
      colores: this.decodificarToken(map.get('col') ?? ''),
      telaAsignada: this.decodificarToken(map.get('tel') ?? ''),
      articuloTela: this.decodificarToken(map.get('atl') ?? ''),
      tallerDestino: this.decodificarToken(map.get('tal') ?? ''),
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
      telaUsadaKg: 0,
      pesoRealKg: 0,
      pesoTizaKg: 0,
      capas: 0,
      restoKg: 0,
      fallaKg: 0,
      utilizableKg: 0,
      prendasCortadas: 0,
      responsable: '',
      estadoEjecucion: 'PENDIENTE',
      consumoTeoricoKg: null,
      capasTeoricas: null,
      referenciaExterna: '',
      observacionExterna: '',
      observacionesCorte: ''
    };
  }

  private inicializarFormularioCorteReal(): void {
    const base = this.crearCorteRealVacio();
    const ultimo = this.obtenerUltimoCorteReal();
    this.corteReal = ultimo ? { ...base, ...ultimo } : base;
  }

  private construirResumenCorteReal(): string {
    const resumen = [
      '[CORTE_REAL]',
      `cn=${this.codificarToken(this.corteReal.corteNumero)}`,
      `fc=${this.corteReal.fechaCorte || '-'}`,
      `pt=${this.codificarToken(this.corteReal.partidaTela)}`,
      `tu=${Number(this.corteReal.telaUsadaKg) || 0}`,
      `pr=${Number(this.corteReal.pesoRealKg) || 0}`,
      `pz=${Number(this.corteReal.pesoTizaKg) || 0}`,
      `ca=${Number(this.corteReal.capas) || 0}`,
      `re=${Number(this.corteReal.restoKg) || 0}`,
      `fa=${Number(this.corteReal.fallaKg) || 0}`,
      `ut=${Number(this.corteReal.utilizableKg) || 0}`,
      `pc=${Number(this.corteReal.prendasCortadas) || 0}`,
      `rs=${this.codificarToken(this.corteReal.responsable)}`,
      `es=${this.corteReal.estadoEjecucion}`,
      `ct=${this.corteReal.consumoTeoricoKg ?? '-'}`,
      `cpt=${this.corteReal.capasTeoricas ?? '-'}`,
      `rf=${this.codificarToken(this.corteReal.referenciaExterna || '-')}`,
      `oe=${this.codificarToken(this.corteReal.observacionExterna || '-')}`,
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

    return {
      corteNumero: this.decodificarToken(map.get('cn') ?? ''),
      fechaCorte: (map.get('fc') ?? '-') === '-' ? '' : (map.get('fc') ?? ''),
      partidaTela: this.decodificarToken(map.get('pt') ?? ''),
      telaUsadaKg: Number(map.get('tu') ?? 0) || 0,
      pesoRealKg: Number(map.get('pr') ?? 0) || 0,
      pesoTizaKg: Number(map.get('pz') ?? 0) || 0,
      capas: Number(map.get('ca') ?? 0) || 0,
      restoKg: Number(map.get('re') ?? 0) || 0,
      fallaKg: Number(map.get('fa') ?? 0) || 0,
      utilizableKg: Number(map.get('ut') ?? 0) || 0,
      prendasCortadas: Number(map.get('pc') ?? 0) || 0,
      responsable: this.decodificarToken(map.get('rs') ?? ''),
      estadoEjecucion: estado,
      consumoTeoricoKg: (map.get('ct') ?? '-') === '-' ? null : Number(map.get('ct')),
      capasTeoricas: (map.get('cpt') ?? '-') === '-' ? null : Number(map.get('cpt')),
      referenciaExterna: this.decodificarToken(map.get('rf') ?? ''),
      observacionExterna: this.decodificarToken(map.get('oe') ?? ''),
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
  pedidoTotalPrendas: number;
  distribucionTalles: DistribucionTallePlan[];
  colores: string;
  telaAsignada: string;
  articuloTela: string;
  tallerDestino: string;
  fechaNecesidadCorte: string;
  versionPlanificacion: string;
  estadoPlanificacion: EstadoPlanCorte;
  observacionesPlan: string;
}

type EstadoCorteReal = 'PENDIENTE' | 'EN_EJECUCION' | 'CERRADO';

interface CorteRealForm {
  corteNumero: string;
  fechaCorte: string;
  partidaTela: string;
  telaUsadaKg: number;
  pesoRealKg: number;
  pesoTizaKg: number;
  capas: number;
  restoKg: number;
  fallaKg: number;
  utilizableKg: number;
  prendasCortadas: number;
  responsable: string;
  estadoEjecucion: EstadoCorteReal;
  consumoTeoricoKg: number | null;
  capasTeoricas: number | null;
  referenciaExterna: string;
  observacionExterna: string;
  observacionesCorte: string;
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
