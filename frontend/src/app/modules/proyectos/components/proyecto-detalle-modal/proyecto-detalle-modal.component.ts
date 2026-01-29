import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProyectoVista } from '../../models/proyecto.model';
import { ProyectosService } from '../../services/proyectos.service';
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
  nuevoAvance: number = 0;
  observacionAvance: string = '';
  guardandoAvance = false;

  // Observaciones
  nuevaObservacion: string = '';
  guardandoObservacion = false;

  constructor(private proyectosService: ProyectosService) {}

  ngOnInit(): void {
    // Seleccionar área actual por defecto
    this.areaSeleccionada = getAreaActual(this.proyecto) || null;
    if (this.areaSeleccionada) {
      this.nuevoAvance = this.getAvanceArea(this.areaSeleccionada);
    }
  }

  // ==================== GETTERS ====================

  get areaActual(): AreaProduccion | undefined {
    return getAreaActual(this.proyecto);
  }

  get siguienteArea(): AreaProduccion | undefined {
    return this.areaActual ? getSiguienteArea(this.areaActual) : undefined;
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

  get puedeAvanzarSiguienteArea(): boolean {
    if (!this.areaSeleccionada || !this.siguienteArea) return false;
    return this.estaCompleta(this.areaSeleccionada);
  }

  // ==================== MÉTODOS DE ÁREAS ====================

  seleccionarArea(area: AreaProduccion): void {
    this.areaSeleccionada = area;
    this.nuevoAvance = this.getAvanceArea(area);
    this.observacionAvance = '';
  }

  ajustarAvance(cantidad: number): void {
    const nuevoValor = this.nuevoAvance + cantidad;
    
    // Limitar entre 0 y 100
    if (nuevoValor < 0) {
      this.nuevoAvance = 0;
    } else if (nuevoValor > 100) {
      this.nuevoAvance = 100;
    } else {
      this.nuevoAvance = nuevoValor;
    }
  }

  actualizarAvance(): void {
    if (!this.areaSeleccionada || !this.proyecto.idProyecto) return;

    if (this.nuevoAvance < 0 || this.nuevoAvance > 100) {
      alert('El avance debe estar entre 0 y 100');
      return;
    }

    this.guardandoAvance = true;

    const dto = {
      area: this.areaSeleccionada.campo,
      porcentaje: this.nuevoAvance,
      observaciones: this.observacionAvance || undefined
    };

    this.proyectosService.actualizarAvance(this.proyecto.idProyecto, dto).subscribe({
      next: () => {
        // Actualizar el proyecto localmente
        (this.proyecto as any)[this.areaSeleccionada!.campo] = this.nuevoAvance;
        
        this.guardandoAvance = false;
        this.observacionAvance = '';
        this.actualizado.emit();
        
        // Si completó esta área, pasar a la siguiente
        if (this.nuevoAvance === 100 && this.siguienteArea) {
          this.seleccionarArea(this.siguienteArea);
        }
      },
      error: (err) => {
        console.error('Error al actualizar avance:', err);
        alert('Error al actualizar el avance');
        this.guardandoAvance = false;
      }
    });
  }

  avanzarSiguienteArea(): void {
    if (!this.siguienteArea) return;
    this.seleccionarArea(this.siguienteArea);
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
        alert('Error al agregar la observación');
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