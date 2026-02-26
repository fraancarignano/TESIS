import { Component, Input, Output, EventEmitter, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ObservacionProyecto, ProyectoVista } from '../../models/proyecto.model';
import { ProyectosService } from '../../services/proyecto.service';
import { AlertasService } from '../../../../core/services/alertas';
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

  // Observaciones generales
  nuevaObservacion: string = '';
  guardandoObservacion = false;

  // Archivar/Liberar proyecto
  procesandoArchivo = false;
  procesandoLiberacion = false;

  constructor(
    private proyectosService: ProyectosService,
    private alertas: AlertasService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    // Seleccionar área actual por defecto
    this.areaSeleccionada = getAreaActual(this.proyecto) || AREAS_PRODUCCION[0];
    this.refrescarHistorialInspeccionesCalidad();
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

  get puedeEditarFormularioCalidad(): boolean {
    if (!this.esAreaControlCalidad) return false;
    if (!this.puedeGestionarAvance) return false;
    if (this.areaSeleccionada && this.estaCompleta(this.areaSeleccionada)) return false;
    const anterior = this.areaAnteriorSeleccionada;
    if (anterior && !this.estaCompleta(anterior)) return false;
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
    if (this.estaCompleta(this.areaSeleccionada)) return false;

    const anterior = this.areaAnteriorSeleccionada;
    if (!anterior) return true;

    return this.estaCompleta(anterior);
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

        // Si es la última área, marcar finalizado en UI (el backend lo persiste)
        if (this.esUltimaArea) {
          this.proyecto.estado = 'Finalizado';
          this.alertas.success('Proyecto finalizado', '¡El proyecto se finalizó exitosamente!');
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
