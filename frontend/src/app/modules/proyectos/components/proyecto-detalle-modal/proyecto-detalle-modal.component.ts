import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProyectoVista } from '../../models/proyecto.model';
import { ProyectosService } from '../../services/proyecto.service';
import { AlertasService } from '../../../../core/services/alertas';
import { environment } from '../../../../../environments/environment';
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
  @Output() cerrar = new EventEmitter<void>();
  @Output() actualizado = new EventEmitter<void>();

  // Tabs
  tabActiva: 'info' | 'areas' | 'materiales' | 'observaciones' = 'areas';

  // Áreas
  readonly AREAS = AREAS_PRODUCCION;
  areaSeleccionada: AreaProduccion | null = null;
  observacionArea: string = '';
  procesandoArea = false;

  // Observaciones generales
  nuevaObservacion: string = '';
  guardandoObservacion = false;

  // Archivar/Liberar proyecto
  procesandoArchivo = false;
  procesandoLiberacion = false;

  constructor(
    private proyectosService: ProyectosService,
    private alertas: AlertasService
  ) { }

  ngOnInit(): void {
    // Seleccionar área actual por defecto
    this.areaSeleccionada = getAreaActual(this.proyecto) || AREAS_PRODUCCION[0];
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
  }

  async continuarSiguienteArea(): Promise<void> {
    if (!this.areaSeleccionada || !this.proyecto.idProyecto) {
      console.warn('⚠️ No se puede continuar: área o proyecto no seleccionado');
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

    // Construir el DTO de actualización
    // ⭐ IMPORTANTE: Enviamos IdArea (int) no Area (string)
    const dto: any = {
      IdArea: this.areaSeleccionada.idArea,  // ⭐ ID de la tabla AreaProduccion
      Porcentaje: 100
    };

    // Agregar observaciones si existen
    if (this.observacionArea && this.observacionArea.trim()) {
      dto.Observaciones = this.observacionArea.trim();
    }

    console.log('📤 Enviando actualización de área:', {
      idProyecto: this.proyecto.idProyecto,
      areaSeleccionada: {
        id: this.areaSeleccionada.id,
        idArea: this.areaSeleccionada.idArea,  // ⭐ Este es el que va al backend
        nombre: this.areaSeleccionada.nombre,
        campo: this.areaSeleccionada.campo
      },
      dto: dto,
      endpoint: `${environment.apiUrl}/Proyecto/${this.proyecto.idProyecto}/avance`
    });

    this.proyectosService.actualizarAvance(this.proyecto.idProyecto, dto).subscribe({
      next: (response) => {
        console.log('✅ Área actualizada correctamente:', response);

        // Actualizar el proyecto localmente
        (this.proyecto as any)[this.areaSeleccionada!.campo] = 100;

        this.procesandoArea = false;
        this.observacionArea = '';
        this.actualizado.emit();

        // Mostrar mensaje de éxito
        const mensajeExito = this.esUltimaArea
          ? '¡Área completada! Finalizando proyecto...'
          : `✅ ${this.areaSeleccionada!.nombre} completada`;

        console.log(mensajeExito);

        // Si es la última área, cambiar estado a Finalizado
        if (this.esUltimaArea) {
          setTimeout(() => this.finalizarProyecto(), 500);
        } else if (this.siguienteArea) {
          // Pasar a la siguiente área
          setTimeout(() => this.seleccionarArea(this.siguienteArea!), 500);
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
}
