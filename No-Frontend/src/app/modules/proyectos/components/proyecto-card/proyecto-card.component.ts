import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Proyecto, ProyectoVista } from '../../models/proyecto.model';
import { 
  AREAS_PRODUCCION, 
  getAreaActual, 
  calcularProgresoGeneralPorAreas,
  getResumenAreas,
  getColorProgreso,
  areaEstaCompleta,
  areaEnProgreso
} from '../../constants/areas.constants';

@Component({
  selector: 'app-proyecto-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './proyecto-card.component.html',
  styleUrls: ['./proyecto-card.component.css']
})
export class ProyectoCardComponent {
  @Input() proyecto!: ProyectoVista;  // ← Cambiar a ProyectoVista
  @Output() verDetalle = new EventEmitter<ProyectoVista>();  // ← Cambiar a ProyectoVista

  // Constantes accesibles desde el template
  readonly AREAS = AREAS_PRODUCCION;

  /**
   * Obtener progreso general del proyecto
   */
  get progresoGeneral(): number {
    return calcularProgresoGeneralPorAreas(this.proyecto);
  }

  /**
   * Obtener área actual del proyecto
   */
  get areaActual() {
    return getAreaActual(this.proyecto);
  }

  /**
   * Obtener resumen de áreas
   */
  get resumenAreas() {
    return getResumenAreas(this.proyecto);
  }

  /**
   * Obtener color de la barra de progreso
   */
  get colorProgreso(): string {
    return getColorProgreso(this.progresoGeneral);
  }

  /**
   * Obtener avance de un área específica
   */
  getAvanceArea(campo: string): number {
    return (this.proyecto as any)[campo] ?? 0;
  }

  /**
   * Verificar si un área está completa
   */
  estaCompleta(area: any): boolean {
    return areaEstaCompleta(this.proyecto, area);
  }

  /**
   * Verificar si un área está en progreso
   */
  enProgreso(area: any): boolean {
    return areaEnProgreso(this.proyecto, area);
  }

  /**
   * Obtener clase de prioridad
   */
  get clasePrioridad(): string {
    switch (this.proyecto.prioridad) {
      case 'alta': return 'prioridad-alta';
      case 'media': return 'prioridad-media';
      case 'baja': return 'prioridad-baja';
      default: return '';
    }
  }

  /**
   * Emitir evento para ver detalle
   */
  onVerDetalle(): void {
    this.verDetalle.emit(this.proyecto);
  }
}